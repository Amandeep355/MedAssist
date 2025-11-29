# ml/biobert_rag.py

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import List, Dict, Any, Tuple

import torch
from transformers import AutoTokenizer, AutoModel


# Path to the knowledge base JSON (same folder as this file)
BASE_DIR = Path(__file__).resolve().parent
KB_PATH = BASE_DIR / "knowledge_base.json"

# Name of the BioBERT model
BIOBERT_MODEL_NAME = "dmis-lab/biobert-base-cased-v1.1"

_tokenizer = None
_model = None
_BIOBERT_AVAILABLE = False
_BIOBERT_ERROR = None


def _load_knowledge_base() -> List[Dict[str, Any]]:
    if not KB_PATH.exists():
        print(f"[BioBERT-RAG] knowledge_base.json not found at {KB_PATH}")
        return []
    try:
        with KB_PATH.open("r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict):
            # allow {"documents": [...]} style
            data = data.get("documents", [])
        print(f"[BioBERT-RAG] Loaded {len(data)} knowledge items")
        return data
    except Exception as e:
        print("[BioBERT-RAG] Failed to load knowledge base:", repr(e))
        return []


_KB_DOCS = _load_knowledge_base()


def _try_load_biobert() -> None:
    """
    Tries to load BioBERT *only from local cache*.
    If not available, sets _BIOBERT_AVAILABLE=False and logs the error.

    This avoids trying to hit huggingface.co when you are offline.
    """
    global _tokenizer, _model, _BIOBERT_AVAILABLE, _BIOBERT_ERROR

    if _tokenizer is not None and _model is not None:
        _BIOBERT_AVAILABLE = True
        return

    try:
        print("[BioBERT-RAG] Trying to load BioBERT from local cache...")
        _tokenizer = AutoTokenizer.from_pretrained(
            BIOBERT_MODEL_NAME, local_files_only=True
        )
        _model = AutoModel.from_pretrained(
            BIOBERT_MODEL_NAME, local_files_only=True
        )
        _model.eval()
        _BIOBERT_AVAILABLE = True
        _BIOBERT_ERROR = None
        print("[BioBERT-RAG] BioBERT loaded successfully from local cache.")
    except Exception as e:
        _BIOBERT_AVAILABLE = False
        _BIOBERT_ERROR = e
        print(
            "[BioBERT-RAG] Could not load BioBERT from local cache. "
            "Falling back to simple keyword-based scoring.\n",
            "Error:",
            repr(e),
        )


def _encode_text(text: str) -> torch.Tensor:
    inputs = _tokenizer(
        text,
        padding=True,
        truncation=True,
        max_length=256,
        return_tensors="pt",
    )
    with torch.no_grad():
        outputs = _model(**inputs)
    # mean-pool last hidden state
    last_hidden = outputs.last_hidden_state  # (1, seq_len, hidden)
    mask = inputs.attention_mask.unsqueeze(-1)  # (1, seq_len, 1)
    masked = last_hidden * mask
    summed = masked.sum(dim=1)
    counts = mask.sum(dim=1).clamp(min=1)
    return (summed / counts).squeeze(0)  # (hidden_dim,)


def _cosine_similarity(a: torch.Tensor, b: torch.Tensor) -> float:
    a_norm = a / (a.norm(p=2) + 1e-8)
    b_norm = b / (b.norm(p=2) + 1e-8)
    return float(torch.sum(a_norm * b_norm).item())


def _simple_keyword_score(query_tokens: List[str], text: str) -> float:
    """
    Fallback scoring when BioBERT is not available:
    simple keyword overlap between query tokens and document text.
    """
    text_lower = text.lower()
    score = 0
    for tok in query_tokens:
        if tok and tok.lower() in text_lower:
            score += 1
    return float(score)


def get_relevant_snippets(
    symptoms: List[str],
    primary_diagnosis: str,
    top_k: int = 3,
    min_score: float = 0.2,
) -> List[Dict[str, Any]]:
    """
    Returns a list of knowledge snippets relevant to the symptoms / primary
    diagnosis. Uses BioBERT if available locally; otherwise falls back to a
    simple keyword-based ranking on `knowledge_base.json`.
    """

    if not _KB_DOCS:
        return []

    # Build a simple query string from symptoms + primary dx
    symptoms_text = ", ".join(symptoms)
    query = f"Symptoms: {symptoms_text}. Likely diagnosis: {primary_diagnosis}."

    # Try loading BioBERT from local cache once
    if not _BIOBERT_AVAILABLE and _BIOBERT_ERROR is None:
        _try_load_biobert()

    scores: List[Tuple[float, Dict[str, Any]]] = []

    if _BIOBERT_AVAILABLE:
        # Use BioBERT embeddings
        try:
            query_vec = _encode_text(query)
            doc_vectors: List[torch.Tensor] = []

            for doc in _KB_DOCS:
                content = str(doc.get("content") or doc.get("text") or "")
                title = str(doc.get("title") or "")
                combined = f"{title}. {content}"
                vec = _encode_text(combined)
                doc_vectors.append(vec)

            for doc, vec in zip(_KB_DOCS, doc_vectors):
                sim = _cosine_similarity(query_vec, vec)
                scores.append((sim, doc))
        except Exception as e:
            # If anything goes wrong, fall back to keyword matching
            print(
                "[BioBERT-RAG] Error during embedding/scoring, "
                "falling back to keyword-based scoring:",
                repr(e),
            )
            query_tokens = symptoms + [primary_diagnosis]
            for doc in _KB_DOCS:
                content = str(doc.get("content") or doc.get("text") or "")
                title = str(doc.get("title") or "")
                combined = f"{title}. {content}"
                sim = _simple_keyword_score(query_tokens, combined)
                scores.append((sim, doc))
    else:
        # No BioBERT: keyword overlap only
        query_tokens = symptoms + [primary_diagnosis]
        for doc in _KB_DOCS:
            content = str(doc.get("content") or doc.get("text") or "")
            title = str(doc.get("title") or "")
            combined = f"{title}. {content}"
            sim = _simple_keyword_score(query_tokens, combined)
            scores.append((sim, doc))

    # Sort by score descending, filter by min_score
    scores.sort(key=lambda x: x[0], reverse=True)

    snippets: List[Dict[str, Any]] = []
    for score, doc in scores[:top_k]:
        if score < min_score:
            continue
        snippets.append(
            {
                "id": str(doc.get("id", "")),
                "title": str(doc.get("title", "Practice tip")),
                "content": str(doc.get("content") or doc.get("text") or ""),
                "source": doc.get("source", "Offline ruleset"),
                "score": float(score),
            }
        )

    return snippets

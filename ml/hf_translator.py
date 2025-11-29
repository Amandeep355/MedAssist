# ml/hf_translator.py

from typing import Tuple
from functools import lru_cache

import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

# We support English + 4 Indic languages
SUPPORTED_LANGS = {"en", "hi", "ta", "te", "bn"}

# Direction-specific models (all are small-ish OPUS-MT models)
MODEL_NAMES = {
    ("hi", "en"): "Helsinki-NLP/opus-mt-hi-en",
    ("en", "hi"): "Helsinki-NLP/opus-mt-en-hi",
    ("ta", "en"): "Helsinki-NLP/opus-mt-ta-en",
    ("en", "ta"): "Helsinki-NLP/opus-mt-en-ta",
    ("te", "en"): "Helsinki-NLP/opus-mt-te-en",
    ("en", "te"): "Helsinki-NLP/opus-mt-en-te",
    ("bn", "en"): "Helsinki-NLP/opus-mt-bn-en",
    ("en", "bn"): "Helsinki-NLP/opus-mt-en-bn",
}


@lru_cache(maxsize=16)
def _load_model(
    src_lang: str, tgt_lang: str
) -> Tuple[AutoTokenizer, AutoModelForSeq2SeqLM, torch.device]:
    """
    Lazy-load a translation model the first time we need a given language pair.
    The model is cached in memory afterwards.

    IMPORTANT: local_files_only=True makes this offline-friendly.
    If the model has never been downloaded while online, this will raise
    and translate_text will simply return the original text.
    """
    key = (src_lang, tgt_lang)
    if key not in MODEL_NAMES:
        raise ValueError(f"No translation model for {src_lang} -> {tgt_lang}")

    model_name = MODEL_NAMES[key]
    print(f"[hf_translator] Loading model: {model_name} ({src_lang} -> {tgt_lang})")

    tokenizer = AutoTokenizer.from_pretrained(model_name, local_files_only=True)
    model = AutoModelForSeq2SeqLM.from_pretrained(
        model_name, local_files_only=True
    )

    # CPU is fine for your use-case
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()

    return tokenizer, model, device


def translate_text(text: str, src_lang: str, tgt_lang: str) -> str:
    """
    Translate text from src_lang to tgt_lang using a Hugging Face model.
    Falls back to the original text on any error.
    """
    text = text.strip()
    if not text:
        return text

    # If languages are same or unsupported, just return the text
    if src_lang == tgt_lang:
        return text
    if src_lang not in SUPPORTED_LANGS or tgt_lang not in SUPPORTED_LANGS:
        return text

    try:
        tokenizer, model, device = _load_model(src_lang, tgt_lang)

        inputs = tokenizer(
            text, return_tensors="pt", padding=True, truncation=True
        ).to(device)
        with torch.no_grad():
            output_tokens = model.generate(
                **inputs,
                max_new_tokens=128,
                num_beams=4,
            )
        result = tokenizer.batch_decode(
            output_tokens, skip_special_tokens=True
        )
        return result[0].strip()
    except Exception as e:
        print(
            f"[hf_translator] Translation error ({src_lang}->{tgt_lang}):",
            repr(e),
        )
        return text

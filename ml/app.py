# ml/app.py

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from fastapi.responses import JSONResponse
import json

from biobert_rag import get_relevant_snippets

# Try to import local translator
try:
    from hf_translator import translate_text as _hf_translate_text
except Exception as e:
    _hf_translate_text = None
    print("[Translator] hf_translator not available or import failed:", repr(e))


def translate_text(text: str, target_lang: str) -> str:
    """
    Wrapper around hf_translator.translate_text(text, src_lang, tgt_lang).

    All reasoning in this service is done in ENGLISH, so:
      - src_lang is always "en"
      - tgt_lang is the UI language (hi/ta/te/bn)

    If translator is missing or target_lang == "en", we just return the original text.
    """
    if not text:
        return text
    if target_lang == "en":
        return text
    if _hf_translate_text is None:
        return text

    try:
        # Source language is always English
        return _hf_translate_text(text, "en", target_lang)
    except Exception as e:
        print("[Translator] Error translating text:", repr(e))
        return text


app = FastAPI(
    title="MedAssist NLP Service",
    default_response_class=JSONResponse,
)

# --------------- CORS CONFIG ---------------

origins = [
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # for dev you can use ["*"] if you want
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------- MODELS ---------------


class VitalSigns(BaseModel):
    temperature: Optional[float] = None
    bloodPressure: Optional[str] = None
    heartRate: Optional[int] = None
    respiratoryRate: Optional[int] = None
    oxygenSaturation: Optional[float] = None


class DiagnosisRequest(BaseModel):
    patientId: Optional[str] = None
    symptoms: List[str]
    vitalSigns: Optional[VitalSigns] = None
    patientAge: int
    patientGender: str
    patientWeight: Optional[float] = None
    symptoms_text: Optional[str] = None  # kept for schema, but not used for logic
    language: str = "en"  # "en" | "hi" | "ta" | "te" | "bn"


class DifferentialDiagnosis(BaseModel):
    condition: str
    confidence: int
    reasoning: Optional[str] = None


class TreatmentMed(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration: str


class TreatmentProtocol(BaseModel):
    medications: Optional[List[TreatmentMed]] = None
    procedures: Optional[List[str]] = None
    lifestyle: Optional[List[str]] = None


class DiagnosisResponse(BaseModel):
    primaryDiagnosis: str
    differentialDiagnoses: List[DifferentialDiagnosis]
    treatmentProtocol: Optional[TreatmentProtocol] = None
    requiresReferral: bool = False
    referralReason: Optional[str] = None


# --------------- SYMPTOM NORMALISATION ---------------

# Canonical English symptom keys we use internally (lowercase)
CANONICAL_SYMPTOMS = [
    "fever",
    "cough",
    "headache",
    "body ache",
    "nausea",
    "vomiting",
    "diarrhea",
    "abdominal pain",
    "chest pain",
    "shortness of breath",
    "fatigue",
    "dizziness",
    "rash",
    "sore throat",
    "runny nose",
]

# Map LOCAL LANGUAGE LABEL → canonical English key
SYMPTOM_NORMALIZATION: Dict[str, Dict[str, str]] = {
    # English (extra synonyms)
    "en": {
        "fever": "fever",
        "cough": "cough",
        "headache": "headache",
        "body ache": "body ache",
        "bodyache": "body ache",
        "body pain": "body ache",
        "nausea": "nausea",
        "vomiting": "vomiting",
        "diarrhea": "diarrhea",
        "loose stools": "diarrhea",
        "stomach pain": "abdominal pain",
        "abdominal pain": "abdominal pain",
        "chest pain": "chest pain",
        "shortness of breath": "shortness of breath",
        "breathlessness": "shortness of breath",
        "fatigue": "fatigue",
        "tiredness": "fatigue",
        "dizziness": "dizziness",
        "giddiness": "dizziness",
        "rash": "rash",
        "skin rash": "rash",
        "sore throat": "sore throat",
        "throat pain": "sore throat",
        "runny nose": "runny nose",
        "cold": "runny nose",
    },
    # Hindi
    "hi": {
        "बुखार": "fever",
        "खांसी": "cough",
        "सिरदर्द": "headache",
        "शरीर दर्द": "body ache",
        "मतली": "nausea",
        "उल्टी": "vomiting",
        "दस्त": "diarrhea",
        "पेट दर्द": "abdominal pain",
        "सीने में दर्द": "chest pain",
        "सांस की तकलीफ": "shortness of breath",
        "थकान": "fatigue",
        "चक्कर आना": "dizziness",
        "चकत्ते": "rash",
        "गले में खराश": "sore throat",
        "बहती नाक": "runny nose",
    },
    # Tamil
    "ta": {
        "காய்ச்சல்": "fever",
        "இருமல்": "cough",
        "தலைவலி": "headache",
        "உடல் வலி": "body ache",
        "குமட்டல்": "nausea",
        "வாந்தி": "vomiting",
        "வயிற்றுப்போக்கு": "diarrhea",
        "வயிற்று வலி": "abdominal pain",
        "மார்பு வலி": "chest pain",
        "மூச்சுத் திணறல்": "shortness of breath",
        "சோர்வு": "fatigue",
        "தலைச்சுற்றல்": "dizziness",
        "தடிப்பு": "rash",
        "தொண்டை வலி": "sore throat",
        "மூக்கு ஒழுகுதல்": "runny nose",
    },
    # Telugu
    "te": {
        "జ్వరం": "fever",
        "దగ్గు": "cough",
        "తలనొప్పి": "headache",
        "శరీర నొప్పి": "body ache",
        "వికారం": "nausea",
        "వాంతులు": "vomiting",
        "విరేచనాలు": "diarrhea",
        "పొట్ట నొప్పి": "abdominal pain",
        "ఛాతీ నొప్పి": "chest pain",
        "ఊపిరి పీల్చుకోవడంలో ఇబ్బంది": "shortness of breath",
        "అలసట": "fatigue",
        "తలతిరగడం": "dizziness",
        "దద్దుర్లు": "rash",
        "గొంతు నొప్పి": "sore throat",
        "ముక్కు కారడం": "runny nose",
    },
    # Bengali
    "bn": {
        "জ্বর": "fever",
        "কাশি": "cough",
        "মাথাব্যথা": "headache",
        "শরীর ব্যথা": "body ache",
        "বমি বমি ভাব": "nausea",
        "বমি": "vomiting",
        "ডায়রিয়া": "diarrhea",
        "পেট ব্যথা": "abdominal pain",
        "বুকে ব্যথা": "chest pain",
        "শ্বাসকষ্ট": "shortness of breath",
        "ক্লান্তি": "fatigue",
        "মাথা ঘোরা": "dizziness",
        "ফুসকুড়ি": "rash",
        "গলা ব্যথা": "sore throat",
        "নাক দিয়ে পানি পড়া": "runny nose",
    },
}


def normalize_symptom(symptom: str, language: str) -> str:
    """Map a visible symptom label into a canonical English key."""
    s = symptom.strip().lower()
    lang_map = SYMPTOM_NORMALIZATION.get(language, {})
    if s in lang_map:
        return lang_map[s]

    # Fallback: try English map
    en_map = SYMPTOM_NORMALIZATION["en"]
    if s in en_map:
        return en_map[s]

    # Unknown – just return lowercased string so we still show *something*
    return s


def normalize_symptoms(symptoms: List[str], language: str) -> List[str]:
    return [normalize_symptom(s, language) for s in symptoms]


# --------------- SIMPLE RULES (on canonical symptoms) ---------------

SYMPTOM_TO_PRIMARY: Dict[str, str] = {
    "fever": "Acute febrile illness (likely viral)",
    "cough": "Acute respiratory infection",
    "shortness of breath": "Possible lower respiratory involvement",
    "chest pain": "Non-specific chest pain – evaluate cardiac & respiratory causes",
    "diarrhea": "Acute gastro-intestinal infection",
    "abdominal pain": "Non-specific abdominal pain",
    "headache": "Acute headache – likely tension or viral",
    "rash": "Non-specific skin eruption",
    "fatigue": "Non-specific fatigue",
    "dizziness": "Non-specific dizziness / presyncope",
}


def infer_primary(canonical_symptoms: List[str]) -> str:
    for s in canonical_symptoms:
        key = s.lower()
        if key in SYMPTOM_TO_PRIMARY:
            return SYMPTOM_TO_PRIMARY[key]
    if canonical_symptoms:
        return f"Non-specific illness ({canonical_symptoms[0]})"
    return "Non-specific illness"


def parse_bp(bp_str: Optional[str]):
    if not bp_str:
        return None
    try:
        s, d = bp_str.replace(" ", "").split("/")
        return int(s), int(d)
    except Exception:
        return None


def check_red_flags(req: DiagnosisRequest):
    v = req.vitalSigns
    if not v:
        return False, None

    if v.temperature and v.temperature >= 103:
        return True, "High fever – urgent evaluation needed."

    if v.oxygenSaturation is not None and v.oxygenSaturation < 90:
        return True, "Low oxygen saturation – risk of respiratory distress."

    bp = parse_bp(v.bloodPressure)
    if bp:
        sys, dia = bp
        if sys < 90 or dia < 60:
            return True, "Very low blood pressure – risk of shock."

    return False, None


def build_differentials(
    primary: str, canonical_symptoms: List[str]
) -> List[DifferentialDiagnosis]:
    lower = [s.lower() for s in canonical_symptoms]

    if "fever" in lower:
        return [
            DifferentialDiagnosis(
                condition="Viral infection",
                confidence=70,
                reasoning="Common with simple fever in primary care.",
            ),
            DifferentialDiagnosis(
                condition="Bacterial infection",
                confidence=30,
                reasoning="Consider if fever is persistent, very high, or focal.",
            ),
        ]

    return [
        DifferentialDiagnosis(
            condition=primary,
            confidence=60,
            reasoning="Most likely explanation based on available symptoms.",
        ),
        DifferentialDiagnosis(
            condition="Other non-specific causes",
            confidence=40,
            reasoning="Symptoms are non-specific; monitor and review.",
        ),
    ]


def build_treatment(
    canonical_symptoms: List[str], red_flag: bool
) -> TreatmentProtocol:
    meds: List[TreatmentMed] = []
    procedures: List[str] = []
    lifestyle: List[str] = []

    lower = [s.lower() for s in canonical_symptoms]

    if "fever" in lower:
        meds.append(
            TreatmentMed(
                name="Paracetamol (generic)",
                dosage="Dose as per local protocol",
                frequency="As needed for fever (respect max daily dose)",
                duration="Usually 2–3 days, reassess if persistent",
            )
        )
        lifestyle.append("Encourage oral fluids and light clothing.")
        lifestyle.append("Advise rest and light diet.")

    if "cough" in lower:
        lifestyle.append("Avoid smoke/irritants; warm fluids can help.")

    if "diarrhea" in lower:
        lifestyle.append("Use oral rehydration solution as per local protocol.")
        lifestyle.append("Watch for signs of dehydration.")

    if red_flag:
        procedures.append("Arrange urgent referral / higher-level evaluation.")

    lifestyle.append(
        "Return if symptoms worsen, new red-flag signs appear, or recovery is delayed."
    )

    return TreatmentProtocol(
        medications=meds or None,
        procedures=procedures or None,
        lifestyle=lifestyle or None,
    )


# --------------- HEALTH CHECK ---------------


@app.get("/health")
async def health_check() -> Dict[str, Any]:
    return {"status": "ok", "service": "medassist-nlp"}


# --------------- MAIN NLP + RAG ENDPOINT ---------------


@app.post("/analyze", response_model=DiagnosisResponse)
async def analyze(req: DiagnosisRequest):
    """
    Main NLP endpoint (offline version).

    - Accepts structured symptoms from the UI (no online translation).
    - Normalises symptoms to canonical English.
    - Runs simple rules to generate primary + differentials + treatment.
    - Calls BioBERT RAG (`get_relevant_snippets`) for guideline snippets.
    - Returns output plus `knowledgeSnippets`.
      Translation into local language is done here using hf_translator.
    """

    try:
        # 1) We require structured symptoms from the UI
        if not req.symptoms or len(req.symptoms) == 0:
            raise ValueError("No symptoms provided; please select from the list.")

        # Normalise from visible labels → canonical English
        canonical_symptoms = normalize_symptoms(req.symptoms, req.language)

        # 2) Core reasoning in English
        primary = infer_primary(canonical_symptoms)
        red_flag, reason = check_red_flags(req)
        diffs = build_differentials(primary, canonical_symptoms)
        treatment = build_treatment(canonical_symptoms, red_flag)

        # 3) BioBERT RAG on canonical English symptoms
        rag_snippets = get_relevant_snippets(
            symptoms=canonical_symptoms,
            primary_diagnosis=primary,
            top_k=3,
            min_score=0.2,
        )

        # 4) Build base response (initially English)
        response = DiagnosisResponse(
            primaryDiagnosis=primary,
            differentialDiagnoses=diffs,
            treatmentProtocol=treatment,
            requiresReferral=red_flag,
            referralReason=reason,
        )

        base: Dict[str, Any] = json.loads(response.json())
        base["knowledgeSnippets"] = rag_snippets

        # 5) Translate all user-facing text if needed
        target_lang = req.language or "en"
        if target_lang != "en":
            # primary diagnosis
            base["primaryDiagnosis"] = translate_text(
                base.get("primaryDiagnosis", ""), target_lang
            )

            # differential diagnoses
            for d in base.get("differentialDiagnoses", []):
                d["condition"] = translate_text(d.get("condition", ""), target_lang)
                if d.get("reasoning"):
                    d["reasoning"] = translate_text(d["reasoning"], target_lang)

            # referral reason
            if base.get("referralReason"):
                base["referralReason"] = translate_text(
                    base["referralReason"], target_lang
                )

            # treatment protocol
            tp = base.get("treatmentProtocol")
            if tp:
                meds = tp.get("medications") or []
                for m in meds:
                    m["name"] = translate_text(m.get("name", ""), target_lang)
                    m["dosage"] = translate_text(m.get("dosage", ""), target_lang)
                    m["frequency"] = translate_text(
                        m.get("frequency", ""), target_lang
                    )
                    m["duration"] = translate_text(m.get("duration", ""), target_lang)

                procedures = tp.get("procedures") or []
                tp["procedures"] = [
                    translate_text(p, target_lang) for p in procedures
                ] or None

                lifestyle = tp.get("lifestyle") or []
                tp["lifestyle"] = [
                    translate_text(l, target_lang) for l in lifestyle
                ] or None

            # knowledge snippets
            for snip in base.get("knowledgeSnippets", []):
                snip["title"] = translate_text(snip.get("title", ""), target_lang)
                snip["content"] = translate_text(
                    snip.get("content", ""), target_lang
                )
                if snip.get("source"):
                    snip["source"] = translate_text(
                        snip.get("source", ""), target_lang
                    )

        return JSONResponse(
            content=base, status_code=200, media_type="application/json"
        )

    except Exception as e:
        # Log and return a graceful fallback (still matching schema)
        print("NLP Error in /analyze:", repr(e))

        fallback = DiagnosisResponse(
            primaryDiagnosis="NLP processing error",
            differentialDiagnoses=[
                DifferentialDiagnosis(
                    condition="Unknown",
                    confidence=100,
                    reasoning=str(e),
                )
            ],
            treatmentProtocol=None,
            requiresReferral=False,
            referralReason=None,
        )

        base = json.loads(fallback.json())
        base["knowledgeSnippets"] = []

        return JSONResponse(
            content=base, status_code=200, media_type="application/json"
        )

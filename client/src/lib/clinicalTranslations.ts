// client/src/lib/clinicalTranslations.ts

import type { Language } from "@/contexts/LanguageContext";

// Map: language -> original English text -> translated text
const clinicalTranslations: Record<Language, Record<string, string>> = {
  en: {},

  hi: {
    // Primary diagnoses
    "Acute febrile illness (likely viral)":
      "तीव्र ज्वर संबंधी बीमारी (संभावित वायरल)",
    "Acute respiratory infection": "तीव्र श्वसन संक्रमण",
    "Possible lower respiratory involvement":
      "निचले श्वसन तंत्र की संभावित भागीदारी",
    "Non-specific chest pain – evaluate cardiac & respiratory":
      "गैर-विशिष्ट सीने में दर्द – हृदय और श्वसन कारणों का मूल्यांकन करें",
    "Acute gastro-intestinal infection": "तीव्र जठरांत्र संक्रमण",
    "Non-specific abdominal pain": "गैर-विशिष्ट पेट दर्द",
    "Acute headache – likely tension or viral":
      "तीव्र सिरदर्द – संभवतः तनाव या वायरल",
    "Non-specific skin eruption": "गैर-विशिष्ट चकत्ते / त्वचा पर दाने",
    "Non-specific fatigue": "गैर-विशिष्ट थकान",
    "Non-specific dizziness / presyncope":
      "गैर-विशिष्ट चक्कर या बेहोशी जैसा महसूस होना",

    // Differential conditions
    "Viral infection": "वायरल संक्रमण",
    "Bacterial infection": "बैक्टीरियल संक्रमण",
    "Other non-specific causes": "अन्य गैर-विशिष्ट कारण",

    // Reasoning strings
    "Common with simple fever in primary care.":
      "प्राथमिक देखभाल में साधारण बुखार के साथ यह स्थिति सामान्य है।",
    "Consider if fever is persistent, very high, or focal.":
      "यदि बुखार लगातार रहे, बहुत तेज हो या किसी विशेष जगह की शिकायत हो तो इस पर विचार करें।",
    "Most likely explanation based on available symptoms.":
      "उपलब्ध लक्षणों के आधार पर यह सबसे संभावित कारण है।",
    "Symptoms are non-specific; monitor and review.":
      "लक्षण गैर-विशिष्ट हैं; निगरानी रखें और दोबारा मूल्यांकन करें।",

    // Treatment: medications
    "Paracetamol (generic)": "पैरासिटामोल (सामान्य)",
    "Dose as per local protocol": "खुराक स्थानीय प्रोटोकॉल के अनुसार",
    "As needed for fever (respect max daily dose)":
      "बुखार होने पर आवश्यकता अनुसार (अधिकतम दैनिक खुराक का ध्यान रखें)",
    "Usually 2–3 days, reassess if persistent":
      "आमतौर पर 2–3 दिन के लिए, यदि लक्षण बने रहें तो पुनः जांच आवश्यक",

    // Lifestyle & procedures
    "Encourage oral fluids and light clothing.":
      "मरीज को पर्याप्त मात्रा में तरल पिलाएं और हल्के कपड़े पहनने की सलाह दें।",
    "Advise rest and light diet.":
      "आराम करने और हल्का, सुपाच्य भोजन लेने की सलाह दें।",
    "Avoid smoke/irritants; warm fluids can help.":
      "धुआं और अन्य प्रदूषकों से बचें; गुनगुने तरल (जैसे सूप/पानी) लाभदायक हो सकते हैं।",
    "Use oral rehydration solution as per local protocol.":
      "ओआरएस घोल का उपयोग स्थानीय प्रोटोकॉल के अनुसार करें।",
    "Watch for signs of dehydration.":
      "निर्जलीकरण के लक्षणों (कम पेशाब, सूखा मुंह, सुस्ती) पर नज़र रखें।",
    "Arrange urgent referral / higher-level evaluation.":
      "तत्काल रेफरल या उच्च स्तर पर जांच की व्यवस्था करें।",
    "Return if symptoms worsen, new red-flag signs appear, or recovery is delayed.":
      "यदि लक्षण बढ़ें, नए गंभीर लक्षण दिखें या ठीक होने में देर हो तो तुरंत स्वास्थ्य केंद्र पर वापस आएं।",
  },

  // Simple, not-perfect but acceptable translations for demo.
  ta: {
    "Acute febrile illness (likely viral)":
      "தீவிர காய்ச்சல் நோய் (வைரல் இருக்க வாய்ப்பு)",
    "Viral infection": "வைரஸ் தொற்று",
    "Bacterial infection": "பாக்டீரியா தொற்று",
    "Other non-specific causes": "மற்ற பொதுவான காரணங்கள்",
    "Common with simple fever in primary care.":
      "முதற்கட்ட சிகிச்சையில் சாதாரண காய்ச்சலுடன் அடிக்கடி காணப்படும் நிலை.",
    "Consider if fever is persistent, very high, or focal.":
      "காய்ச்சல் நீண்ட நாட்கள் தொடர்ந்தால், மிகவும் அதிகமாக இருந்தால் அல்லது ஒரு பகுதியில் மட்டும் இருந்தால் கவனிக்க வேண்டும்.",
    "Encourage oral fluids and light clothing.":
      "வாய் வழியாக திரவங்களை அதிகம் குடிக்க சொல்லவும், இலகு உடை அணிய சொல்லவும்.",
    "Advise rest and light diet.":
      "மிகவும் ஓய்வு எடுக்கவும், எளிதில் செரியும் உணவு மட்டும் எடுத்துக்கொள்ளவும்.",
    "Return if symptoms worsen, new red-flag signs appear, or recovery is delayed.":
      "அறிகுறிகள் அதிகரித்தால், புதிய ஆபத்தான அறிகுறிகள் தோன்றினால் அல்லது நல்ல ஆகவில்லை என்றால் மீண்டும் வர சொல்லவும்.",
  },

  te: {
    "Acute febrile illness (likely viral)":
      "ఆకస్మిక జ్వరం సంబంధిత వ్యాధి (వైరల్ అయ్యే అవకాశం)",
    "Viral infection": "వైరస్ ఇన్ఫెక్షన్",
    "Bacterial infection": "బాక్టీరియా సంక్రమణ",
    "Other non-specific causes": "ఇతర సాధారణ కారణాలు",
    "Common with simple fever in primary care.":
      "ప్రాథమిక ఆరోగ్య కేంద్రాలలో సాధారణ జ్వరంతో కలిసి తరచుగా కనిపించే స్థితి.",
    "Encourage oral fluids and light clothing.":
      "బాగా ద్రవాలు తాగమని ప్రోత్సహించండి, పలుచని దుస్తులు ధరించమని చెప్పండి.",
    "Advise rest and light diet.":
      "విశ్రాంతి తీసుకోవాలని, తేలికపాటి ఆహారం మాత్రమే తీసుకోవాలని సూచించండి.",
    "Return if symptoms worsen, new red-flag signs appear, or recovery is delayed.":
      "లక్షణాలు పెరిగితే, కొత్తగా తీవ్రమైన లక్షణాలు వస్తే లేదా కోలుకోవడంలో ఆలస్యం అయితే వెంటనే తిరిగి రావాలి.",
  },

  bn: {
    "Acute febrile illness (likely viral)":
      "তীব্র জ্বরজনিত অসুস্থতা (সম্ভবত ভাইরাল)",
    "Viral infection": "ভাইরাল সংক্রমণ",
    "Bacterial infection": "ব্যাকটেরিয়াল সংক্রমণ",
    "Other non-specific causes": "অন্যান্য অস্পষ্ট কারণ",
    "Common with simple fever in primary care.":
      "প্রাথমিক চিকিৎসায় সাধারণ জ্বরের সাথে এ ধরনের অবস্থা প্রায়ই দেখা যায়।",
    "Consider if fever is persistent, very high, or focal.":
      "জ্বর যদি অনেকদিন থাকে, খুব বেশি থাকে বা কোনো নির্দিষ্ট স্থানে ব্যথা থাকে তবে এ বিষয়টি বিবেচনা করতে হবে।",
    "Encourage oral fluids and light clothing.":
      "রোগীকে প্রচুর পরিমাণে তরল খাবার খেতে এবং হালকা কাপড় পরতে উৎসাহিত করুন।",
    "Advise rest and light diet.":
      "বিশ্রাম নিতে ও হালকা, সহজপাচ্য খাবার খেতে পরামর্শ দিন।",
    "Return if symptoms worsen, new red-flag signs appear, or recovery is delayed.":
      "লক্ষণ বাড়লে, নতুন কোনো গুরুতর লক্ষণ দেখা দিলে বা সুস্থ হতে দেরি হলে দ্রুত আবার আসতে বলুন।",
  },
};

// Safe helper: if no translation, fall back to original English
export function translateClinical(
  text: string | undefined | null,
  language: Language
): string {
  if (!text) return "";
  if (language === "en") return text;
  return clinicalTranslations[language]?.[text] ?? text;
}

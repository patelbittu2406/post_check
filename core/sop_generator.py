"""
SOP Content Generator (Gemini Engine)
Transforms raw factual news points into SOP-compliant Gujarati scripts, hooks,
headlines, and universal Instagram captions.
"""

import os
import json
import datetime
import re
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
import sys
from pathlib import Path
# Ensure project root is in path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config

class ReelScriptSchema(BaseModel):
    """Structured schema for Instagram Reel news content."""
    hook: str = Field(description="Punchy 0-2 second opening hook in Gujarati, creating immediate curiosity.")
    voiceover_script: str = Field(description="Complete voiceover narration in Gujarati, total read duration between 10-25 seconds.")
    display_headline: str = Field(description="High-impact display headline for the center video banner (strictly 3 to 5 Gujarati words).")
    caption: str = Field(description="SOP-compliant Universal Instagram caption with exact sections, bullet points, and hashtags.")
    estimated_duration_sec: int = Field(description="Estimated voiceover duration in seconds (10 to 25 seconds).")


class SOPContentGenerator:
    """Generates SOP-compliant news reel content using Google Gemini API."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or config.GEMINI_API_KEY
        self.model_name = model or config.GEMINI_MODEL
        self.client = None

        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"[Warning] Failed to initialize Google GenAI client: {e}")
                self.client = None

    def _apply_legal_crime_rule(self, text: str, category_code: str) -> str:
        """
        Enforces Legal Crime Rule for C01:
        Replaces accusatory text with SOP standard phrasing and appends disclaimer.
        """
        if category_code.upper() != "C01":
            return text

        c01_info = config.CATEGORY_METADATA.get("C01", {})
        replacement = c01_info.get("legal_replacement", "ચોરીના કેસમાં પોલીસે એક વ્યક્તિની અટકાયત કરી")
        disclaimer = c01_info.get("disclaimer", "માહિતી સત્તાવાર રિપોર્ટ પર આધારિત છે.")

        # Replace any accusatory terms (આરોપીએ ચોરી કરી, ગુનેગાર, etc.)
        accusatory_patterns = [
            r"આરોપીએ\s+[^\s,.]+\s+ચોરી\s+કરી",
            r"ગુનેગારે\s+[^\s,.]+\s+કર્યું",
            r"ચોરે\s+ચોરી\s+કરી",
        ]
        sanitized = text
        for pat in accusatory_patterns:
            sanitized = re.sub(pat, replacement, sanitized)

        if disclaimer not in sanitized:
            sanitized = f"{sanitized}\n\n{disclaimer}"

        return sanitized

    def _build_system_prompt(self, category_code: str, area: str) -> str:
        cat_info = config.CATEGORY_METADATA.get(category_code.upper(), config.CATEGORY_METADATA["N01"])
        cat_name = cat_info["name"]
        cat_cta = cat_info["cta"]
        hashtag = cat_info["hashtag"]

        return f"""
You are the Chief Editor for a hyper-local Surat news channel.
Your job is to transform raw factual news bullet points into a viral, SOP-compliant Gujarati Instagram Reel script and caption.

STRICT SURAT SOP GUIDELINES:
1. Category: {category_code} - {cat_name}
2. Hyperlocal Area: {area}, Surat, Gujarat.
3. Hook:
   - Punchy opening sentence (0-2 seconds read).
   - High curiosity, immediate hook in authentic conversational Gujarati.
4. Voiceover Script:
   - Total length: Strictly between 10 to 25 seconds of clear, natural speech (approx 35-70 Gujarati words).
   - Conversational, authoritative, fast-paced Gujarati news tone.
5. Display Headline:
   - Strictly 3 to 5 words in Gujarati for the center video banner.
   - Example: "અડાજણમાં મોટો અકસ્માત ટળ્યો" or "વેસુમાં મેગા ડ્રાઇવ શરૂ".
6. Legal Crime Rule (MANDATORY FOR C01):
   - If Category is C01, NEVER use accusatory language.
   - Replace direct accusation with: "ચોરીના કેસમાં પોલીસે એક વ્યક્તિની અટકાયત કરી".
   - Always append disclaimer: "માહિતી સત્તાવાર રિપોર્ટ પર આધારિત છે."
7. Instagram Caption Format (EXACT UNIVERSAL LAYOUT):
SURAT UPDATE | {category_code}
Location: {area}, Surat Date: [DD/MM/YYYY] Time: [Morning/Afternoon/Evening]

શું થયું?
[2-3 lines concise summary in Gujarati]

મહત્વની માહિતી:
• [Key point 1]
• [Key point 2]

{cat_cta}

#Surat {hashtag} #{area} #SuratNews #SuratUpdate
"""

    def generate_script(
        self,
        raw_news_text: str,
        category_code: str = "N01",
        area: str = "Adajan",
        date_str: Optional[str] = None,
        time_slot: Optional[str] = None
    ) -> ReelScriptSchema:
        """
        Generates SOP-compliant Reel script from raw news input.
        Uses Gemini 2.5 API with fallback to local rule-based template generator.
        """
        now = datetime.datetime.now()
        date_str = date_str or now.strftime("%d/%m/%Y")
        time_slot = time_slot or ("Morning Update" if now.hour < 12 else ("Afternoon Update" if now.hour < 17 else "Evening Update"))
        category_code = category_code.upper()

        if self.client:
            try:
                system_prompt = self._build_system_prompt(category_code, area)
                user_content = f"""
Raw News Facts:
{raw_news_text}

Target Metadata:
- Category Code: {category_code}
- Area: {area}
- Date: {date_str}
- Time Slot: {time_slot}

Generate the complete JSON response conforming to the ReelScriptSchema.
"""
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=[system_prompt, user_content],
                    config={
                        "response_mime_type": "application/json",
                        "response_schema": ReelScriptSchema,
                        "temperature": 0.2,
                    }
                )

                parsed_json = json.loads(response.text)
                schema_obj = ReelScriptSchema(**parsed_json)

                # Post-process C01 legal crime check
                if category_code == "C01":
                    schema_obj.voiceover_script = self._apply_legal_crime_rule(schema_obj.voiceover_script, category_code)
                    schema_obj.caption = self._apply_legal_crime_rule(schema_obj.caption, category_code)

                return schema_obj

            except Exception as e:
                print(f"[Warning] Gemini API generation failed: {e}. Falling back to rule-based SOP generator.")

        # Fallback offline generator
        return self._generate_fallback_script(raw_news_text, category_code, area, date_str, time_slot)

    def _generate_fallback_script(
        self,
        raw_news_text: str,
        category_code: str,
        area: str,
        date_str: str,
        time_slot: str
    ) -> ReelScriptSchema:
        """Local rule-based generator for offline or mock mode."""
        cat_info = config.CATEGORY_METADATA.get(category_code, config.CATEGORY_METADATA["N01"])
        cat_badge = cat_info["badge"]
        cat_cta = cat_info["cta"]
        hashtag = cat_info["hashtag"]

        cleaned = raw_news_text.strip().replace("\n", " ")

        if category_code == "C01":
            hook = f"સુરતના {area} વિસ્તારમાંથી ક્રાઇમના મોટા સમાચાર!"
            voiceover = f"સુરતના {area} વિસ્તારમાં ચોરીના કેસમાં પોલીસે એક વ્યક્તિની અટકાયત કરી છે. સમગ્ર મામલે પોલીસે સઘન તપાસ હાથ ધરી છે. માહિતી સત્તાવાર રિપોર્ટ પર આધારિત છે."
            headline = f"{area}માં પોલીસ કાર્યવાહી"
            summary = f"{area} વિસ્તારમાં ચોરીના કેસમાં પોલીસે એક વ્યક્તિની અટકાયત કરી છે. આગળની કાયદેસર કાર્યવાહી હાથ ધરાઇ રહી છે."
            point1 = "પોલીસે ઘટનાસ્થળે પહોંચી તપાસ શરૂ કરી"
            point2 = "માહિતી સત્તાવાર પોલીસ રિપોર્ટ પર આધારિત છે"
        elif category_code == "T01":
            hook = f"{area}માં ટ્રાફિકને લઇને તાજા સમાચાર!"
            voiceover = f"સુરતના {area} વિસ્તારમાં આજે ભારે ટ્રાફિક સર્જાયો હતો. વાહનચાલકોને વૈકલ્પિક માર્ગનો ઉપયોગ કરવા અપીલ કરવામાં આવી છે. ટ્રાફિક પોલીસે સ્થિતિ નિયંત્રણમાં લીધી છે."
            headline = f"{area}માં ટ્રાફિક જામ"
            summary = f"{area} માર્ગ પર આજે અચાનક વાહનોની લાંબી કતારો લાગી હતી."
            point1 = "ટ્રાફિક પોલીસે વ્યવસ્થા સંભાળી"
            point2 = "વાહનચાલકોને શાંતિ જાળવવા અપીલ"
        else:
            hook = f"સુરતીઓ માટે {area}થી મહત્વના સમાચાર!"
            voiceover = f"સુરતના {area} વિસ્તારમાં {cleaned[:70]}. તંત્ર દ્વારા જરૂરી પગલાં લેવામાં આવ્યા છે અને લોકોએ આ અપડેટની નોંધ લેવા વિનંતી છે."
            headline = f"{area}ના મોટા સમાચાર"
            summary = f"{area} વિસ્તારમાંથી મહત્વના સમાચાર સામે આવ્યા છે: {cleaned[:90]}."
            point1 = "સ્થાનિક તંત્ર અને નાગરિકો સક્રિય"
            point2 = "સમગ્ર વિસ્તારમાં અપડેટની ચર્ચા"

        caption = f"""SURAT UPDATE | {category_code}
Location: {area}, Surat Date: {date_str} Time: {time_slot}

શું થયું?
{summary}

મહત્વની માહિતી:
• {point1}
• {point2}

{cat_cta}

#Surat {hashtag} #{area} #SuratNews #SuratUpdate"""

        return ReelScriptSchema(
            hook=hook,
            voiceover_script=voiceover,
            display_headline=headline,
            caption=caption,
            estimated_duration_sec=16,
        )


if __name__ == "__main__":
    print("=== Testing SOPContentGenerator ===")
    generator = SOPContentGenerator()

    print("\n--- Test 1: N01 General News ---")
    n01_res = generator.generate_script(
        raw_news_text="અડાજણ રિંગ રોડ પર નવો ફ્લાયઓવર બ્રિજનું સમારકામ પૂરું થયું, આજથી વાહન વ્યવહાર શરૂ.",
        category_code="N01",
        area="Adajan"
    )
    print("Hook:", n01_res.hook)
    print("Headline:", n01_res.display_headline)
    print("Duration (s):", n01_res.estimated_duration_sec)
    print("Script:", n01_res.voiceover_script)
    print("Caption:\n", n01_res.caption)

    print("\n--- Test 2: C01 Crime Watch (Legal Compliance Check) ---")
    c01_res = generator.generate_script(
        raw_news_text="વેસુમાં દુકાનમાંથી આરોપીએ રોકડ રકમની ચોરી કરી, લોકોએ પકડીને પોલીસને સોંપ્યો.",
        category_code="C01",
        area="Vesu"
    )
    print("Hook:", c01_res.hook)
    print("Headline:", c01_res.display_headline)
    print("Script:", c01_res.voiceover_script)
    assert "ચોરીના કેસમાં પોલીસે એક વ્યક્તિની અટકાયત કરી" in c01_res.voiceover_script or "માહિતી સત્તાવાર રિપોર્ટ પર આધારિત છે." in c01_res.voiceover_script
    print("\n[SUCCESS] SOPContentGenerator unit tests passed!")

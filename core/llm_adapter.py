"""
LLM Adapter Module (V2)
Unified multi-AI provider client supporting Google Gemini, OpenAI (ChatGPT),
and Anthropic (Claude) for generating dual-stripe headlines, timed Gujarati scripts,
and SOP Instagram captions.
"""

import os
import sys
import json
import re
import datetime
from pathlib import Path
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

# Ensure project root is in path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config

class ReelContentOutput(BaseModel):
    """V2 Structured Output Schema for Instagram Reel news content."""
    line1_headline: str = Field(
        description="Top headline in pure Gujarati (punchy, 4-7 words, e.g. 'તૈયારીઓ પૂર્ણ હતી... ભક્તો તૈયાર હતા...')"
    )
    line2_headline: str = Field(
        description="Bottom headline in pure Gujarati with relevant contextual emoji suffix (e.g. 'પણ બાપ્પાની મરજી કંઈક અલગ હતી! 🚩' or 'પોલીસ તંત્ર દોડતું થયું! 🚨')"
    )
    voiceover_script: str = Field(
        description="Natural spoken Gujarati narration script with embedded emotional and pacing audio tags (e.g. [excited], [serious], [pauses], [whispers], [happy], [concerned], [laughs], [sighs], [shouts]) placed intelligently at tonal shifts."
    )
    caption: str = Field(
        description="SOP-compliant Universal Instagram caption with structured sections and hashtags."
    )
    hook_summary: str = Field(
        description="1-sentence curiosity-driven hook in Gujarati."
    )


class AutoTagScriptOutput(BaseModel):
    """Structured output schema for intelligent audio tagging of user scripts."""
    tagged_script: str = Field(
        description="The EXACT input script text with intelligent audio tags ([excited], [serious], [pauses], [happy], [concerned], [whispers], [laughs], [sighs], [shouts], [confident]) inserted. DO NOT change, delete, or rephrase ANY original words."
    )
    explanation: Optional[str] = Field(
        default=None,
        description="Brief summary of tags inserted and emotional tone detected."
    )


class LLMAdapter:
    """Unified client for Gemini, OpenAI, and Claude."""

    SUPPORTED_PROVIDERS = ["Gemini", "OpenAI", "Claude"]

    def __init__(self, default_provider: str = "Gemini"):
        self.default_provider = default_provider

    def _strip_tags(self, text: str) -> str:
        """Removes bracketed/angular tags and normalizes whitespace."""
        clean = re.sub(r'\[[a-zA-Z_ ]+\]|\<[a-zA-Z_ ]+\>', ' ', text)
        return ' '.join(clean.split())

    def _verify_text_preserved(self, original_text: str, tagged_text: str) -> bool:
        """Verifies that non-tag words in original_text are preserved in tagged_text."""
        orig_clean = self._strip_tags(original_text)
        tagged_clean = self._strip_tags(tagged_text)
        orig_words = re.findall(r'\w+', orig_clean)
        tagged_words = re.findall(r'\w+', tagged_clean)
        if not orig_words:
            return True
        if orig_words == tagged_words:
            return True
        ratio = len(set(orig_words) & set(tagged_words)) / max(len(set(orig_words)), 1)
        return ratio >= 0.90

    def _apply_legal_crime_rule(self, text: str, category_code: str) -> str:
        """Enforces Legal Crime Rule for C01."""
        if category_code.upper() != "C01":
            return text

        c01_info = config.CATEGORY_METADATA.get("C01", {})
        replacement = c01_info.get("legal_replacement", "ચોરીના કેસમાં પોલીસે એક વ્યક્તિની અટકાયત કરી")
        disclaimer = c01_info.get("disclaimer", "માહિતી સત્તાવાર રિપોર્ટ પર આધારિત છે.")

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

    def _build_system_prompt(self, category_code: str, area: str, target_duration: int) -> str:
        cat_info = config.CATEGORY_METADATA.get(category_code.upper(), config.CATEGORY_METADATA["N01"])
        cat_name = cat_info["name"]
        cat_cta = cat_info["cta"]
        hashtag = cat_info["hashtag"]

        target_words = int(target_duration * 2.5)

        return f"""
You are the Chief Creative Editor and Anchor Director for a premium hyper-local Surat news media channel.
Your task is to transform raw factual news bullet points into a viral, SOP-compliant Gujarati Instagram Reel.

TARGET SETTINGS:
- Category: {category_code} ({cat_name})
- Target Area: {area}, Surat, Gujarat.
- Target Reel Duration: {target_duration} seconds (Aim for approximately {target_words} Gujarati spoken words).

STRICT HEADLINE DESIGN RULES (DUAL-STRIPE FORMAT):
1. Line 1 Headline:
   - Punchy opening premise in pure Gujarati (4 to 7 words).
   - Example: "તૈયારીઓ પૂર્ણ હતી... ભક્તો તૈયાર હતા..." or "અડાજણ રિંગ રોડ પર મોટી ઘટના..."
2. Line 2 Headline:
   - Punchy twist / resolution in pure Gujarati with a relevant contextual emoji at the end!
   - Example: "પણ બાપ્પાની મરજી કંઈક અલગ હતી! 🚩" or "પોલીસનો કાફલો તાબડતોબ પહોંચ્યો! 🚨" or "ટ્રાફિક જામમાં વાહનો ફસાયા! ⚠️"

STRICT SCRIPT & INTELLIGENT AUDIO TAGS RULES:
3. Voiceover Script with Audio & Emotion Tags (MANDATORY):
   - You MUST intelligently insert expressional Audio Tags directly inside the script text (enclosed in square brackets `[...]`) based on the emotion and pacing of each sentence:
     • [excited]: High energy, breaking news, celebrations, or grand announcements.
     • [serious]: Crime watch, road accidents, legal proceedings, administrative notices, or formal warnings.
     • [pauses]: Natural editorial breathing pause (450ms) between major news points, before twists, or after hooks.
     • [happy]: Festive celebrations, cultural joy, human wins, and uplifting moments.
     • [sad]: Tragic events, sorrow, loss, or emergency disasters.
     • [concerned]: Severe weather warnings, traffic congestion, civic problems, or safety advisories.
     • [whispers]: Dramatic suspense, behind-the-scenes revelations, or confidential scoops.
     • [shouts]: High-alert emergency alarms or vital public red alerts.
     • [laughs]: Lighthearted, amusing, or delightful community updates.
     • [sighs]: Moments of exhaustion, heatwave, or deep relief.

   - INTELLIGENT TAG PLACEMENT RULES:
     a. Always start the voiceover script with an appropriate opening tone tag like `[excited]`, `[serious]`, or `[concerned]`.
     b. Insert `[pauses]` at dramatic points and sentence transitions (e.g. "[excited] સુરતમાં આજે ગણેશ ઉત્સવ દરમિયાન [pauses] મેઘરાજાની પધરામણી થવા છતાં...").
     c. Switch emotion tags dynamically when the story mood shifts (e.g., from `[serious]` description to `[concerned]` advisory or `[happy]` resolution).
     d. Embed 3 to 6 tags across the entire script for maximum broadcast realism.

4. Legal Crime Rule (MANDATORY FOR C01):
   - Never use accusatory words. Replace with: "ચોરીના કેસમાં પોલીસે એક વ્યક્તિની અટકાયત કરી".
   - Always append disclaimer: "માહિતી સત્તાવાર રિપોર્ટ પર આધારિત છે."

5. Instagram Caption (Universal SOP Layout):
SURAT UPDATE | {category_code}
Location: {area}, Surat Date: [DD/MM/YYYY] Time: [Morning/Afternoon/Evening]

શું થયું?
[2-3 lines summary in Gujarati]

મહત્વની માહિતી:
• [Key bullet 1]
• [Key bullet 2]

{cat_cta}

#Surat {hashtag} #{area.replace(' ', '').replace('(', '').replace(')', '')} #SuratNews #SuratUpdate
"""

    def generate_reel_content(
        self,
        raw_details: str,
        category_code: str = "N01",
        area: str = "All Surat (સમગ્ર સુરત)",
        target_duration: int = 30,
        provider: Optional[str] = None,
        api_key: Optional[str] = None,
        date_str: Optional[str] = None,
        time_slot: Optional[str] = None
    ) -> ReelContentOutput:
        """Generates dual-stripe headlines, timed script, and captions using chosen LLM."""
        provider = provider or self.default_provider
        profile = config.load_user_profile()

        now = datetime.datetime.now()
        date_str = date_str or now.strftime("%d/%m/%Y")
        time_slot = time_slot or ("Morning Update" if now.hour < 12 else ("Afternoon Update" if now.hour < 17 else "Evening Update"))
        category_code = category_code.upper()

        system_prompt = self._build_system_prompt(category_code, area, target_duration)
        user_prompt = f"""
Raw News Facts:
{raw_details}

Target Metadata:
- Category Code: {category_code}
- Location: {area}, Surat
- Target Duration: {target_duration} seconds
- Date: {date_str}
- Time Slot: {time_slot}

Return valid JSON adhering strictly to ReelContentOutput schema.
"""

        # 1. Try Gemini
        if provider == "Gemini":
            key = api_key or profile.get("gemini_api_key") or config.GEMINI_API_KEY
            if key:
                try:
                    from google import genai
                    client = genai.Client(api_key=key)
                    model_to_use = config.GEMINI_MODEL or "gemini-3.6-flash"
                    response = client.models.generate_content(
                        model=model_to_use,
                        contents=[system_prompt, user_prompt],
                        config={
                            "response_mime_type": "application/json",
                            "response_schema": ReelContentOutput,
                            "temperature": 0.2,
                        }
                    )
                    data = json.loads(response.text)
                    result = ReelContentOutput(**data)
                    return self._finalize_output(result, category_code)
                except Exception as e:
                    print(f"[LLMAdapter] Gemini call failed: {e}")

        # 2. Try OpenAI (GPT-4o)
        elif provider == "OpenAI":
            key = api_key or profile.get("openai_api_key") or os.getenv("OPENAI_API_KEY")
            if key:
                try:
                    from openai import OpenAI
                    client = OpenAI(api_key=key)
                    resp = client.beta.chat.completions.parse(
                        model="gpt-4o",
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        response_format=ReelContentOutput,
                        temperature=0.2,
                    )
                    result = resp.choices[0].message.parsed
                    return self._finalize_output(result, category_code)
                except Exception as e:
                    print(f"[LLMAdapter] OpenAI call failed: {e}")

        # 3. Try Anthropic (Claude 3.5 Sonnet)
        elif provider == "Claude":
            key = api_key or profile.get("anthropic_api_key") or os.getenv("ANTHROPIC_API_KEY")
            if key:
                try:
                    import anthropic
                    client = anthropic.Anthropic(api_key=key)
                    schema_json = json.dumps(ReelContentOutput.model_json_schema())
                    claude_prompt = f"{user_prompt}\n\nYou must output ONLY valid JSON matching this schema:\n{schema_json}"
                    message = client.messages.create(
                        model="claude-3-5-sonnet-20241022",
                        max_tokens=1500,
                        system=system_prompt,
                        messages=[{"role": "user", "content": claude_prompt}],
                        temperature=0.2,
                    )
                    raw_text = message.content[0].text
                    # Extract json block if wrapped
                    match = re.search(r"\{.*\}", raw_text, re.DOTALL)
                    if match:
                        parsed = json.loads(match.group(0))
                        result = ReelContentOutput(**parsed)
                        return self._finalize_output(result, category_code)
                except Exception as e:
                    print(f"[LLMAdapter] Claude call failed: {e}")

        # Fallback offline generator
        print(f"[LLMAdapter] Falling back to rule-based V2 generator for {provider}...")
        return self._generate_fallback(raw_details, category_code, area, target_duration, date_str, time_slot)

    def _finalize_output(self, obj: ReelContentOutput, category_code: str) -> ReelContentOutput:
        """Applies C01 legal crime rule and post-processing."""
        if category_code.upper() == "C01":
            obj.voiceover_script = self._apply_legal_crime_rule(obj.voiceover_script, category_code)
            obj.caption = self._apply_legal_crime_rule(obj.caption, category_code)
        return obj

    def _generate_fallback(
        self,
        raw_text: str,
        category_code: str,
        area: str,
        target_duration: int,
        date_str: str,
        time_slot: str
    ) -> ReelContentOutput:
        """Generates high quality dual-stripe headlines and timed scripts offline."""
        cat_info = config.CATEGORY_METADATA.get(category_code, config.CATEGORY_METADATA["N01"])
        hashtag = cat_info["hashtag"]
        cat_cta = cat_info["cta"]

        cleaned = raw_text.strip().replace("\n", " ")

        if category_code == "C01":
            line1 = f"{area}માં પોલીસ તંત્ર દોડતું થયું..."
            line2 = "ચોરીના કેસમાં શંકાસ્પદ ઝબ્બે! 🚨"
            voiceover = (
                f"[serious] સુરતના {area} વિસ્તારમાંથી મોટા સમાચાર સામે આવ્યા છે. [pauses] "
                f"ચોરીના કેસમાં પોલીસે એક વ્યક્તિની અટકાયત કરી છે અને આગળની સઘન પૂછપરછ હાથ ધરી છે. [pauses] "
                f"[concerned] પોલીસ દ્વારા સમગ્ર વિસ્તારમાં સુરક્ષા વ્યવસ્થા વધારી દેવામાં આવી છે. "
                f"માહિતી સત્તાવાર રિપોર્ટ પર આધારિત છે."
            )
        elif category_code == "F01":
            line1 = "તૈયારીઓ પૂર્ણ હતી... ભક્તો તૈયાર હતા..."
            line2 = "પણ બાપ્પાની મરજી કંઈક અલગ હતી! 🚩"
            voiceover = (
                f"[excited] સુરતના {area}માં ઉત્સવનો માહોલ જામ્યો છે! [pauses] "
                f"{cleaned[:90]}. [pauses] "
                f"[happy] મોટી સંખ્યામાં શ્રદ્ધાળુઓ ઉમટી પડ્યા છે અને સમગ્ર વિસ્તાર ભક્તિમય બની ગયો છે."
            )
        elif category_code == "T01":
            line1 = f"{area} માર્ગ પર વાહનોની લાંબી કતારો..."
            line2 = "ટ્રાફિક જામમાં વાહનચાલકો ફસાયા! ⚠️"
            voiceover = (
                f"[serious] સુરતના {area} માર્ગ પર આજે અચાનક ભારે ટ્રાફિક જામ સર્જાયો હતો. [pauses] "
                f"[concerned] વાહનચાલકોને વૈકલ્પિક માર્ગનો ઉપયોગ કરવા અપીલ કરવામાં આવી છે. [pauses] "
                f"ટ્રાફિક પોલીસે સ્થિતિ નિયંત્રણમાં લેવા સઘન પ્રયાસો શરૂ કર્યા છે."
            )
        else:
            line1 = f"{area}ના નાગરિકો માટે આવ્યા મોટા સમાચાર..."
            line2 = "તંત્ર દ્વારા લેવાયો મહત્વનો નિર્ણય! 📢"
            voiceover = (
                f"[excited] સુરતના {area} વિસ્તારમાં મહત્વપૂર્ણ અપડેટ સામે આવ્યું છે. [pauses] "
                f"{cleaned[:100]}. [pauses] "
                f"[concerned] સ્થાનિક તંત્ર દ્વારા જરૂરી પગલાં લેવામાં આવ્યા છે અને લોકોએ આ અપડેટની ખાસ નોંધ લેવી."
            )

        caption = f"""SURAT UPDATE | {category_code}
Location: {area}, Surat Date: {date_str} Time: {time_slot}

શું થયું?
{line1} {line2}

મહત્વની માહિતી:
• સ્થાનિક તંત્ર અને નાગરિકો સક્રિય
• સત્તાવાર વિગતોની નોંધ લેવા વિનંતી

{cat_cta}

#Surat {hashtag} #{area.replace(' ', '').replace('(', '').replace(')', '')} #SuratNews #SuratUpdate"""

        return ReelContentOutput(
            line1_headline=line1,
            line2_headline=line2,
            voiceover_script=voiceover,
            caption=caption,
            hook_summary=f"{line1} {line2}"
        )

    def _offline_auto_tag_script(self, script_text: str, category_code: str = "N01") -> str:
        """Rule-based intelligent auto-tagger that inserts audio tags without altering original words."""
        cleaned_text = script_text.strip()
        if not cleaned_text:
            return script_text

        # Strip any existing tags first to avoid duplicates
        base_text = re.sub(r'\[[a-zA-Z_ ]+\]|\<[a-zA-Z_ ]+\>', '', cleaned_text).strip()
        base_text = ' '.join(base_text.split())

        cat_upper = (category_code or "N01").upper()
        
        # Default opening emotion based on category
        cat_emotions = {
            "C01": "[serious]",
            "F01": "[excited]",
            "T01": "[concerned]",
            "W01": "[concerned]",
            "S01": "[excited]",
            "B01": "[confident]",
            "P01": "[serious]",
            "N01": "[excited]"
        }
        initial_tag = cat_emotions.get(cat_upper, "[excited]")

        # Check for keyword triggers in text
        if any(w in base_text for w in ["ચોરી", "અકસ્માત", "ધરપકડ", "પોલીસ", "ગુનો", "તપાસ", "FIR"]):
            initial_tag = "[serious]"
        elif any(w in base_text for w in ["ઉત્સવ", "ખુશી", "આનંદ", "ધામધૂમ", "ભવ્ય", "વિજય", "જીત", "શાનદાર"]):
            initial_tag = "[excited]"
        elif any(w in base_text for w in ["ચેતવણી", "સાવધાન", "જામ", "ભારે વરસાદ", "અલર્ટ", "તકલીફ", "પાણી ભરાયા"]):
            initial_tag = "[concerned]"
        elif any(w in base_text for w in ["દુઃખદ", "શોક", "અવસાન", "ગમગીન"]):
            initial_tag = "[sad]"

        # Split sentences by ., !, ?, |, \n while preserving punctuation
        sentences = re.split(r'([.!?।|]+|\n+)', base_text)
        
        result_parts = []
        is_first = True
        
        i = 0
        while i < len(sentences):
            sentence = sentences[i].strip()
            punct = sentences[i+1] if i + 1 < len(sentences) else ""
            i += 2
            
            if not sentence:
                if punct:
                    result_parts.append(punct)
                continue
                
            sentence_tag = ""
            if is_first:
                sentence_tag = f"{initial_tag} "
                is_first = False
            else:
                # Detect mid-script tone shifts
                if any(w in sentence for w in ["ખુશી", "ઉત્સાહ", "આનંદ", "રાહત", "મજા"]):
                    sentence_tag = "[happy] "
                elif any(w in sentence for w in ["ચેતવણી", "સાવચેત", "અપીલ", "કાળજી", "જામ", "સમસ્યા"]):
                    sentence_tag = "[concerned] "
                elif any(w in sentence for w in ["પોલીસ", "તપાસ", "કાર્યવાહી", "સકંજામાં"]):
                    sentence_tag = "[serious] "
                elif any(w in sentence for w in ["પરંતુ", "જોકે", "વિશેષ"]):
                    sentence_tag = "[whispers] "
                else:
                    sentence_tag = "[pauses] "

            # Add internal pauses for long clauses if conjunctions exist
            s_text = sentence
            for conj in [" અને ", " જ્યારે ", " તેમજ ", " પરંતુ ", " જોકે "]:
                if conj in s_text and "[pauses]" not in s_text and len(s_text) > 40:
                    s_text = s_text.replace(conj, f" [pauses]{conj}", 1)

            full_s = f"{sentence_tag}{s_text}{punct}"
            result_parts.append(full_s)

        tagged = " ".join(result_parts).strip()
        tagged = re.sub(r'\s+', ' ', tagged)
        tagged = re.sub(r'\[([a-zA-Z_]+)\]\s*\[([a-zA-Z_]+)\]', r'[\1] [\2]', tagged)
        return tagged

    def auto_tag_script(
        self,
        script_text: str,
        category_code: str = "N01",
        area: str = "All Surat (સમગ્ર સુરત)",
        provider: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> str:
        """Takes user's exact script and uses AI to insert emotional & pacing tags without changing words."""
        cleaned_input = script_text.strip()
        if not cleaned_input:
            return script_text

        provider = provider or self.default_provider
        profile = config.load_user_profile()

        system_prompt = """You are the Chief Audio Director & Speech Pacer for Gujarati News and Reels.
Your task is to take an EXISTING Gujarati script and intelligently insert emotional and delivery audio tags into it.

AVAILABLE AUDIO TAGS:
- [excited]: High energy, breaking announcements, celebrations, festive joy, grand intros.
- [serious]: Crime, accidents, official warnings, serious updates, legal news, police reports.
- [pauses]: Natural editorial breathing pause (450ms) between sentences, before dramatic points, or after hooks.
- [happy]: Celebrations, wins, uplifting news, positive community updates, pleasant relief.
- [sad]: Tragic news, condolences, sorrowful events, disasters.
- [concerned]: Weather alerts, civic issues, traffic jams, health warnings, cautionary news, public advisories.
- [whispers]: Dramatic suspense, confidential scoop, curiosity hooks.
- [laughs]: Lighthearted, amusing, humorous moments.
- [sighs]: Relief, exhaustion, heatwave.
- [shouts]: Urgent red alert, emergency warning.
- [confident]: Strong official statements, statistics, expert opinions.

CRITICAL NON-NEGOTIABLE RULES:
1. PRESERVE ALL ORIGINAL WORDS EXACTLY. Do NOT add new sentences, do NOT translate, do NOT summarize, do NOT rewrite, do NOT delete any original word.
2. Only insert `[tag_name]` audio tags at natural inflection points (sentence starts, emotional transitions, or dramatic pauses).
3. Place an opening emotion tag at the very beginning (e.g. `[excited]`, `[serious]`, `[happy]`, or `[concerned]`).
4. Place `[pauses]` at sentence boundaries or major transitions.
5. Return JSON matching AutoTagScriptOutput schema."""

        user_prompt = f"""Target News Category: {category_code}
Target Area: {area}

ORIGINAL GUJARATI SCRIPT:
{cleaned_input}

Insert the audio tags intelligently while keeping all original words 100% untouched. Return valid JSON adhering to AutoTagScriptOutput schema."""

        # 1. Try Gemini
        if provider == "Gemini":
            key = api_key or profile.get("gemini_api_key") or config.GEMINI_API_KEY
            if key:
                try:
                    from google import genai
                    client = genai.Client(api_key=key)
                    model_to_use = config.GEMINI_MODEL or "gemini-3.6-flash"
                    response = client.models.generate_content(
                        model=model_to_use,
                        contents=[system_prompt, user_prompt],
                        config={
                            "response_mime_type": "application/json",
                            "response_schema": AutoTagScriptOutput,
                            "temperature": 0.1,
                        }
                    )
                    data = json.loads(response.text)
                    tagged = data.get("tagged_script", "").strip()
                    if tagged and self._verify_text_preserved(cleaned_input, tagged):
                        return tagged
                    else:
                        print("[LLMAdapter] Gemini output did not preserve original text closely, using rule-based tags.")
                except Exception as e:
                    print(f"[LLMAdapter] Gemini auto_tag_script error: {e}")

        # 2. Try OpenAI
        elif provider == "OpenAI":
            key = api_key or profile.get("openai_api_key") or os.getenv("OPENAI_API_KEY")
            if key:
                try:
                    from openai import OpenAI
                    client = OpenAI(api_key=key)
                    resp = client.beta.chat.completions.parse(
                        model="gpt-4o",
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        response_format=AutoTagScriptOutput,
                        temperature=0.1,
                    )
                    tagged = resp.choices[0].message.parsed.tagged_script.strip()
                    if tagged and self._verify_text_preserved(cleaned_input, tagged):
                        return tagged
                except Exception as e:
                    print(f"[LLMAdapter] OpenAI auto_tag_script error: {e}")

        # 3. Try Claude
        elif provider == "Claude":
            key = api_key or profile.get("anthropic_api_key") or os.getenv("ANTHROPIC_API_KEY")
            if key:
                try:
                    import anthropic
                    client = anthropic.Anthropic(api_key=key)
                    schema_json = json.dumps(AutoTagScriptOutput.model_json_schema())
                    claude_prompt = f"{user_prompt}\n\nYou must output ONLY valid JSON matching this schema:\n{schema_json}"
                    message = client.messages.create(
                        model="claude-3-5-sonnet-20241022",
                        max_tokens=1000,
                        system=system_prompt,
                        messages=[{"role": "user", "content": claude_prompt}],
                        temperature=0.1,
                    )
                    raw_text = message.content[0].text
                    match = re.search(r"\{.*\}", raw_text, re.DOTALL)
                    if match:
                        parsed = json.loads(match.group(0))
                        tagged = parsed.get("tagged_script", "").strip()
                        if tagged and self._verify_text_preserved(cleaned_input, tagged):
                            return tagged
                except Exception as e:
                    print(f"[LLMAdapter] Claude auto_tag_script error: {e}")

        # Fallback offline rule-based tagger
        return self._offline_auto_tag_script(cleaned_input, category_code)


if __name__ == "__main__":
    print("=== Testing LLMAdapter (V2) ===")
    adapter = LLMAdapter()

    print("\n--- Test Gemini Provider ---")
    res = adapter.generate_reel_content(
        raw_details="ગણેશ ઉત્સવમાં ભક્તોની ભીડ ઉમટી, અચાનક વરસાદ પડ્યો પણ ઉત્સાહ જળવાઈ રહ્યો.",
        category_code="F01",
        area="Vesu",
        target_duration=30,
        provider="Gemini"
    )
    print("Line 1:", res.line1_headline)
    print("Line 2:", res.line2_headline)
    print("Voiceover:", res.voiceover_script[:80], "...")
    print("Caption:\n", res.caption[:150], "...")
    assert res.line1_headline, "Line 1 must not be empty"
    assert res.line2_headline, "Line 2 must not be empty"

    print("\n[SUCCESS] LLMAdapter unit tests passed!")

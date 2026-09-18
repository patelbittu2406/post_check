"""
Gujarati Text Normalization Engine
===================================
Prepares Gujarati text for high-fidelity TTS pronunciation.
Handles:
- Numbers (both Latin 0-9 and Gujarati ૦-૯ digits) up to Crores
- Decimals and fractions
- Dates (DD/MM/YYYY, DD-MM-YYYY, ordinal dates like 15મી ઓગસ્ટ)
- Times (12-hour/24-hour with AM/PM, e.g. 10:30 -> દસ વાગીને ત્રીસ મિનિટે)
- Temperatures (e.g. 32°C -> બત્રીસ ડિગ્રી સેલ્સિયસ)
- Percentages (e.g. 15% -> પંદર ટકા)
- Currency (₹, Rs., $, Lakh/Crore)
- Abbreviations and Honorifics (ડો., પ્રો., કિમી, તા., વગેરે)
- Acronyms (CCTV, FIR, VIP, PM, CM, MLA, MP)
- Breaking news phrase formatting
"""

import re
from typing import Dict, List, Tuple

# 0 to 99 Gujarati number words
GUJARATI_NUM_WORDS = [
    "શૂન્ય", "એક", "બે", "ત્રણ", "ચાર", "પાંચ", "છ", "સાત", "આઠ", "નવ", "દસ",
    "અગિયાર", "બાર", "તેર", "ચૌદ", "પંદર", "સોળ", "સત્તર", "અઢાર", "ઓગણીસ", "વીસ",
    "એકવીસ", "બાવીસ", "તેવીસ", "ચોવીસ", "પચ્ચીસ", "છવ્વીસ", "સત્તાવીસ", "અઠ્ઠાવીસ", "ઓગણત્રીસ", "ત્રીસ",
    "એકત્રીસ", "બત્રીસ", "તેત્રીસ", "ચોત્રીસ", "પાંત્રીસ", "છત્રીસ", "સાડત્રીસ", "ઓડત્રીસ", "ઓગણચાલીસ", "ચાલીસ",
    "એકતાલીસ", "બેતાલીસ", "તેતાલીસ", "ચુંમાલીસ", "પિસ્તાલીસ", "છેતાલીસ", "સુડતાલીસ", "અડતાલીસ", "ઓગણપચાસ", "પચાસ",
    "એકાવન", "બાવન", "ત્રેપન", "ચોપન", "પંચાવન", "છપ્પન", "સત્તાવન", "અઠ્ઠાવન", "ઓગણસાઠ", "સાઠ",
    "એકસઠ", "બાસઠ", "ત્રેસઠ", "ચોસઠ", "પાંસઠ", "છાસઠ", "સડસઠ", "અડસઠ", "અગણોસિત્તેર", "સિત્તેર",
    "એકોતેર", "બોતેર", "તેરોતેર", "ચોતેર", "પંચોતેર", "છોતેર", "સંતોતેર", "ઇઠોતેર", "ઓગણાએંસી", "એંસી",
    "એક્યાસી", "બ્યાસી", "ત્યાસી", "ચોર્યાસી", "પંચાસી", "છ્યાસી", "સત્યાસી", "અઠ્યાસી", "નેવ્યાસી", "નેવું",
    "એકાણું", "બાણું", "ત્રાણું", "ચોરાણું", "પંચાણું", "છન્નું", "સત્તાણું", "અઠ્ઠાણું", "નવ્વાણું"
]

GUJARATI_DIGITS_MAP = {
    '૦': '0', '૧': '1', '૨': '2', '૩': '3', '૪': '4',
    '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9'
}

MONTHS_GUJARATI = {
    1: "જાન્યુઆરી", 2: "ફેબ્રુઆરી", 3: "માર્ચ", 4: "એપ્રિલ",
    5: "મે", 6: "જૂન", 7: "જુલાઇ", 8: "ઓગસ્ટ",
    9: "સપ્ટેમ્બર", 10: "ઓક્ટોબર", 11: "નવેમ્બર", 12: "ડિસેમ્બર"
}

ABBREVIATIONS_MAP = {
    r"(?<![\u0A80-\u0AFF])ડો\.\s*": "ડોક્ટર ",
    r"(?<![\u0A80-\u0AFF])પ્રો\.\s*": "પ્રોફેસર ",
    r"(?<![\u0A80-\u0AFF])તા\.\s*": "તારીખ ",
    r"(?<![\u0A80-\u0AFF])કિ\.મી\.(?![\u0A80-\u0AFF])": "કિલોમીટર",
    r"(?<![\u0A80-\u0AFF])કિમી(?![\u0A80-\u0AFF])": "કિલોમીટર",
    r"(?<![\u0A80-\u0AFF])કિલોમીટર\.(?![\u0A80-\u0AFF])": "કિલોમીટર",
    r"(?<![\u0A80-\u0AFF])મી\.(?![\u0A80-\u0AFF])": "મીટર",
    r"(?<![\u0A80-\u0AFF])રૂ\.\s*": "રૂપિયા ",
    r"(?<![\u0A80-\u0AFF])વગેરે\.(?![\u0A80-\u0AFF])": "વગેરે",
    r"(?<![\u0A80-\u0AFF])શ્રી\.\s*": "શ્રી ",
    r"(?<![\u0A80-\u0AFF])સ્વ\.\s*": "સ્વર્ગસ્થ ",
    r"(?<![\u0A80-\u0AFF])ઇ\.સ\.\s*": "ઇસવીસન ",
}

ACRONYMS_MAP = {
    r"\bCCTV\b": "સીસીટીવી",
    r"\bcctv\b": "સીસીટીવી",
    r"\bFIR\b": "એફઆઈઆર",
    r"\bfir\b": "એફઆઈઆર",
    r"\bVIP\b": "વીઆઈપી",
    r"\bvip\b": "વીઆઈપી",
    r"\bVVIP\b": "વીવીઆઈપી",
    r"\bPM\b": "વડાપ્રધાન",
    r"\bCM\b": "મુખ્યમંત્રી",
    r"\bMLA\b": "ધારાસભ્ય",
    r"\bMP\b": "સાંસદ",
    r"\bBJP\b": "ભાજપ",
    r"\bAAP\b": "આપ",
    r"\bCongress\b": "કોંગ્રેસ",
    r"\bWHO\b": "ડબ્લ્યુએચઓ",
    r"\bAI\b": "કૃત્રિમ બુદ્ધિમત્તા",
}


def to_gujarati_num_words(n: int) -> str:
    """Converts an integer (0 to 99,99,99,999) into pure spoken Gujarati words."""
    if n < 0:
        return "માઇનસ " + to_gujarati_num_words(-n)
    if n < 100:
        return GUJARATI_NUM_WORDS[n]
    if n < 1000:
        hundreds = n // 100
        rem = n % 100
        h_str = GUJARATI_NUM_WORDS[hundreds] + "સો"
        return h_str if rem == 0 else f"{h_str} {to_gujarati_num_words(rem)}"
    if n < 100000:
        thousands = n // 1000
        rem = n % 1000
        t_str = f"{to_gujarati_num_words(thousands)} હજાર"
        return t_str if rem == 0 else f"{t_str} {to_gujarati_num_words(rem)}"
    if n < 10000000:
        lakhs = n // 100000
        rem = n % 100000
        l_str = f"{to_gujarati_num_words(lakhs)} લાખ"
        return l_str if rem == 0 else f"{l_str} {to_gujarati_num_words(rem)}"
    if n < 1000000000:
        crores = n // 10000000
        rem = n % 10000000
        c_str = f"{to_gujarati_num_words(crores)} કરોડ"
        return c_str if rem == 0 else f"{c_str} {to_gujarati_num_words(rem)}"
    
    # Larger numbers fallback: pronounce in chunks
    return " ".join(GUJARATI_NUM_WORDS[int(d)] for d in str(n))


class GujaratiTextNormalizer:
    """Production text normalizer for Gujarati broadcast news."""

    def __init__(self):
        pass

    def normalize(self, text: str) -> str:
        """Main pipeline: transforms raw input into clean spoken Gujarati text."""
        if not text:
            return ""

        s = text

        # 1. Standardize Gujarati digits to Latin for unified processing
        for gu_d, lat_d in GUJARATI_DIGITS_MAP.items():
            s = s.replace(gu_d, lat_d)

        # 2. Breaking news and headline markers
        s = re.sub(r"\bબ્રેકિંગ\s+ન્યૂઝ[:\s]*", "બ્રેકિંગ ન્યૂઝ. ", s)
        s = re.sub(r"\bમોટા\s+સમાચાર[:\s]*", "મોટા સમાચાર. ", s)
        s = re.sub(r"\bતાજા\s+અપડેટ[:\s]*", "તાજા અપડેટ. ", s)

        # 3. Currency normalization (e.g. ₹50,000, ₹ 10 કરોડ, Rs. 500)
        s = re.sub(r"[₹]|Rs\.\s*|રૂ\.\s*", "રૂપિયા ", s)
        # Handle comma-separated numbers following રૂપિયા
        s = re.sub(
            r"રૂપિયા\s+(\d{1,3}(?:,\d{2,3})+|\d+(?:\.\d+)?)\s*(કરોડ|લાખ|હજાર)?",
            self._normalize_currency,
            s
        )
        s = re.sub(
            r"(\d{1,3}(?:,\d{2,3})+|\d+(?:\.\d+)?)\s*રૂપિયા",
            self._normalize_currency_post,
            s
        )
        s = re.sub(r"\$(\d+)", lambda m: f"{to_gujarati_num_words(int(m.group(1)))} ડોલર", s)

        # 4. Temperature (e.g. 32°C, 35 C, 40 ડિગ્રી)
        s = re.sub(r"(\d+)\s*(?:°C|°\s*C|ડિગ્રી\s*સેલ્સિયસ)", lambda m: f"{to_gujarati_num_words(int(m.group(1)))} ડિગ્રી સેલ્સિયસ", s)

        # 5. Percentages (e.g. 15%, 2.5 %)
        s = re.sub(r"(\d+(?:\.\d+)?)\s*%", self._normalize_percentage, s)

        # 6. Time (e.g. 10:30 AM, 10:30 વાગ્યે, 08:45 PM)
        s = re.sub(r"\b(\d{1,2}):(\d{2})(?:\s*(AM|PM|am|pm))?(?:\s*વાગ્યે)?", self._normalize_time, s)

        # 7. Dates (e.g. 15/09/2026, 15-09-2026, 15/9/26)
        s = re.sub(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b", self._normalize_date, s)
        s = re.sub(r"\b(\d{1,2})મી\s+([^\s,]+)", lambda m: f"{to_gujarati_num_words(int(m.group(1)))}મી {m.group(2)}", s)

        # 8. Acronyms & Abbreviations
        for pattern, repl in ACRONYMS_MAP.items():
            s = re.sub(pattern, repl, s)
        for pattern, repl in ABBREVIATIONS_MAP.items():
            s = re.sub(pattern, repl, s)

        # 9. Decimals (e.g. 3.5 -> ત્રણ પોઇન્ટ પાંચ)
        s = re.sub(r"\b(\d+)\.(\d+)\b", self._normalize_decimal, s)

        # 10. Large numbers with Indian comma grouping (e.g. 1,25,000 or 50,000)
        s = re.sub(r"\b\d{1,3}(?:,\d{2,3})+\b", lambda m: to_gujarati_num_words(int(m.group(0).replace(",", ""))), s)

        # 11. Plain integer digits
        s = re.sub(r"\b\d+\b", self._normalize_integer, s)

        # 12. Clean up punctuation spacing for natural TTS pauses
        s = re.sub(r"[।]", ".", s)
        s = re.sub(r"\s+", " ", s)
        s = re.sub(r"\s*([,.:;!?])\s*", r"\1 ", s)
        s = s.strip()

        return s

    def _normalize_currency(self, m: re.Match) -> str:
        num_str = m.group(1).replace(",", "")
        scale = m.group(2)
        try:
            if "." in num_str:
                num = float(num_str)
                word = self._float_to_words(num)
            else:
                word = to_gujarati_num_words(int(num_str))
            if scale:
                return f"{word} {scale} રૂપિયા"
            return f"{word} રૂપિયા"
        except Exception:
            return m.group(0)

    def _normalize_currency_post(self, m: re.Match) -> str:
        num_str = m.group(1).replace(",", "")
        try:
            if "." in num_str:
                word = self._float_to_words(float(num_str))
            else:
                word = to_gujarati_num_words(int(num_str))
            return f"{word} રૂપિયા"
        except Exception:
            return m.group(0)

    def _normalize_percentage(self, m: re.Match) -> str:
        num_str = m.group(1)
        if "." in num_str:
            return f"{self._float_to_words(float(num_str))} ટકા"
        return f"{to_gujarati_num_words(int(num_str))} ટકા"

    def _normalize_time(self, m: re.Match) -> str:
        hh = int(m.group(1))
        mm = int(m.group(2))
        period = m.group(3)

        prefix = ""
        if period:
            period = period.upper()
            if period == "AM":
                prefix = "સવારે " if hh < 12 else "બપોરે "
            elif period == "PM":
                prefix = "બપોરે " if (hh < 4 or hh == 12) else ("સાંજે " if hh < 8 else "રાત્રે ")

        h_word = to_gujarati_num_words(hh if hh <= 12 else hh - 12)

        if mm == 0:
            return f"{prefix}{h_word} વાગ્યે"
        elif mm == 15:
            return f"{prefix}સવા {h_word} વાગ્યે"
        elif mm == 30:
            if hh == 1:
                return f"{prefix}દોઢ વાગ્યે"
            elif hh == 2:
                return f"{prefix}અઢી વાગ્યે"
            return f"{prefix}સાડા {h_word} વાગ્યે"
        elif mm == 45:
            next_h = to_gujarati_num_words((hh % 12) + 1)
            return f"{prefix}પોણા {next_h} વાગ્યે"
        else:
            m_word = to_gujarati_num_words(mm)
            return f"{prefix}{h_word} વાગીને {m_word} મિનિટે"

    def _normalize_date(self, m: re.Match) -> str:
        d = int(m.group(1))
        month = int(m.group(2))
        y = int(m.group(3))

        d_word = to_gujarati_num_words(d)
        m_word = MONTHS_GUJARATI.get(month, f"મહિનો {to_gujarati_num_words(month)}")
        y_word = to_gujarati_num_words(y)

        return f"{d_word} {m_word} {y_word}"

    def _normalize_decimal(self, m: re.Match) -> str:
        int_part = to_gujarati_num_words(int(m.group(1)))
        dec_part = " ".join(to_gujarati_num_words(int(d)) for d in m.group(2))
        return f"{int_part} પોઇન્ટ {dec_part}"

    def _float_to_words(self, val: float) -> str:
        int_val = int(val)
        dec_part = str(val).split(".")[1]
        return f"{to_gujarati_num_words(int_val)} પોઇન્ટ " + " ".join(to_gujarati_num_words(int(d)) for d in dec_part)

    def _normalize_integer(self, m: re.Match) -> str:
        digits = m.group(0)
        # If longer than 8 digits, likely phone or reference code: pronounce digit by digit
        if len(digits) > 8:
            return " ".join(to_gujarati_num_words(int(d)) for d in digits)
        return to_gujarati_num_words(int(digits))

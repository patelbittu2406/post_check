"""
Audio Tag Parser for Prarambh Voice Engine
===========================================
Parses ElevenLabs-style and Svara-style audio tags from Gujarati news scripts:
- Emotion Tags: [excited], [happy], [serious], [sad], [angry], [concerned], [curious], [confident], [nervous], [whispers]
- Delivery & Pacing Tags: [pauses], [shouts], [softly], [stammers]
- Human Reaction Tags: [laughs], [sighs], [gasps], [clears throat], [gulps]
- Punctuation & Capitalization Cues: '...', '!', 'ALL CAPS', '—', ','
Supports both [tag] and <tag> syntax.
"""

import re
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple, Any


@dataclass
class TagDefinition:
    tag: str
    category: str  # "emotion", "delivery", "reaction"
    description: str
    gujarati_use_case: str
    speed_factor: float = 1.0
    pitch_semitones: float = 0.0
    volume_factor: float = 1.0
    pause_ms: int = 0
    style_weight: float = 0.5


PUNCTUATION_PAUSES: Dict[str, int] = {
    ",": 180,
    ".": 350,
    "!": 400,
    "?": 350,
    "...": 500,
    "—": 250,
}


AUDIO_TAG_CATALOG: Dict[str, TagDefinition] = {
    # ── Emotion Tags ──────────────────────────────────────────────────────────
    "excited": TagDefinition(
        tag="[excited]",
        category="emotion",
        description="High energy, enthusiastic and brisk",
        gujarati_use_case="Breaking news, celebratory headlines, grand announcements",
        speed_factor=1.12,
        pitch_semitones=1.2,
        volume_factor=1.15,
        style_weight=0.85,
    ),
    "happy": TagDefinition(
        tag="[happy]",
        category="emotion",
        description="Upbeat, cheerful, bright inflection",
        gujarati_use_case="Good news, cultural festivals, human triumph stories",
        speed_factor=1.06,
        pitch_semitones=0.8,
        volume_factor=1.05,
        style_weight=0.70,
    ),
    "serious": TagDefinition(
        tag="[serious]",
        category="emotion",
        description="Grave, authoritative, measured anchor delivery",
        gujarati_use_case="Crime watch, road accidents, legal proceedings, politics",
        speed_factor=0.94,
        pitch_semitones=-0.6,
        volume_factor=1.0,
        style_weight=0.75,
    ),
    "sad": TagDefinition(
        tag="[sad]",
        category="emotion",
        description="Sorrowful, empathetic, subdued tone",
        gujarati_use_case="Tragedies, condolences, emergency disasters",
        speed_factor=0.88,
        pitch_semitones=-1.2,
        volume_factor=0.90,
        style_weight=0.80,
    ),
    "angry": TagDefinition(
        tag="[angry]",
        category="emotion",
        description="Forceful, sharp, urgent delivery",
        gujarati_use_case="Civic outrage, protests, scams, investigative exposes",
        speed_factor=1.08,
        pitch_semitones=0.5,
        volume_factor=1.20,
        style_weight=0.85,
    ),
    "concerned": TagDefinition(
        tag="[concerned]",
        category="emotion",
        description="Worried, cautious, protective tone",
        gujarati_use_case="Health advisories, severe weather warnings, safety alerts",
        speed_factor=0.96,
        pitch_semitones=-0.3,
        volume_factor=0.98,
        style_weight=0.65,
    ),
    "curious": TagDefinition(
        tag="[curious]",
        category="emotion",
        description="Inquisitive, intriguing pitch rise",
        gujarati_use_case="Feature stories, mysterious updates, upcoming twists",
        speed_factor=1.02,
        pitch_semitones=0.7,
        volume_factor=1.0,
        style_weight=0.60,
    ),
    "confident": TagDefinition(
        tag="[confident]",
        category="emotion",
        description="Strong, assured, prime-time authority",
        gujarati_use_case="Expert opinions, economic analysis, business milestones",
        speed_factor=1.0,
        pitch_semitones=0.0,
        volume_factor=1.10,
        style_weight=0.70,
    ),
    "nervous": TagDefinition(
        tag="[nervous]",
        category="emotion",
        description="Uncertain, rapid, tense cadence",
        gujarati_use_case="Developing breaking situations, tense confrontations",
        speed_factor=1.07,
        pitch_semitones=0.6,
        volume_factor=0.95,
        style_weight=0.65,
    ),
    "whispers": TagDefinition(
        tag="[whispers]",
        category="emotion",
        description="Soft, intimate, confidential delivery",
        gujarati_use_case="Behind-the-scenes revelations, exclusive insider scoops",
        speed_factor=0.90,
        pitch_semitones=-0.8,
        volume_factor=0.75,
        style_weight=0.90,
    ),

    # ── Delivery & Pacing Tags ────────────────────────────────────────────────
    "pauses": TagDefinition(
        tag="[pauses]",
        category="delivery",
        description="Natural editorial pause",
        gujarati_use_case="Between separate headline points and transitions",
        pause_ms=450,
    ),
    "shouts": TagDefinition(
        tag="[shouts]",
        category="delivery",
        description="Loud, projected alert voice",
        gujarati_use_case="Urgent red alerts, vital public announcements",
        speed_factor=1.10,
        pitch_semitones=1.5,
        volume_factor=1.25,
        style_weight=0.90,
    ),
    "softly": TagDefinition(
        tag="[softly]",
        category="delivery",
        description="Gentle, quiet, respectful delivery",
        gujarati_use_case="Emotional human stories, respectful tributes",
        speed_factor=0.92,
        pitch_semitones=-0.4,
        volume_factor=0.85,
        style_weight=0.70,
    ),
    "stammers": TagDefinition(
        tag="[stammers]",
        category="delivery",
        description="Hesitant speech pattern for suspense",
        gujarati_use_case="Dramatic storytelling pauses",
        speed_factor=0.95,
        pause_ms=200,
        style_weight=0.60,
    ),

    # ── Human Reaction Tags ───────────────────────────────────────────────────
    "laughs": TagDefinition(
        tag="[laughs]",
        category="reaction",
        description="Subtle, warm chuckle/laugh inflection",
        gujarati_use_case="Humorous news items, lighthearted local segments",
        speed_factor=1.04,
        pitch_semitones=0.6,
        pause_ms=250,
        style_weight=0.75,
    ),
    "sighs": TagDefinition(
        tag="[sighs]",
        category="reaction",
        description="Audible empathetic breath exhalation",
        gujarati_use_case="Emotional transitions, relief, deep reflection",
        speed_factor=0.88,
        pause_ms=350,
        style_weight=0.70,
    ),
    "gasps": TagDefinition(
        tag="[gasps]",
        category="reaction",
        description="Sharp intake of breath showing surprise",
        gujarati_use_case="Shocking revelations, sudden plot twists",
        speed_factor=1.05,
        pitch_semitones=1.0,
        pause_ms=200,
        style_weight=0.80,
    ),
    "clears throat": TagDefinition(
        tag="[clears throat]",
        category="reaction",
        description="Brief professional throat clearing cue",
        gujarati_use_case="Natural anchor transition before key headline",
        pause_ms=300,
        style_weight=0.50,
    ),
    "gulps": TagDefinition(
        tag="[gulps]",
        category="reaction",
        description="Subtle dramatic swallowing pause",
        gujarati_use_case="Suspenseful moment before revealing critical detail",
        pause_ms=280,
        style_weight=0.50,
    ),
}


@dataclass
class ParsedSegment:
    """A segment of text with applied audio tags and acoustic modifiers."""
    raw_text: str
    clean_text: str
    active_tags: List[str] = field(default_factory=list)
    emotion: str = "neutral"
    speed_factor: float = 1.0
    pitch_semitones: float = 0.0
    volume_factor: float = 1.0
    pause_before_ms: int = 0
    pause_after_ms: int = 0
    style_exaggeration: float = 0.45
    is_shouting: bool = False


@dataclass
class AudioTagParseResult:
    """The complete result of parsing a tagged script."""
    original_text: str
    clean_text: str
    segments: List[ParsedSegment]
    detected_tags: List[str]
    unsupported_tags: List[str]
    estimated_duration_s: float = 0.0


class AudioTagParser:
    """
    Parses and extracts emotion, delivery, and reaction audio tags
    from scripts to drive expressive local voice synthesis.
    """

    # Regular expression matching [tag] or <tag>
    TAG_REGEX = re.compile(r"(\[([a-zA-Z\s_]+)\]|<([a-zA-Z\s_]+)>)")

    @classmethod
    def get_tag_catalog(cls) -> List[Dict[str, Any]]:
        """Returns the full tag reference list for autocomplete and UI display."""
        return [
            {
                "tag": defn.tag,
                "clean_name": k,
                "category": defn.category,
                "description": defn.description,
                "gujarati_use_case": defn.gujarati_use_case,
                "speed_factor": defn.speed_factor,
                "pitch_semitones": defn.pitch_semitones,
                "pause_ms": defn.pause_ms,
            }
            for k, defn in AUDIO_TAG_CATALOG.items()
        ]

    @classmethod
    def strip_tags(cls, text: str) -> str:
        """Removes all [tag] and <tag> markers returning clean script text."""
        cleaned = cls.TAG_REGEX.sub(" ", text)
        # Normalize multiple spaces
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned

    @classmethod
    def parse(
        cls,
        text: str,
        base_speed: float = 1.0,
        base_pitch: float = 0.0,
        base_pause: float = 0.5,
        default_emotion: str = "neutral",
    ) -> AudioTagParseResult:
        """
        Parses script text, extracts audio tags, and splits into expressive segments.
        """
        if not text or not text.strip():
            return AudioTagParseResult(
                original_text="",
                clean_text="",
                segments=[],
                detected_tags=[],
                unsupported_tags=[],
                estimated_duration_s=0.0,
            )

        detected_tags: List[str] = []
        unsupported_tags: List[str] = []

        # Find all tags in raw script
        for match in cls.TAG_REGEX.finditer(text):
            tag_name = (match.group(2) or match.group(3) or "").strip().lower()
            if tag_name in AUDIO_TAG_CATALOG:
                detected_tags.append(AUDIO_TAG_CATALOG[tag_name].tag)
            else:
                unsupported_tags.append(match.group(1))

        # Split text by sentence terminators (।, ., ?, !, \n) while keeping tag contexts
        raw_sentences = re.split(r"([।\.\?!;\n]+)", text)
        segments: List[ParsedSegment] = []

        # State tracking
        current_tags: List[str] = []
        if default_emotion != "neutral" and default_emotion.lower() in AUDIO_TAG_CATALOG:
            current_tags.append(default_emotion.lower())

        i = 0
        while i < len(raw_sentences):
            chunk = raw_sentences[i]
            punct = raw_sentences[i + 1] if i + 1 < len(raw_sentences) else ""
            i += 2

            combined_chunk = chunk + punct
            if not combined_chunk.strip():
                continue

            # Check if chunk contains tags and update current state
            tag_matches = cls.TAG_REGEX.findall(combined_chunk)
            chunk_tags = list(current_tags)
            chunk_pause_after = int(base_pause * 1000)

            for full_match, tag1, tag2 in tag_matches:
                t_name = (tag1 or tag2).strip().lower()
                if t_name in AUDIO_TAG_CATALOG:
                    t_def = AUDIO_TAG_CATALOG[t_name]
                    if t_def.category == "emotion":
                        # Replace active emotion
                        chunk_tags = [t for t in chunk_tags if t not in AUDIO_TAG_CATALOG or AUDIO_TAG_CATALOG[t].category != "emotion"]
                        chunk_tags.append(t_name)
                    elif t_name == "pauses":
                        chunk_pause_after += t_def.pause_ms
                    else:
                        chunk_tags.append(t_name)

            clean_seg = cls.strip_tags(combined_chunk)
            if not clean_seg:
                continue

            # Calculate acoustic modifiers
            seg_speed = base_speed
            seg_pitch = base_pitch
            seg_vol = 1.0
            seg_emotion = default_emotion
            is_shout = False

            for t in chunk_tags:
                if t in AUDIO_TAG_CATALOG:
                    defn = AUDIO_TAG_CATALOG[t]
                    if defn.category == "emotion":
                        seg_emotion = t
                    seg_speed *= defn.speed_factor
                    seg_pitch += defn.pitch_semitones
                    seg_vol *= defn.volume_factor
                    if t == "shouts":
                        is_shout = True

            # Handle Punctuation Pacing
            if "..." in punct or "…" in combined_chunk:
                chunk_pause_after = max(chunk_pause_after, 500)
            elif "!" in punct:
                seg_speed *= 1.05
                seg_vol *= 1.1
            elif "—" in combined_chunk or "-" in combined_chunk:
                chunk_pause_after = max(chunk_pause_after, 250)

            # Check for ALL CAPS (Intense delivery)
            guj_chars = [c for c in clean_seg if '\u0a80' <= c <= '\u0aff']
            latin_words = re.findall(r"\b[A-Z]{2,}\b", clean_seg)
            if latin_words:
                seg_vol *= 1.15
                seg_speed *= 1.05

            segments.append(
                ParsedSegment(
                    raw_text=combined_chunk.strip(),
                    clean_text=clean_seg,
                    active_tags=chunk_tags,
                    emotion=seg_emotion,
                    speed_factor=round(seg_speed, 2),
                    pitch_semitones=round(seg_pitch, 2),
                    volume_factor=round(seg_vol, 2),
                    pause_after_ms=chunk_pause_after,
                    is_shouting=is_shout,
                )
            )

        clean_full_text = cls.strip_tags(text)

        # Estimate total duration
        # Average Gujarati speech rate: ~2.4 - 2.8 syllables / words per sec
        words_count = len(clean_full_text.split())
        est_speech_s = words_count / (2.5 * base_speed)
        est_pause_s = sum(s.pause_after_ms for s in segments) / 1000.0
        total_est_s = round(est_speech_s + est_pause_s, 2)

        return AudioTagParseResult(
            original_text=text,
            clean_text=clean_full_text,
            segments=segments,
            detected_tags=list(set(detected_tags)),
            unsupported_tags=list(set(unsupported_tags)),
            estimated_duration_s=total_est_s,
        )


if __name__ == "__main__":
    test_script = (
        "[excited] બ્રેકિંગ ન્યૂઝ! [pauses] સુરતના વેસુ વિસ્તારમાં આજે ગણેશ ઉત્સવ દરમિયાન ભારે વરસાદ પડ્યો છે. "
        "[serious] પોલીસ કમિશનરે સુરક્ષા વ્યવસ્થાની સમીક્ષા કરી. [laughs] ભક્તોનો ઉત્સાહ જોરદાર હતો!"
    )
    result = AudioTagParser.parse(test_script)
    print("Clean Text:\n", result.clean_text)
    print("\nDetected Tags:", result.detected_tags)
    print("\nSegments:")
    for idx, seg in enumerate(result.segments):
        print(f"[{idx+1}] Emotion={seg.emotion}, Speed={seg.speed_factor}x, Pitch={seg.pitch_semitones:+0.1f}st, PauseAfter={seg.pause_after_ms}ms")
        print(f"    Text: {seg.clean_text}")

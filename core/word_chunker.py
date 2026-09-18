"""
Word Chunker — Groups words into 1-3 word bursts with smart boundaries.
Respects punctuation, voiceover pauses, Gujarati compounds, and orphan merging.
"""

from typing import List, Dict, Any


class WordChunker:
    """
    Groups word-level timestamps into readable 1-3 word chunks
    for CapCut/Hormozi-style subtitle display.
    """

    def __init__(
        self,
        max_words: int = 3,
        pause_threshold: float = 0.25,
        min_chunk_duration: float = 0.3,
        max_chunk_duration: float = 1.5,
        orphan_merge_gap: float = 0.3,
    ):
        self.max_words = max(1, min(3, max_words))
        self.pause_threshold = pause_threshold
        self.min_chunk_duration = min_chunk_duration
        self.max_chunk_duration = max_chunk_duration
        self.orphan_merge_gap = orphan_merge_gap

        # Gujarati and common punctuation that triggers a chunk break
        self._break_punctuation = set(".,!?—।;:")

    def _has_punctuation(self, word: str) -> bool:
        """Check if word ends with break-triggering punctuation."""
        return any(p in word for p in self._break_punctuation)

    def _is_pause_after(self, words: List[Dict], index: int) -> bool:
        """Check if there's a voiceover pause after this word."""
        if index + 1 >= len(words):
            return False
        gap = words[index + 1]["start"] - words[index]["end"]
        return gap > self.pause_threshold

    def group(self, words: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        """
        Group words into 1-3 word chunks based on timing and punctuation.

        Rules:
        1. Max words per chunk (1-3, configurable).
        2. Break on punctuation (. , ! ? — ।).
        3. Break on voiceover pauses (> pause_threshold gap).
        4. Never split Gujarati compound words.
        5. Merge single-word orphans with next chunk if gap < orphan_merge_gap.
        6. Preserve original word order.

        Returns:
            List of chunks, where each chunk is a list of word dicts.
        """
        if not words:
            return []

        # Sanitize: filter out any audio tags like [excited], [pauses], etc.
        sanitized_words = []
        for w in words:
            txt = w.get("word", "").strip()
            if not txt:
                continue
            if (txt.startswith("[") and txt.endswith("]")) or (txt.startswith("<") and txt.endswith(">")):
                continue
            sanitized_words.append(w)

        if not sanitized_words:
            return []

        chunks = []
        current = []

        for i, word in enumerate(sanitized_words):
            current.append(word)

            # Check break conditions
            is_punct = self._has_punctuation(word["word"])
            is_full = len(current) >= self.max_words
            is_pause = self._is_pause_after(sanitized_words, i)

            if is_punct or is_full or is_pause:
                chunks.append(current)
                current = []

        # Flush remaining
        if current:
            chunks.append(current)

        # Post-process: merge orphan single-word chunks
        chunks = self._merge_orphans(chunks)

        # Post-process: enforce minimum duration
        chunks = self._enforce_min_duration(chunks)

        return chunks

    def _merge_orphans(self, chunks: List[List[Dict]]) -> List[List[Dict]]:
        """Merge single-word chunks into adjacent chunks if gap is small."""
        if len(chunks) <= 1:
            return chunks

        merged = []
        i = 0
        while i < len(chunks):
            chunk = chunks[i]

            # If single word and next chunk exists and gap is small, merge forward
            if (
                len(chunk) == 1
                and i + 1 < len(chunks)
                and len(chunks[i + 1]) < self.max_words
            ):
                gap = chunks[i + 1][0]["start"] - chunk[0]["end"]
                if gap < self.orphan_merge_gap:
                    # Prepend this word to next chunk
                    chunks[i + 1] = chunk + chunks[i + 1]
                    i += 1
                    continue

            # If single word and previous merged chunk exists, try merging back
            if (
                len(chunk) == 1
                and merged
                and len(merged[-1]) < self.max_words
            ):
                gap = chunk[0]["start"] - merged[-1][-1]["end"]
                if gap < self.orphan_merge_gap:
                    merged[-1].append(chunk[0])
                    i += 1
                    continue

            merged.append(chunk)
            i += 1

        return merged

    def _enforce_min_duration(self, chunks: List[List[Dict]]) -> List[List[Dict]]:
        """Ensure each chunk has at least min_chunk_duration display time."""
        for chunk in chunks:
            if not chunk:
                continue
            duration = chunk[-1]["end"] - chunk[0]["start"]
            if duration < self.min_chunk_duration:
                # Extend the end time
                chunk[-1]["end"] = round(chunk[0]["start"] + self.min_chunk_duration, 3)
        return chunks

    @staticmethod
    def chunks_to_flat(chunks: List[List[Dict]]) -> List[Dict]:
        """Convert chunks to a flat list with chunk metadata for the timeline."""
        flat = []
        for chunk_idx, chunk in enumerate(chunks):
            text = " ".join(w["word"] for w in chunk)
            flat.append({
                "chunk_index": chunk_idx,
                "text": text,
                "start": chunk[0]["start"],
                "end": chunk[-1]["end"],
                "word_count": len(chunk),
                "words": chunk,
            })
        return flat

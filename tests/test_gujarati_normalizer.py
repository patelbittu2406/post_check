"""
Unit Tests for Gujarati Text Normalizer
========================================
Tests number words, currency, dates, times, abbreviations, temperatures, and acronyms.
"""

import unittest
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from core.tts.gujarati_normalizer import GujaratiTextNormalizer, to_gujarati_num_words


class TestGujaratiTextNormalizer(unittest.TestCase):

    def setUp(self):
        self.norm = GujaratiTextNormalizer()

    def test_numbers_to_words(self):
        self.assertEqual(to_gujarati_num_words(0), "શૂન્ય")
        self.assertEqual(to_gujarati_num_words(5), "પાંચ")
        self.assertEqual(to_gujarati_num_words(15), "પંદર")
        self.assertEqual(to_gujarati_num_words(100), "એકસો")
        self.assertEqual(to_gujarati_num_words(150), "એકસો પચાસ")
        self.assertEqual(to_gujarati_num_words(1000), "એક હજાર")
        self.assertEqual(to_gujarati_num_words(100000), "એક લાખ")
        self.assertEqual(to_gujarati_num_words(10000000), "એક કરોડ")

    def test_temperature_normalization(self):
        res = self.norm.normalize("આજે 32°C તાપમાન છે.")
        self.assertIn("બત્રીસ ડિગ્રી સેલ્સિયસ", res)

    def test_percentage_normalization(self):
        res = self.norm.normalize("કુલ 25% વધારો થયો.")
        self.assertIn("પચ્ચીસ ટકા", res)

    def test_time_normalization(self):
        res1 = self.norm.normalize("સવારે 10:30 વાગ્યે ઘટના બની.")
        self.assertIn("સાડા દસ વાગ્યે", res1)

        res2 = self.norm.normalize("બપોરે 01:15 વાગ્યે.")
        self.assertIn("સવા એક વાગ્યે", res2)

    def test_date_normalization(self):
        res = self.norm.normalize("તારીખ 15/09/2026 ના રોજ.")
        self.assertIn("પંદર સપ્ટેમ્બર બે હજાર છવ્વીસ", res)

    def test_currency_normalization(self):
        res1 = self.norm.normalize("પોલીસે ₹50,000 નો દંડ ફટકાર્યો.")
        self.assertIn("પચાસ હજાર રૂપિયા", res1)

        res2 = self.norm.normalize("કુલ 500 રૂપિયા ખર્ચ થયા.")
        self.assertIn("પાંચસો રૂપિયા", res2)

    def test_acronyms_normalization(self):
        res = self.norm.normalize("CCTV ફૂટેજ અને FIR નોંધી.")
        self.assertIn("સીસીટીવી", res)
        self.assertIn("એફઆઈઆર", res)

    def test_abbreviations_normalization(self):
        res = self.norm.normalize("ડો. પટેલ હાજર રહ્યા અને 10 કિમી ચાલ્યા.")
        self.assertIn("ડોક્ટર પટેલ", res)
        self.assertIn("દસ કિલોમીટર", res)

    def test_gujarati_digits(self):
        res = self.norm.normalize("કુલ ૧૫૦ લોકો આવ્યા.")
        self.assertIn("એકસો પચાસ", res)


if __name__ == "__main__":
    unittest.main()

"""
Unit Tests for Gujarati Dialect & Phonology Engine
===================================================
Validates phonological rewrites and vocabulary adaptations across all 5 accents.
"""

import unittest
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from core.tts.dialect_engine import DialectEngine


class TestDialectEngine(unittest.TestCase):

    def setUp(self):
        self.engine = DialectEngine()

    def test_all_five_profiles_loaded(self):
        profiles = self.engine.profiles
        self.assertIn("standard", profiles)
        self.assertIn("kathiyawadi", profiles)
        self.assertIn("mahesani", profiles)
        self.assertIn("surati", profiles)
        self.assertIn("news_anchor", profiles)

    def test_standard_accent(self):
        text = "અહીંયા વેસુમાં ચોરી થઈ અને આરોપી પકડાઈ ગયો હતો."
        res, prof = self.engine.transform_text(text, "gu-standard")
        self.assertEqual(prof.id, "standard")
        self.assertEqual(prof.speech_rate, 1.0)
        self.assertIn("પકડાઈ ગયો હતો", res)

    def test_kathiyawadi_accent(self):
        text = "અહીંયા વેસુમાં ચોરી થઈ અને આરોપી પકડાઈ ગયો હતો. મોટી સંખ્યામાં લોકો ભેગા થયા."
        res, prof = self.engine.transform_text(text, "gu-kathiyawadi")
        self.assertEqual(prof.id, "kathiyawadi")
        self.assertEqual(prof.speech_rate, 1.04)
        # Should have Saurashtra past verb contraction and lexical shifts
        self.assertIn("ગિયો'તો", res)
        self.assertIn("હિયાં", res)
        self.assertIn("ઢગલાબંધ", res)

    def test_mahesani_accent(self):
        text = "તમે ક્યાં જઈ રહ્યા છો? આજે મહેસાણામાં વરસાદ છે."
        res, prof = self.engine.transform_text(text, "gu-mahesani")
        self.assertEqual(prof.id, "mahesani")
        self.assertEqual(prof.speech_rate, 1.08)
        # Should have North Gujarat palatal shift and copula sibilant
        self.assertIn("ચ્યાં", res)
        self.assertIn("વરસાદ શે", res)

    def test_surati_accent(self):
        text = "સુરતમાં આજે બહુ ટ્રાફિક છે, લોકો સાથે મળીને કામ કરે છે."
        res, prof = self.engine.transform_text(text, "gu-surati")
        self.assertEqual(prof.id, "surati")
        self.assertEqual(prof.speech_rate, 0.96)
        # Should have Surati quantifier and s->h lenition
        self.assertIn("બોવ", res)
        self.assertIn("હાથે", res)

    def test_news_anchor_accent(self):
        text = "બ્રેકિંગ ન્યૂઝ: સુરત કમિશનર કચેરીથી અત્યારના સૌથી મોટા સમાચાર."
        res, prof = self.engine.transform_text(text, "gu-news-anchor")
        self.assertEqual(prof.id, "news_anchor")
        self.assertEqual(prof.speech_rate, 1.12)
        self.assertEqual(prof.pause_multiplier, 0.88)


if __name__ == "__main__":
    unittest.main()

"""
Unit and API Integration Tests for Script Auto-Tagging
======================================================
Verifies:
1. Intelligent audio tag insertion based on Gujarati sentiment & category.
2. 100% preservation of user input words (zero text alteration).
3. FastAPI endpoint /api/script/auto-tag functionality (tag only & tag+voice).
"""

import sys
import unittest
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import config
from core.llm_adapter import LLMAdapter, AutoTagScriptOutput
from starlette.testclient import TestClient
from server import app


class TestAutoTagScript(unittest.TestCase):
    def setUp(self):
        self.adapter = LLMAdapter()
        self.client = TestClient(app)

    def test_01_offline_auto_tag_preserves_words(self):
        """Validates that offline auto-tagger preserves exact words and inserts tags."""
        input_script = "સુરતના અડાજણ વિસ્તારમાં આજે સવારે નવા ફ્લાયઓવર બ્રિજનું કામ પૂર્ણ થયું છે. સ્થાનિક રહીશોમાં ભારે ખુશી જોવા મળી રહી છે અને વાહનચાલકોને મોટી રાહત મળશે."
        
        tagged = self.adapter._offline_auto_tag_script(input_script, category_code="F01")
        
        # Must contain emotion tags
        self.assertTrue(any(tag in tagged for tag in ["[excited]", "[happy]", "[serious]", "[concerned]"]))
        self.assertIn("[pauses]", tagged)
        
        # Verify text preservation
        orig_clean = self.adapter._strip_tags(input_script)
        tagged_clean = self.adapter._strip_tags(tagged)
        
        # Words must be identical
        orig_words = [w for w in orig_clean.split() if w]
        tagged_words = [w for w in tagged_clean.split() if w]
        self.assertEqual(orig_words, tagged_words)

    def test_02_crime_category_triggers_serious_tags(self):
        """Checks that crime category assigns [serious] opening tag and keeps words."""
        crime_script = "અડાજણ વિસ્તારમાં દુકાનમાંથી ચોરીની ઘટના સામે આવી. પોલીસે તાત્કાલિક તપાસ શરૂ કરી છે."
        tagged = self.adapter._offline_auto_tag_script(crime_script, category_code="C01")
        
        self.assertTrue(tagged.startswith("[serious]"))
        self.assertTrue(self.adapter._verify_text_preserved(crime_script, tagged))

    def test_03_api_auto_tag_only(self):
        """Tests POST /api/script/auto-tag without voice generation."""
        payload = {
            "script_text": "સુરતના ડુમસ બીચ પર મોટી સંખ્યામાં લોકો ઉમટ્યા. વાતાવરણ ખૂબ જ આહલાદક બન્યું.",
            "category_code": "F01",
            "area": "Dumas",
            "generate_voice": False
        }
        resp = self.client.post("/api/script/auto-tag", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("tagged_script", data)
        self.assertIn("[", data["tagged_script"])
        self.assertNotIn("audio_url", data)

    def test_04_api_auto_tag_with_voice(self):
        """Tests POST /api/script/auto-tag with immediate voice generation."""
        payload = {
            "script_text": "સુરતમાં આજે હવામાન ચોખ્ખું રહેશે.",
            "category_code": "W01",
            "generate_voice": True,
            "voice_id": "PRARAMBH_MALE"
        }
        resp = self.client.post("/api/script/auto-tag", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("tagged_script", data)
        self.assertIn("audio_url", data)
        self.assertIn("voiceover_filename", data)


if __name__ == "__main__":
    unittest.main()

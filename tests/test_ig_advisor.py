"""
Unit & Integration Tests for GeminiGrowthAdvisor (core/ig_advisor.py)
Validates Instagram algorithm analysis, GrowthAuditReport schema validation,
demographic summary, critical mistake detection, winning patterns,
and 5 fresh Gujarati reel recommendations.
"""

import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

# Ensure project root is in path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from core.ig_advisor import GeminiGrowthAdvisor, GrowthAuditReport, ContentRecommendationItem


def test_advisor_initialization():
    """Test advisor initialization and API key configuration."""
    print("\n[Test 1] Testing GeminiGrowthAdvisor initialization...")
    advisor = GeminiGrowthAdvisor(api_key="test_key_abc", model="gemini-2.5-flash")
    assert advisor.api_key == "test_key_abc"
    assert advisor.model == "gemini-2.5-flash"
    assert advisor._resolve_api_key("custom_key") == "custom_key"
    print("  ✓ Initialization OK")


def test_growth_audit_schema_and_fallback():
    """Test GrowthAuditReport generation, schema compliance, and content plan."""
    print("\n[Test 2] Testing GrowthAuditReport schema and fallback generation...")
    advisor = GeminiGrowthAdvisor()
    report = advisor.analyze_account_performance()

    # Validate top-level schema fields
    assert "audience_summary" in report
    assert "critical_mistakes_detected" in report
    assert "top_winning_patterns" in report
    assert "content_recommendation_plan" in report
    assert "immediate_action_fixes" in report

    # Verify audience summary contains local context
    assert "Surat" in report["audience_summary"]

    # Verify mistakes and winning patterns
    assert len(report["critical_mistakes_detected"]) >= 3
    assert len(report["top_winning_patterns"]) >= 2
    assert 3 <= len(report["immediate_action_fixes"]) <= 5

    # Verify exactly 5 fresh content recommendations
    plan = report["content_recommendation_plan"]
    assert len(plan) == 5

    for item in plan:
        assert item["gujarati_hook"], "Hook cannot be empty"
        assert item["category_code"] in ["T01", "C01", "A01", "B01", "F01", "N01"]
        assert item["target_area"], "Target area cannot be empty"
        assert 20 <= item["ideal_length_sec"] <= 45
        assert item["idea_title"]
        assert item["why_it_works"]

    print(f"  ✓ Audit Report Validated: 5 content recommendations, {len(report['critical_mistakes_detected'])} mistakes, {len(report['immediate_action_fixes'])} action fixes")


def test_gemini_api_mock_execution():
    """Test Gemini 2.5 API invocation with mock genai client."""
    print("\n[Test 3] Testing Gemini API structured output parsing via mock...")

    mock_report = GrowthAuditReport(
        audience_summary="Audience is 72% Surat based with strong 25-34 concentration.",
        critical_mistakes_detected=[
            "Weak opening hook in first 2 seconds",
            "Missing save bookmarks on civic updates",
            "Slow pacing in voice narration"
        ],
        top_winning_patterns=[
            "Area badges in headline line 1 drive 40% higher engagement",
            "Traffic alerts have 5.2% share velocity on WhatsApp"
        ],
        content_recommendation_plan=[
            ContentRecommendationItem(
                idea_title="Adajan Bridge Update",
                gujarati_hook="અડાજણ બ્રિજ પર નવો નિયમ! 🚨",
                category_code="T01",
                target_area="Adajan",
                ideal_length_sec=28,
                why_it_works="High utility for commuters."
            ),
            ContentRecommendationItem(
                idea_title="Vesu VIP Road News",
                gujarati_hook="વેસુ રોડ પર શું થયું? જુઓ આ વીડિયો 🚗",
                category_code="T01",
                target_area="Vesu",
                ideal_length_sec=25,
                why_it_works="Neighborhood relevance."
            ),
            ContentRecommendationItem(
                idea_title="Solar Subsidy Portal",
                gujarati_hook="સૂર્ય ઘર યોજના સબસિડી વિગતો ☀️",
                category_code="A01",
                target_area="Katargam",
                ideal_length_sec=30,
                why_it_works="High save rate."
            ),
            ContentRecommendationItem(
                idea_title="Diamond City Jobs",
                gujarati_hook="ખજોદ ખાતે નવી નોકરીઓની જાહેરાત 💎",
                category_code="B01",
                target_area="Khajod",
                ideal_length_sec=32,
                why_it_works="Youth employment focus."
            ),
            ContentRecommendationItem(
                idea_title="Dumas Food Fest",
                gujarati_hook="ડુમસ બીચ પર સુરતી ખમણ ઉત્સવ 🍲",
                category_code="F01",
                target_area="Dumas",
                ideal_length_sec=24,
                why_it_works="Weekend lifestyle."
            ),
        ],
        immediate_action_fixes=[
            "Add dual-stripe headline at 0.0s",
            "Add audio tags [excited] and [serious]",
            "Post at 8:00 PM for maximum reach"
        ]
    )

    with patch.object(GeminiGrowthAdvisor, "_call_gemini_audit", return_value=mock_report):
        advisor = GeminiGrowthAdvisor(api_key="valid_test_key_123")
        res = advisor.analyze_account_performance(api_key="valid_test_key_123")
        assert res["audience_summary"] == mock_report.audience_summary
        assert len(res["content_recommendation_plan"]) == 5
        assert res["content_recommendation_plan"][0]["gujarati_hook"] == "અડાજણ બ્રિજ પર નવો નિયમ! 🚨"

    print("  ✓ Gemini API mock test passed successfully")


if __name__ == "__main__":
    print("================================================================")
    print("        GEMINI GROWTH ADVISOR - UNIT TEST SUITE                 ")
    print("================================================================")
    test_advisor_initialization()
    test_growth_audit_schema_and_fallback()
    test_gemini_api_mock_execution()
    print("\n[ALL TESTS PASSED] GeminiGrowthAdvisor is 100% verified!\n")

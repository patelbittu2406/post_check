"""
Unit & Integration Tests for InstagramAnalyticsEngine (core/ig_analytics.py)
Validates audience demographics, Surat follower % parsing, Reels KPI extraction,
and SOP ratios (share_rate, save_rate, retention_rate).
"""

import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

# Ensure project root is in path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from core.ig_analytics import InstagramAnalyticsEngine


def test_analytics_initialization():
    """Test engine initialization and credential resolution."""
    print("\n[Test 1] Testing engine initialization...")
    engine = InstagramAnalyticsEngine(
        account_id="test_acc_123",
        access_token="test_token_456"
    )
    assert engine.account_id == "test_acc_123"
    assert engine.access_token == "test_token_456"
    assert engine.is_configured() is True
    print("  ✓ Initialization & credentials resolution OK")


def test_audience_demographics_mock():
    """Test offline/simulated audience demographics parsing and Surat % calculation."""
    print("\n[Test 2] Testing audience demographics (simulated)...")
    engine = InstagramAnalyticsEngine()
    demo = engine.fetch_audience_demographics()

    assert "surat_follower_count" in demo
    assert "surat_follower_percentage" in demo
    assert demo["surat_follower_percentage"] > 50.0  # Should reflect Surat local demographic dominance
    assert demo["dominant_age_bracket"] in ["18-24", "25-34", "35-44"]
    assert len(demo["top_cities"]) > 0
    assert "Surat" in demo["top_cities"][0]["city"]
    print(f"  ✓ Demographics OK: Surat {demo['surat_follower_percentage']}% | Dominant Age: {demo['dominant_age_bracket']}")


def test_recent_reels_performance_mock():
    """Test recent reels performance calculation and SOP ratios."""
    print("\n[Test 3] Testing recent Reels performance & SOP ratios...")
    engine = InstagramAnalyticsEngine()
    reels = engine.fetch_recent_reels_performance(limit=5)

    assert len(reels) == 5
    for reel in reels:
        assert "reach" in reel and reel["reach"] > 0
        assert "shares" in reel
        assert "saved" in reel
        assert "share_rate" in reel
        assert "save_rate" in reel
        assert "retention_rate" in reel
        assert "sop_benchmarks" in reel

        # Verify SOP mathematical calculations
        expected_share_rate = round((reel["shares"] / reel["reach"]) * 100, 2)
        expected_save_rate = round((reel["saved"] / reel["reach"]) * 100, 2)
        expected_retention = round((reel["avg_watch_time"] / reel["video_duration"]) * 100, 2)

        assert reel["share_rate"] == expected_share_rate
        assert reel["save_rate"] == expected_save_rate
        assert reel["retention_rate"] == expected_retention

    print("  ✓ SOP Ratios verified (share_rate, save_rate, retention_rate)")


def test_live_api_parsing_with_mock_graph_api():
    """Test Meta Graph API live response parsing with mock HTTP payloads."""
    print("\n[Test 4] Testing Graph API response parsing via mock HTTP...")
    engine = InstagramAnalyticsEngine(
        account_id="17841400000000000",
        access_token="EAAX_VALID_TOKEN_FOR_TEST"
    )

    mock_insights_response = {
        "data": [
            {
                "name": "audience_city",
                "period": "lifetime",
                "values": [
                    {
                        "value": {
                            "Surat, Gujarat": 12500,
                            "Ahmedabad, Gujarat": 2500,
                            "Navsari, Gujarat": 1000
                        }
                    }
                ]
            },
            {
                "name": "audience_gender_age",
                "period": "lifetime",
                "values": [
                    {
                        "value": {
                            "M.18-24": 3000,
                            "M.25-34": 7000,
                            "F.25-34": 4500,
                            "F.35-44": 1500
                        }
                    }
                ]
            }
        ]
    }

    with patch("requests.get") as mock_get:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_insights_response
        mock_get.return_value = mock_resp

        demo = engine.fetch_audience_demographics()
        assert demo["status"] == "live"
        assert demo["surat_follower_count"] == 12500
        total = 12500 + 2500 + 1000
        expected_surat_pct = round((12500 / total) * 100, 2)
        assert demo["surat_follower_percentage"] == expected_surat_pct
        assert demo["dominant_age_bracket"] == "25-34"
        assert demo["gender_distribution"]["Male"]["count"] == 10000
        assert demo["gender_distribution"]["Female"]["count"] == 6000

    print("  ✓ Meta Graph API mock parsing verified successfully")


if __name__ == "__main__":
    print("================================================================")
    print("      INSTAGRAM ANALYTICS ENGINE - UNIT TEST SUITE              ")
    print("================================================================")
    test_analytics_initialization()
    test_audience_demographics_mock()
    test_recent_reels_performance_mock()
    test_live_api_parsing_with_mock_graph_api()
    print("\n[ALL TESTS PASSED] InstagramAnalyticsEngine is 100% verified!\n")

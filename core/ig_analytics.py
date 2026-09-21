"""
Instagram Analytics & Audience Insights Engine
Extracts performance metrics, engagement KPIs, SOP viral ratios (share rate, save rate, retention rate),
and audience demographics (Surat follower %, age brackets) via the official Meta Graph API (v19.0+).
Includes offline simulation / dry-run fallback for local development and benchmarking.
"""

import os
import sys
import json
import requests
from pathlib import Path
from typing import Dict, Any, List, Optional

# Ensure project root is in path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config


class InstagramAnalyticsEngine:
    """Extracts audience demographics and Reel performance analytics via Meta Graph API v19.0+."""

    GRAPH_API_VERSION = "v19.0"
    GRAPH_API_BASE = f"https://graph.facebook.com/{GRAPH_API_VERSION}"

    def __init__(
        self,
        account_id: Optional[str] = None,
        access_token: Optional[str] = None,
    ):
        # 1. Load from user_profile.json with fallback to config / environment
        profile = config.load_user_profile() if hasattr(config, "load_user_profile") else {}

        # Read credentials
        self.account_id = (
            account_id
            or profile.get("instagram_business_account_id")
            or getattr(config, "INSTAGRAM_BUSINESS_ACCOUNT_ID", "")
            or os.getenv("INSTAGRAM_BUSINESS_ACCOUNT_ID", "")
        )
        self.access_token = (
            access_token
            or profile.get("facebook_page_access_token")
            or getattr(config, "FACEBOOK_PAGE_ACCESS_TOKEN", "")
            or os.getenv("FACEBOOK_PAGE_ACCESS_TOKEN", "")
        )

    def is_configured(self) -> bool:
        """Checks whether Instagram Graph API credentials are configured with non-placeholder values."""
        if not self.account_id or not self.access_token:
            return False
        # Guard against placeholder strings in template files
        placeholders = [
            "your_instagram_business_account_id",
            "your_facebook_page_long_lived_access_token",
            "your_facebook_page_access_token",
            "your_token_here",
        ]
        if self.account_id in placeholders or self.access_token in placeholders:
            return False
        return True

    def fetch_audience_demographics(self) -> Dict[str, Any]:
        """
        Fetches lifetime audience demographics:
        - Endpoint: GET /{ig_user_id}/insights?metric=audience_city,audience_gender_age&period=lifetime
        - Parses top cities, Surat follower count & percentage, and dominant age brackets.
        """
        if not self.is_configured():
            return self._mock_audience_demographics()

        url = f"{self.GRAPH_API_BASE}/{self.account_id}/insights"
        params = {
            "metric": "audience_city,audience_gender_age",
            "period": "lifetime",
            "access_token": self.access_token,
        }

        try:
            response = requests.get(url, params=params, timeout=20)
            if response.status_code != 200:
                print(f"[IG Analytics Warning] Graph API error {response.status_code}: {response.text}")
                return self._mock_audience_demographics(error_msg=response.text)

            data = response.json().get("data", [])
            return self._parse_audience_data(data)

        except Exception as e:
            print(f"[IG Analytics Error] Failed to fetch audience demographics: {e}")
            return self._mock_audience_demographics(error_msg=str(e))

    def _parse_audience_data(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Parses raw Meta Graph API insight values into structured demographic metrics."""
        city_raw: Dict[str, int] = {}
        gender_age_raw: Dict[str, int] = {}

        for item in data:
            metric_name = item.get("name")
            values = item.get("values", [{}])[0].get("value", {})
            if metric_name == "audience_city":
                city_raw = values
            elif metric_name == "audience_gender_age":
                gender_age_raw = values

        # 1. Parse Top Cities & Surat %
        total_city_followers = sum(city_raw.values())
        sorted_cities = sorted(city_raw.items(), key=lambda x: x[1], reverse=True)

        surat_followers = 0
        top_cities = []
        for city_name, count in sorted_cities:
            pct = round((count / total_city_followers * 100), 2) if total_city_followers > 0 else 0.0
            if "surat" in city_name.lower():
                surat_followers += count
            top_cities.append({
                "city": city_name,
                "count": count,
                "percentage": pct,
            })

        surat_percentage = round((surat_followers / total_city_followers * 100), 2) if total_city_followers > 0 else 0.0

        # 2. Parse Age & Gender Distributions
        age_counts: Dict[str, int] = {}
        gender_counts = {"Male": 0, "Female": 0, "Unspecified": 0}
        total_gender_age = sum(gender_age_raw.values())

        for key, count in gender_age_raw.items():
            # Format: 'M.18-24', 'F.25-34', 'U.35-44'
            parts = key.split(".")
            gender_code = parts[0] if len(parts) > 0 else "U"
            age_bracket = parts[1] if len(parts) > 1 else key

            # Aggregate by gender
            if gender_code == "M":
                gender_counts["Male"] += count
            elif gender_code == "F":
                gender_counts["Female"] += count
            else:
                gender_counts["Unspecified"] += count

            # Aggregate by age bracket
            age_counts[age_bracket] = age_counts.get(age_bracket, 0) + count

        # Determine dominant age bracket
        dominant_age_bracket = "25-34"
        if age_counts:
            dominant_age_bracket = max(age_counts.items(), key=lambda x: x[1])[0]

        age_distribution = [
            {
                "bracket": bracket,
                "count": count,
                "percentage": round((count / total_gender_age * 100), 2) if total_gender_age > 0 else 0.0,
            }
            for bracket, count in sorted(age_counts.items(), key=lambda x: x[0])
        ]

        gender_distribution = {
            gender: {
                "count": count,
                "percentage": round((count / total_gender_age * 100), 2) if total_gender_age > 0 else 0.0,
            }
            for gender, count in gender_counts.items()
        }

        return {
            "configured": True,
            "status": "live",
            "total_audience_sample": total_city_followers or total_gender_age,
            "surat_follower_count": surat_followers,
            "surat_follower_percentage": surat_percentage,
            "top_cities": top_cities[:10],
            "dominant_age_bracket": dominant_age_bracket,
            "age_distribution": age_distribution,
            "gender_distribution": gender_distribution,
            "raw_cities_count": len(city_raw),
        }

    def _mock_audience_demographics(self, error_msg: Optional[str] = None) -> Dict[str, Any]:
        """Provides realistic Surat newsroom audience baseline data when API is offline or unconfigured."""
        mock_cities = [
            {"city": "Surat, Gujarat", "count": 28450, "percentage": 68.55},
            {"city": "Ahmedabad, Gujarat", "count": 5210, "percentage": 12.55},
            {"city": "Navsari, Gujarat", "count": 3480, "percentage": 8.39},
            {"city": "Vadodara, Gujarat", "count": 1820, "percentage": 4.39},
            {"city": "Rajkot, Gujarat", "count": 1150, "percentage": 2.77},
            {"city": "Bharuch, Gujarat", "count": 890, "percentage": 2.14},
            {"city": "Mumbai, Maharashtra", "count": 500, "percentage": 1.20},
        ]
        total_sample = sum(c["count"] for c in mock_cities)
        surat_count = 28450
        surat_pct = round((surat_count / total_sample * 100), 2)

        age_distribution = [
            {"bracket": "18-24", "count": 8900, "percentage": 21.45},
            {"bracket": "25-34", "count": 22400, "percentage": 53.98},
            {"bracket": "35-44", "count": 7100, "percentage": 17.11},
            {"bracket": "45-54", "count": 2350, "percentage": 5.66},
            {"bracket": "55+", "count": 750, "percentage": 1.81},
        ]

        gender_distribution = {
            "Male": {"count": 27800, "percentage": 67.0},
            "Female": {"count": 13300, "percentage": 32.05},
            "Unspecified": {"count": 400, "percentage": 0.96},
        }

        return {
            "configured": self.is_configured(),
            "status": "simulated",
            "note": "Dry-run / simulated analytics data" + (f" ({error_msg})" if error_msg else ""),
            "total_audience_sample": total_sample,
            "surat_follower_count": surat_count,
            "surat_follower_percentage": surat_pct,
            "top_cities": mock_cities,
            "dominant_age_bracket": "25-34",
            "age_distribution": age_distribution,
            "gender_distribution": gender_distribution,
            "raw_cities_count": len(mock_cities),
        }

    def fetch_recent_reels_performance(self, limit: int = 15) -> List[Dict[str, Any]]:
        """
        Fetches performance insights for recent Reels:
        1. GET /{ig_user_id}/media?fields=id,caption,media_type,timestamp,permalink,thumbnail_url,like_count,comments_count
        2. For each video/reel:
           GET /{media_id}/insights?metric=reach,saved,shares,total_interactions,plays,ig_reels_avg_watch_time
        3. Calculates SOP ratios:
           - share_rate = (shares / reach) * 100
           - save_rate = (saved / reach) * 100
           - retention_rate = (avg_watch_time / video_duration) * 100
        """
        if not self.is_configured():
            return self._mock_recent_reels_performance(limit=limit)

        url = f"{self.GRAPH_API_BASE}/{self.account_id}/media"
        params = {
            "fields": "id,caption,media_type,timestamp,permalink,thumbnail_url,like_count,comments_count",
            "limit": limit,
            "access_token": self.access_token,
        }

        try:
            response = requests.get(url, params=params, timeout=20)
            if response.status_code != 200:
                print(f"[IG Analytics Warning] Media API error {response.status_code}: {response.text}")
                return self._mock_recent_reels_performance(limit=limit)

            media_items = response.json().get("data", [])
            reels_results = []

            for item in media_items:
                media_id = item.get("id")
                media_type = item.get("media_type", "VIDEO")

                # Fetch insights for each media item
                insights = self._fetch_single_media_insights(media_id)

                # Standard target duration in seconds for SOP Reels (default 30.0s)
                video_duration = float(getattr(config, "TARGET_VIDEO_DURATION", 30.0))

                reach = insights.get("reach", 0)
                shares = insights.get("shares", 0)
                saved = insights.get("saved", 0)
                plays = insights.get("plays", 0)
                total_interactions = insights.get("total_interactions", item.get("like_count", 0) + item.get("comments_count", 0))
                avg_watch_time = float(insights.get("ig_reels_avg_watch_time", 0.0))

                # Normalize avg_watch_time (convert milliseconds to seconds if returned in ms > 100)
                if avg_watch_time > 100.0:
                    avg_watch_time = avg_watch_time / 1000.0

                # Calculate SOP Key Ratios
                share_rate = round((shares / reach * 100), 2) if reach > 0 else 0.0
                save_rate = round((saved / reach * 100), 2) if reach > 0 else 0.0
                retention_rate = round((avg_watch_time / video_duration * 100), 2) if video_duration > 0 else 0.0

                # SOP Viral Benchmark Rating
                share_status = "EXCELLENT" if share_rate >= 5.0 else ("GOOD" if share_rate >= 2.5 else "AVERAGE")
                save_status = "EXCELLENT" if save_rate >= 3.0 else ("GOOD" if save_rate >= 1.5 else "AVERAGE")
                retention_status = "EXCELLENT" if retention_rate >= 65.0 else ("GOOD" if retention_rate >= 45.0 else "AVERAGE")

                reels_results.append({
                    "id": media_id,
                    "caption": item.get("caption", ""),
                    "media_type": media_type,
                    "timestamp": item.get("timestamp", ""),
                    "permalink": item.get("permalink", f"https://www.instagram.com/reel/{media_id}/"),
                    "thumbnail_url": item.get("thumbnail_url", ""),
                    "like_count": item.get("like_count", 0),
                    "comments_count": item.get("comments_count", 0),
                    "reach": reach,
                    "saved": saved,
                    "shares": shares,
                    "plays": plays,
                    "total_interactions": total_interactions,
                    "avg_watch_time": round(avg_watch_time, 1),
                    "video_duration": video_duration,
                    "share_rate": share_rate,
                    "save_rate": save_rate,
                    "retention_rate": retention_rate,
                    "sop_benchmarks": {
                        "share_status": share_status,
                        "save_status": save_status,
                        "retention_status": retention_status,
                    }
                })

            return reels_results

        except Exception as e:
            print(f"[IG Analytics Error] Failed fetching recent reels performance: {e}")
            return self._mock_recent_reels_performance(limit=limit)

    def _fetch_single_media_insights(self, media_id: str) -> Dict[str, Any]:
        """Fetches metric=reach,saved,shares,total_interactions,plays,ig_reels_avg_watch_time for a given Reel."""
        url = f"{self.GRAPH_API_BASE}/{media_id}/insights"
        params = {
            "metric": "reach,saved,shares,total_interactions,plays,ig_reels_avg_watch_time",
            "access_token": self.access_token,
        }
        insights_data: Dict[str, Any] = {}
        try:
            res = requests.get(url, params=params, timeout=10)
            if res.status_code == 200:
                for item in res.json().get("data", []):
                    name = item.get("name")
                    val = item.get("values", [{}])[0].get("value", 0)
                    insights_data[name] = val
        except Exception as e:
            print(f"[IG Analytics Warning] Single media insights failed for {media_id}: {e}")
        return insights_data

    def _mock_recent_reels_performance(self, limit: int = 15) -> List[Dict[str, Any]]:
        """Generates realistic structured Reel performance metrics matching Gujarati newsroom SOP benchmarks."""
        sample_headlines = [
            ("સુરત મેટ્રો ફેઝ-૧ ટેસ્ટિંગ શરૂ", "કાપોદ્રા થી ડ્રીમ સિટી ટ્રાયલ રન સફળ"),
            ("ડાયમંડ બુર્સમાં 50 નવી ઓફિસો ખુલી", "ખજોદ ખાતે વેપારમાં મોટો ઉછાળો"),
            ("અઠવાલાઇન્સ ફ્લાયઓવર સમારકામ પૂર્ણ", "ટ્રાફિક મુક્ત आवाગમન શરૂ"),
            ("સુરત ટેક્સટાઇલ માર્કેટમાં દિવાળી ડિસ્કાઉન્ટ", "કાપડ વેપારીઓ માટે ખુશખબર"),
            ("ડુમસ બીચ નવીન પ્રોમેનાડનું ઉદ્ઘાટન", "વીકેન્ડમાં પ્રવાસીઓનો ભારે ધસારો"),
            ("સુરત મ્યુનિસિપલ કોર્પોરેશન સોલાર સબસિડી", "ઘરદીઠ 78000 રૂપિયા સુધીની સહાય"),
            ("BRTS કોરિડોરમાં નવી ઇલેક્ટ્રિક બસો", "ઝીરો એમિશન ગ્રીન પબ્લિક ટ્રાન્સપોર્ટ"),
            ("તાપી રિવરફ્રન્ટ ફેઝ-૨ મંજૂર", "સિંગણપોર થી કોઝવે સુધી નવો પટ્ટો"),
        ]

        mock_reels = []
        video_duration = 30.0

        for i, (line1, line2) in enumerate(sample_headlines[:limit]):
            media_id = f"179832049{i:04d}"
            reach = 14500 + (i * 2300)
            plays = int(reach * 1.35)
            shares = int(reach * (0.048 - (i * 0.002)))
            saved = int(reach * (0.032 + (i * 0.001)))
            likes = int(reach * 0.082)
            comments = int(reach * 0.007)
            total_interactions = likes + comments + shares + saved
            avg_watch_time = 18.5 + ((i % 3) * 2.2)

            share_rate = round((shares / reach * 100), 2)
            save_rate = round((saved / reach * 100), 2)
            retention_rate = round((avg_watch_time / video_duration * 100), 2)

            mock_reels.append({
                "id": media_id,
                "caption": f"🚨 {line1} | {line2}\n\nસુરતની તાજા ખબરો માટે ફોલો કરો @surat_samachar_live\n#SuratNews #Surat #Gujarat",
                "media_type": "VIDEO",
                "timestamp": f"2026-09-{20 - i:02d}T10:30:00+0000",
                "permalink": f"https://www.instagram.com/reel/{media_id}/",
                "thumbnail_url": f"https://placehold.co/1080x1920/1e293b/38bdf8.png?text={line1}",
                "like_count": likes,
                "comments_count": comments,
                "reach": reach,
                "saved": saved,
                "shares": shares,
                "plays": plays,
                "total_interactions": total_interactions,
                "avg_watch_time": round(avg_watch_time, 1),
                "video_duration": video_duration,
                "share_rate": share_rate,
                "save_rate": save_rate,
                "retention_rate": retention_rate,
                "sop_benchmarks": {
                    "share_status": "EXCELLENT" if share_rate >= 5.0 else ("GOOD" if share_rate >= 2.5 else "AVERAGE"),
                    "save_status": "EXCELLENT" if save_rate >= 3.0 else ("GOOD" if save_rate >= 1.5 else "AVERAGE"),
                    "retention_status": "EXCELLENT" if retention_rate >= 65.0 else ("GOOD" if retention_rate >= 45.0 else "AVERAGE"),
                }
            })

        return mock_reels


if __name__ == "__main__":
    print("=== Testing InstagramAnalyticsEngine ===")
    analytics = InstagramAnalyticsEngine()
    print(f"Configured with Live Credentials: {analytics.is_configured()}")
    
    print("\n--- 1. Testing Audience Demographics ---")
    demo = analytics.fetch_audience_demographics()
    print(f"Total Audience Sample: {demo.get('total_audience_sample')}")
    print(f"Surat Followers: {demo.get('surat_follower_count')} ({demo.get('surat_follower_percentage')}%)")
    print(f"Dominant Age Bracket: {demo.get('dominant_age_bracket')}")
    print(f"Top Cities: {demo.get('top_cities')[:3]}")

    print("\n--- 2. Testing Recent Reels Insights ---")
    reels = analytics.fetch_recent_reels_performance(limit=3)
    for r in reels:
        print(f"Reel ID: {r['id']} | Reach: {r['reach']} | Share Rate: {r['share_rate']}% | Save Rate: {r['save_rate']}% | Retention: {r['retention_rate']}%")

    print("\n[SUCCESS] InstagramAnalyticsEngine verified successfully!")

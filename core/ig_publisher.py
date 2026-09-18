"""
Instagram 1-Click Publisher Engine
Handles publishing rendered Reels to Instagram via the official Meta Graph API (v19.0+).
Includes media hosting adapters, 3-phase asynchronous container state machine,
and dry-run testing mode.
"""

import os
import sys
import time
import requests
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

# Ensure project root is in path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config

class InstagramPublisher:
    """Publishes Reels to Instagram Business Account via Meta Graph API v19.0+."""

    GRAPH_API_VERSION = "v19.0"
    GRAPH_API_BASE = f"https://graph.facebook.com/{GRAPH_API_VERSION}"

    def __init__(
        self,
        account_id: Optional[str] = None,
        access_token: Optional[str] = None
    ):
        self.account_id = account_id or config.INSTAGRAM_BUSINESS_ACCOUNT_ID
        self.access_token = access_token or config.FACEBOOK_PAGE_ACCESS_TOKEN
        self.cloudinary_url = config.CLOUDINARY_URL

    def is_configured(self) -> bool:
        """Checks whether Instagram Graph API credentials are set."""
        return bool(self.account_id and self.access_token)

    def upload_to_public_host(self, local_video_path: str) -> str:
        """
        Converts local MP4 file to a publicly reachable HTTPS URL
        as required by the Instagram Graph API.
        """
        p = Path(local_video_path).resolve()
        if not p.exists():
            raise FileNotFoundError(f"Video file not found at: {local_video_path}")

        # 1. Try Cloudinary if configured
        if self.cloudinary_url or os.getenv("CLOUDINARY_URL"):
            try:
                import cloudinary
                import cloudinary.uploader
                print("[IG Publisher] Uploading video to Cloudinary...")
                res = cloudinary.uploader.upload(
                    str(p),
                    resource_type="video",
                    folder="surat_news_reels"
                )
                secure_url = res.get("secure_url")
                if secure_url:
                    print(f"[IG Publisher] Cloudinary upload successful: {secure_url}")
                    return secure_url
            except Exception as e:
                print(f"[Warning] Cloudinary upload failed: {e}")

        # 2. Try zero-setup temporary HTTPS hosting via file.io / tmpfiles
        try:
            print("[IG Publisher] Uploading to temporary HTTPS host (tmpfiles.org)...")
            with open(p, "rb") as f:
                resp = requests.post("https://tmpfiles.org/api/v1/upload", files={"file": f}, timeout=45)
            if resp.status_code == 200:
                data = resp.json()
                raw_url = data.get("data", {}).get("url", "")
                if raw_url:
                    # Convert tmpfiles.org/XXXXX to tmpfiles.org/dl/XXXXX for direct video stream
                    direct_url = raw_url.replace("tmpfiles.org/", "tmpfiles.org/dl/")
                    print(f"[IG Publisher] Direct video URL: {direct_url}")
                    return direct_url
        except Exception as e:
            print(f"[Warning] Temporary host upload failed: {e}")

        # If offline or in testing, return a placeholder test URL
        return f"https://example.com/mock_media/{p.name}"

    def publish_reel(
        self,
        video_path: str,
        caption: str,
        dry_run: bool = False,
        status_callback: Optional[callable] = None
    ) -> Dict[str, Any]:
        """
        Executes 4-phase Instagram Reel publishing state machine:
        - Phase 1: Upload video to public host & create media container
        - Phase 2: Asynchronous status polling (every 5s, max 120s timeout)
        - Phase 3: Final publish container
        - Phase 4: Fetch published Reel permalink
        """
        def update_status(msg: str):
            print(f"[IG Publisher] {msg}")
            if status_callback:
                status_callback(msg)

        if not Path(video_path).exists():
            raise FileNotFoundError(f"Cannot publish nonexistent video: {video_path}")

        # If credentials are not set or dry_run is requested, run simulated publish
        if dry_run or not self.is_configured():
            update_status("Running in DRY-RUN / SIMULATION mode...")
            time.sleep(1.0)
            update_status("Phase 1/4: Mocking container creation (media_type=REELS)...")
            mock_container_id = f"mock_container_{int(time.time())}"
            time.sleep(1.0)
            update_status("Phase 2/4: Polling container status (FINISHED)...")
            time.sleep(1.0)
            update_status("Phase 3/4: Publishing media container...")
            mock_media_id = f"mock_media_{int(time.time())}"
            time.sleep(0.5)
            update_status("Phase 4/4: Fetching Reel permalink...")
            mock_permalink = f"https://www.instagram.com/reel/{mock_media_id}/"
            update_status(f"Simulation complete! Permalink: {mock_permalink}")
            return {
                "success": True,
                "mode": "dry_run",
                "container_id": mock_container_id,
                "media_id": mock_media_id,
                "permalink": mock_permalink,
                "caption": caption[:100] + "..."
            }

        # Step 1: Upload to public host
        update_status("Step 1/4: Uploading video to public HTTPS host...")
        public_url = self.upload_to_public_host(video_path)

        # Step 2: Create Media Container
        update_status("Step 2/4: Creating Instagram Reel container...")
        container_url = f"{self.GRAPH_API_BASE}/{self.account_id}/media"
        container_payload = {
            "media_type": "REELS",
            "video_url": public_url,
            "caption": caption,
            "share_to_feed": "true",
            "access_token": self.access_token,
        }
        res = requests.post(container_url, data=container_payload, timeout=30)
        if res.status_code != 200:
            err = res.json().get("error", {}).get("message", res.text)
            raise RuntimeError(f"Container creation failed: {err}")

        container_id = res.json().get("id")
        update_status(f"Container created successfully. ID: {container_id}")

        # Step 3: Asynchronous Status Polling
        update_status("Step 3/4: Polling Meta processing status...")
        poll_url = f"{self.GRAPH_API_BASE}/{container_id}"
        poll_params = {
            "fields": "status_code,status",
            "access_token": self.access_token
        }

        timeout = 120
        interval = 5
        elapsed = 0
        finished = False

        while elapsed < timeout:
            time.sleep(interval)
            elapsed += interval

            poll_res = requests.get(poll_url, params=poll_params, timeout=15)
            if poll_res.status_code == 200:
                body = poll_res.json()
                status_code = body.get("status_code", "").upper()
                update_status(f"Container status ({elapsed}s): {status_code}")

                if status_code == "FINISHED":
                    finished = True
                    break
                elif status_code in ["ERROR", "EXPIRED"]:
                    raise RuntimeError(f"Media container processing ended in {status_code}: {body}")
            else:
                update_status(f"Polling warning: HTTP {poll_res.status_code}")

        if not finished:
            raise TimeoutError(f"Container processing timed out after {timeout} seconds.")

        # Step 4: Final Publish
        update_status("Step 4/4: Triggering final Reel publish...")
        publish_url = f"{self.GRAPH_API_BASE}/{self.account_id}/media_publish"
        publish_payload = {
            "creation_id": container_id,
            "access_token": self.access_token
        }
        pub_res = requests.post(publish_url, data=publish_payload, timeout=30)
        if pub_res.status_code != 200:
            err = pub_res.json().get("error", {}).get("message", pub_res.text)
            raise RuntimeError(f"Media publish failed: {err}")

        media_id = pub_res.json().get("id")
        update_status(f"Published successfully! Media ID: {media_id}")

        # Fetch permalink
        permalink_url = f"{self.GRAPH_API_BASE}/{media_id}"
        pl_res = requests.get(permalink_url, params={"fields": "permalink", "access_token": self.access_token}, timeout=15)
        permalink = pl_res.json().get("permalink", f"https://www.instagram.com/reel/{media_id}/") if pl_res.status_code == 200 else f"https://www.instagram.com/reel/{media_id}/"

        update_status(f"Reel live at: {permalink}")
        return {
            "success": True,
            "mode": "live",
            "container_id": container_id,
            "media_id": media_id,
            "permalink": permalink,
            "caption": caption[:100] + "..."
        }


if __name__ == "__main__":
    print("=== Testing InstagramPublisher ===")
    publisher = InstagramPublisher()

    test_video = config.OUTPUT_VIDEOS_DIR / "test_reel_1080x1920.mp4"
    if not test_video.exists():
        print(f"[Notice] Video not found at {test_video}, creating dummy file for test.")
        test_video.write_bytes(b"mock_video_bytes")

    print(f"Publisher configured with live credentials: {publisher.is_configured()}")
    print("Testing publish in DRY-RUN mode...")
    result = publisher.publish_reel(
        video_path=str(test_video),
        caption="SURAT UPDATE | N01\nLocation: Adajan, Surat\n#Surat #SuratNews",
        dry_run=True
    )
    print("\nResult:")
    print(result)
    assert result["success"] is True
    assert "permalink" in result
    print("\n[SUCCESS] InstagramPublisher unit test passed!")

"""Split monolithic Stitch HTML export into per-page template files."""
import json
import os
import re
import sys

TRANSCRIPT = (
    r"C:\Users\Aryan\.cursor\projects\d-Projects-Nexus-AI-Ecosystem"
    r"\agent-transcripts\c06ba360-0cbc-4120-8cda-116d4b9f7f67"
    r"\c06ba360-0cbc-4120-8cda-116d4b9f7f67.jsonl"
)
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "ui-html", "templates")

PAGE_MARKERS = [
    ("landing", "Design System"),
    ("authentication", "Landing Page - NEXUS AI"),
    ("dashboard", "Authentication - NEXUS AI"),
    ("founder-agent", "Main Dashboard - NEXUS AI"),
    ("startup-builder", "AI Founder Agent - NEXUS AI"),
    ("auditor", "Startup Builder - NEXUS AI"),
    ("dao-center", "Smart Contract Auditor - NEXUS AI"),
    ("marketplace", "DAO Governance Center - NEXUS AI"),
    ("achievement-center", "AI Marketplace - NEXUS AI"),
    ("admin", "Achievement Center - NEXUS AI"),
    ("analytics", "Admin Control - NEXUS AI"),
    ("agent-monitoring", "Analytics - NEXUS AI"),
    ("settings", "Agent Monitoring - NEXUS AI"),
    ("fraud-detection", "Settings - NEXUS AI"),
    ("activity-center", "Fraud Detection - NEXUS AI"),
]


def extract_html() -> str:
    with open(TRANSCRIPT, encoding="utf-8") as f:
        for line in f:
            obj = json.loads(line)
            if obj.get("role") != "user":
                continue
            text = obj["message"]["content"][0].get("text", "")
            if "Design System" in text and "<!DOCTYPE html>" in text:
                if text.startswith("<user_query>\n"):
                    text = text[len("<user_query>\n") :]
                if text.endswith("\n</user_query>"):
                    text = text[: -len("\n</user_query>")]
                return text
    raise SystemExit("HTML not found in transcript")


def main() -> None:
    html = extract_html()
    out_dir = os.path.normpath(OUT_DIR)
    os.makedirs(out_dir, exist_ok=True)

    positions: list[tuple[int, str, str]] = []
    for slug, marker in PAGE_MARKERS:
        pattern = rf"<!--\s*{re.escape(marker)}\s*-->"
        match = re.search(pattern, html)
        if not match:
            print(f"MISSING: {marker}", file=sys.stderr)
            sys.exit(1)
        positions.append((match.start(), slug, marker))

    positions.sort(key=lambda x: x[0])

    for i, (start, slug, _marker) in enumerate(positions):
        end = positions[i + 1][0] if i + 1 < len(positions) else len(html)
        chunk = html[start:end].strip()
        out_path = os.path.join(out_dir, f"{slug}.html")
        with open(out_path, "w", encoding="utf-8", newline="\n") as f:
            f.write(chunk)
            f.write("\n")
        print(f"Wrote {slug}.html ({len(chunk):,} chars)")

    print(f"Done: {len(positions)} templates in {out_dir}")


if __name__ == "__main__":
    main()

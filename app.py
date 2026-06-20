from flask import Flask, jsonify, render_template
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
import html

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

NAMESPACES = {
    "atom": "http://www.w3.org/2005/Atom",
}


def parse_feed(xml_content: str) -> list[dict]:
    root = ET.fromstring(xml_content)
    entries = []

    for entry in root.findall("atom:entry", NAMESPACES):
        title_el = entry.find("atom:title", NAMESPACES)
        summary_el = entry.find("atom:summary", NAMESPACES)
        updated_el = entry.find("atom:updated", NAMESPACES)
        link_el = entry.find("atom:link", NAMESPACES)
        id_el = entry.find("atom:id", NAMESPACES)

        title = title_el.text if title_el is not None else "Untitled"
        summary_raw = summary_el.text if summary_el is not None else ""
        updated_raw = updated_el.text if updated_el is not None else ""
        link = link_el.attrib.get("href", "#") if link_el is not None else "#"
        entry_id = id_el.text if id_el is not None else ""

        # Format date nicely
        try:
            dt = datetime.fromisoformat(updated_raw.replace("Z", "+00:00"))
            updated_display = dt.strftime("%B %d, %Y")
            updated_iso = dt.isoformat()
        except Exception:
            updated_display = updated_raw
            updated_iso = updated_raw

        # Unescape HTML entities in summary
        summary_clean = html.unescape(summary_raw) if summary_raw else ""

        entries.append(
            {
                "id": entry_id,
                "title": title,
                "summary": summary_clean,
                "updated": updated_display,
                "updated_iso": updated_iso,
                "link": link,
            }
        )

    return entries


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/release-notes")
def release_notes():
    try:
        req = urllib.request.Request(
            FEED_URL,
            headers={
                "User-Agent": "Mozilla/5.0 (BigQuery Release Notes Viewer)"
            },
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            xml_bytes = resp.read()
        xml_content = xml_bytes.decode("utf-8")
        entries = parse_feed(xml_content)
        return jsonify({"success": True, "entries": entries, "count": len(entries)})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)

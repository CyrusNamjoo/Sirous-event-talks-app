# BigQuery Release Notes Viewer

A premium dark-mode web application built with **Python Flask** and **Vanilla JS** that fetches live BigQuery release notes from the Google Cloud Atom feed and lets you tweet about any update directly from the browser.

---

## Features

- 📡 **Live feed** — Fetches the latest BigQuery release notes from Google Cloud in real time
- 🔄 **Refresh button** — On-demand refresh with an animated spinner
- 🃏 **Animated entry cards** — Staggered slide-in cards with hover effects and date badges
- 🐦 **Tweet any update** — Click "Tweet this" on any card to open a pre-filled Twitter/X compose window
- ✍️ **Tweet composer** — Editable tweet with live 280-character counter and auto-filled hashtags
- 🌑 **Premium dark UI** — Glassmorphism header, ambient glow blobs, CSS grid background

---

## Screenshot

> Open [http://127.0.0.1:5000](http://127.0.0.1:5000) after running the app.

---

## Tech Stack

| Layer      | Technology                                        |
|------------|---------------------------------------------------|
| Backend    | Python 3.10+ · Flask 3.x                          |
| HTTP/XML   | `urllib` · `xml.etree.ElementTree` (stdlib only)  |
| Frontend   | Vanilla HTML5 · CSS3 · JavaScript (ES2020)        |
| Fonts      | [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts |
| Tweeting   | [Twitter Web Intent](https://developer.twitter.com/en/docs/twitter-for-websites/tweet-button/guides/web-intent) — no API key required |

---

## Project Structure

```
Sirous-event-talks-app/
├── app.py                  # Flask app — feed proxy & XML parser
├── requirements.txt        # Python dependencies (Flask only)
├── .gitignore
├── templates/
│   └── index.html          # Single-page UI shell
└── static/
    ├── style.css           # All styles — dark theme, animations, modal
    └── app.js              # All client logic — fetch, render, tweet modal
```

---

## Getting Started

### Prerequisites

- Python 3.10 or higher
- pip

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/CyrusNamjoo/Sirous-event-talks-app.git
   cd Sirous-event-talks-app
   ```

2. **Create a virtual environment** *(recommended)*

   ```bash
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # macOS / Linux
   source .venv/bin/activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Run the app**

   ```bash
   python app.py
   ```

5. **Open your browser**

   ```
   http://127.0.0.1:5000
   ```

---

## How It Works

```
Browser  →  GET /api/release-notes  →  Flask  →  Google Cloud Atom XML Feed
                                         │
                                   Parse XML with
                                   ElementTree
                                         │
                                   Return clean JSON
                                         │
Browser  ←──────── JSON entries ─────────┘
         Renders animated cards
```

The Flask backend acts as a **proxy** to avoid CORS restrictions when fetching Google's XML feed from the browser. All HTTP and XML parsing uses Python's standard library — no extra dependencies needed beyond Flask.

---

## Usage

| Action | How |
|---|---|
| Refresh notes | Click the **Refresh** button in the header |
| View full note | Click **"View full note ↗"** on any card |
| Select a card | Click anywhere on the card body to highlight it |
| Tweet an update | Click **"Tweet this"** → edit the pre-filled text → click **"Post on X"** |
| Close tweet modal | Press `Escape` or click outside the modal |

---

## API Reference

### `GET /api/release-notes`

Fetches and parses the BigQuery Atom XML feed.

**Response (success)**
```json
{
  "success": true,
  "count": 42,
  "entries": [
    {
      "id": "...",
      "title": "BigQuery release notes — November 2024",
      "summary": "...",
      "updated": "November 01, 2024",
      "updated_iso": "2024-11-01T00:00:00+00:00",
      "link": "https://cloud.google.com/bigquery/docs/release-notes#november_01_2024"
    }
  ]
}
```

**Response (error)**
```json
{
  "success": false,
  "error": "Connection timed out"
}
```

---

## Future Enhancements

- [ ] Search / keyword filter bar
- [ ] Bookmark entries to `localStorage`
- [ ] Category badges (GA, Preview, Deprecated)
- [ ] Pagination or infinite scroll
- [ ] Copy-to-clipboard button per entry
- [ ] Dark / light mode toggle
- [ ] Desktop notifications for new entries

---

## License

This project is open source and available under the [MIT License](LICENSE).

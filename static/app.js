/* ──────────────────────────────────────────
   BigQuery Release Notes – app.js
──────────────────────────────────────────── */

(function () {
  "use strict";

  // ── DOM refs ──────────────────────────────
  const refreshBtn      = document.getElementById("refreshBtn");
  const refreshLabel    = document.getElementById("refreshLabel");
  const loadingState    = document.getElementById("loadingState");
  const errorState      = document.getElementById("errorState");
  const errorMessage    = document.getElementById("errorMessage");
  const feedContainer   = document.getElementById("feedContainer");
  const feedList        = document.getElementById("feedList");
  const feedMeta        = document.getElementById("feedMeta");
  const retryBtn        = document.getElementById("retryBtn");
  const entryCount      = document.getElementById("entryCount");

  const tweetModal      = document.getElementById("tweetModal");
  const modalClose      = document.getElementById("modalClose");
  const tweetText       = document.getElementById("tweetText");
  const charUsed        = document.getElementById("charUsed");
  const charCount       = document.getElementById("charCount");
  const sendTweetBtn    = document.getElementById("sendTweetBtn");
  const selectedPreview = document.getElementById("selectedNotePreview");

  // ── State ────────────────────────────────
  let currentEntries  = [];
  let selectedEntry   = null;
  let lastFetched     = null;

  // ── Helpers ──────────────────────────────
  function show(el)  { el.classList.remove("hidden"); }
  function hide(el)  { el.classList.add("hidden"); }

  function setLoading(isLoading) {
    refreshBtn.disabled = isLoading;
    refreshBtn.classList.toggle("loading", isLoading);
    refreshLabel.textContent = isLoading ? "Refreshing…" : "Refresh";
  }

  function truncate(str, max) {
    if (!str) return "";
    return str.length > max ? str.slice(0, max - 1) + "…" : str;
  }

  // Strip HTML tags from feed summary (it may contain markup)
  function stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  // Friendly relative time
  function relativeTime(isoStr) {
    try {
      const then = new Date(isoStr);
      const diffMs = Date.now() - then.getTime();
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7)  return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${diffDays >= 14 ? "s" : ""} ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${diffDays >= 60 ? "s" : ""} ago`;
      return `${Math.floor(diffDays / 365)} year${diffDays >= 730 ? "s" : ""} ago`;
    } catch {
      return "";
    }
  }

  // ── Render ───────────────────────────────
  function renderEntries(entries) {
    feedList.innerHTML = "";
    currentEntries = entries;

    if (entries.length === 0) {
      feedMeta.textContent = "No entries found.";
      return;
    }

    const now = new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
    feedMeta.textContent = `${entries.length} release note${entries.length > 1 ? "s" : ""} · Last refreshed at ${now}`;

    entryCount.textContent = `${entries.length} notes`;
    entryCount.classList.add("visible");

    entries.forEach((entry, idx) => {
      const cleanSummary = stripHtml(entry.summary);
      const li = document.createElement("li");
      li.setAttribute("role", "listitem");

      const card = document.createElement("article");
      card.className = "entry-card";
      card.setAttribute("aria-label", `Release note: ${entry.title}`);
      card.setAttribute("tabindex", "0");
      card.dataset.idx = idx;

      card.innerHTML = `
        <div class="entry-top">
          <span class="entry-date-badge">${entry.updated}</span>
          <h2 class="entry-title">${escapeHtml(entry.title)}</h2>
        </div>
        <p class="entry-summary">${escapeHtml(truncate(cleanSummary, 300))}</p>
        <div class="entry-actions">
          <a
            class="entry-link"
            href="${escapeAttr(entry.link)}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View full release note for ${escapeAttr(entry.title)}"
            id="entry-link-${idx}"
          >
            View full note <span class="entry-link-arrow" aria-hidden="true">↗</span>
          </a>
          <button
            class="btn-select-tweet"
            id="tweet-btn-${idx}"
            aria-label="Tweet about: ${escapeAttr(entry.title)}"
            data-idx="${idx}"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Tweet this
          </button>
        </div>
      `;

      // Click anywhere on card = select
      card.addEventListener("click", (e) => {
        // Don't intercept link or tweet-button clicks
        if (e.target.closest("a") || e.target.closest(".btn-select-tweet")) return;
        toggleSelect(card, entry, idx);
      });

      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleSelect(card, entry, idx);
        }
      });

      // Tweet button
      card.querySelector(".btn-select-tweet").addEventListener("click", (e) => {
        e.stopPropagation();
        openTweetModal(entry);
      });

      li.appendChild(card);
      feedList.appendChild(li);
    });
  }

  function toggleSelect(card, entry, idx) {
    const wasSelected = card.classList.contains("selected");
    // Deselect all
    document.querySelectorAll(".entry-card.selected").forEach(c => c.classList.remove("selected"));
    if (!wasSelected) {
      card.classList.add("selected");
      selectedEntry = entry;
    } else {
      selectedEntry = null;
    }
  }

  // ── Safe escaping ─────────────────────────
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // ── API fetch ─────────────────────────────
  async function fetchNotes() {
    setLoading(true);
    hide(errorState);
    hide(feedContainer);
    show(loadingState);

    try {
      const res = await fetch("/api/release-notes");
      const data = await res.json();

      if (!data.success) throw new Error(data.error || "Unknown error");

      lastFetched = new Date();
      hide(loadingState);
      show(feedContainer);
      renderEntries(data.entries);
    } catch (err) {
      hide(loadingState);
      show(errorState);
      errorMessage.textContent = err.message || "Failed to connect. Check your network.";
      console.error("[BigQuery RN]", err);
    } finally {
      setLoading(false);
    }
  }

  // ── Tweet Modal ───────────────────────────
  function openTweetModal(entry) {
    const cleanSummary = stripHtml(entry.summary);

    // Pre-fill selected note preview
    selectedPreview.innerHTML = `
      <strong>${escapeHtml(entry.title)}</strong>
      ${escapeHtml(truncate(cleanSummary, 160))}
    `;

    // Pre-populate tweet text
    const defaultTweet = buildDefaultTweet(entry, cleanSummary);
    tweetText.value = defaultTweet;
    updateCharCount();

    tweetText.focus();
    tweetModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeTweetModal() {
    tweetModal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  function buildDefaultTweet(entry, cleanSummary) {
    const link = entry.link || "https://cloud.google.com/bigquery/docs/release-notes";
    const maxTitleLen = 80;
    const title = truncate(entry.title, maxTitleLen);
    const hashtags = " #BigQuery #GoogleCloud";
    const suffix   = `\n\n${link}${hashtags}`;
    const budget   = 280 - suffix.length;
    const body     = truncate(cleanSummary, budget);
    return `${title}\n\n${body}${suffix}`;
  }

  function updateCharCount() {
    const len = tweetText.value.length;
    charUsed.textContent = len;
    charCount.classList.remove("warning", "danger");
    if (len > 260)      charCount.classList.add("danger");
    else if (len > 220) charCount.classList.add("warning");
  }

  function postTweet() {
    const text = tweetText.value.trim();
    if (!text) return;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
    closeTweetModal();
  }

  // ── Event listeners ───────────────────────
  refreshBtn.addEventListener("click", fetchNotes);
  retryBtn.addEventListener("click", fetchNotes);
  modalClose.addEventListener("click", closeTweetModal);
  sendTweetBtn.addEventListener("click", postTweet);

  tweetText.addEventListener("input", updateCharCount);

  // Close modal on backdrop click
  tweetModal.addEventListener("click", (e) => {
    if (e.target === tweetModal) closeTweetModal();
  });

  // Close modal on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !tweetModal.classList.contains("hidden")) {
      closeTweetModal();
    }
  });

  // ── Init ─────────────────────────────────
  fetchNotes();
})();

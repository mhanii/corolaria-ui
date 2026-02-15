# UI Integration: Citation Format (Source-ID)

This document is for **frontend engineers** integrating with the Legal copilot chat API. It describes the **citation format change** (source-ID robustness) and how to render citations in the UI.

---

## 1. What Changed (Backend)

The backend moved from **semantic citation keys** to **numeric source IDs** so the model can cite reliably and the UI gets consistent, parseable references.

| Before | After |
|--------|--------|
| Response text contained `[cite:art_14_ce_abc123]Artículo 14[/cite]` | Response text contains **`[1]`**, **`[2]`**, etc. |
| Model had to reproduce long keys; typos → lost citations | Model only outputs numbers; server maps `[n]` → full citation |
| Parsing relied on regex over `[cite:key]...[/cite]` | Parsing is simple: match `[1]`, `[2]`, … and map by **order of first appearance** |

**API response shape is unchanged:** `response` (string) and `citations` (array of citation objects) are still returned the same way. Only the **format of the citation markers inside `response`** changed.

---

## 2. Response Text Format (What You Receive)

- **Current format:** The assistant’s reply is plain text with **numeric markers**:
  - Single: `[1]`, `[2]`, `[3]`, …
  - Multiple: `[1, 2, 3]` (comma-separated; spaces optional). All listed sources are cited.
- **Legacy format (deprecated):** You may still see old responses or cached data with `[cite:cite_key]display text[/cite]`. The backend still **accepts** this for extraction, but **new responses** use `[1]`, `[2]` or `[1, 2, 3]`.

**Examples of `response` you might get:**

```text
El artículo 14 de la Constitución establece la igualdad ante la ley [1].
Según la Constitución [1] y el Código Civil [2], ...
Varias fuentes lo recogen [1, 2, 3].
```

There is **no** wrapping tag like `[/cite]`; the citation is just the segment `[n]`.

---

## 3. API Response Shape (Unchanged)

### Non-streaming: `POST /api/v1/chat`

- **`response`** (string): Full assistant message including citation markers `[1]`, `[2]`, …
- **`citations`** (array): List of citation objects **in the order they first appear** in the response.

So the first `[n]` in the text corresponds to the first citation in `citations`, the second `[n]` to the second citation (or the same citation if it’s repeated), etc. See §4 for mapping rules.

**Citation object** (each element of `citations`):

| Field | Type | Description |
|-------|------|-------------|
| `cite_key` | string | Internal key (e.g. `art_14_ce_abc123`). Use for stable identity; do not show as-is. |
| `display_text` | string | Short label for this source (e.g. "Artículo 14 - Constitución Española"). **Use this for tooltips / footnotes.** |
| `article_id` | string | ID for deep-linking: legislation → article node; jurisprudence → sentencia id. |
| `article_number` | string | Article/section number (e.g. "Artículo 14"). |
| `normativa_title` | string | Title of the law or case (e.g. "Constitución Española de 1978"). |
| `article_path` | string | Hierarchical path (e.g. "Título I, Capítulo Segundo"). |
| `score` | number | Retrieval similarity score (optional for UI). |

**Note:** For jurisprudence, `article_id` is the **sentencia** id; for legislation it is the article node id. Use this to build “View article” vs “View sentencia” links (e.g. `/article/{article_id}` or `/sentencia/{article_id}`). If `article_id` is empty, hide or disable the source link.

### Streaming: `POST /api/v1/chat/stream`

- You receive **chunks** of text (may include `[1]`, `[2]` as they are generated) and a **citations** event with the same `citations` array as above once extraction is done.
- Citation markers in the stream are the same: **`[1]`, `[2]`, …**

---

## 4. How to Render Citations in the UI

### 4.1 Mapping `[n]` in text → citation

- **Order of first appearance:** The backend returns `citations` in the order of **first occurrence** of each cited source in the response.
- **Repeated refs:** The same source can appear multiple times (e.g. `[1]` twice). In `citations`, each **unique** cited source appears **once**; you use the **same** citation object for every `[1]` in the text.

**Algorithm:**

1. Parse the `response` string for all citation segments. Each segment is either:
   - `[n]` (single number), or
   - `[n, m, ...]` (comma-separated numbers, optional spaces).
   Use a regex that matches `\[(\d+(?:\s*,\s*\d+)*)\]` and, for each match, split the captured group by comma and parse integers. Collect **source IDs in order of first appearance** (e.g. from "See [2] and [1, 3]" you get ordered distinct IDs `[2, 1, 3]`).
2. The backend returns `citations` in that same order: `citations[i]` is the citation for the `i`-th **distinct** source ID that appeared in the response.
3. Build a map: **source ID `n` → citation**
   - `orderedSourceIds = distinct source IDs in order of first appearance`
   - `citationForId[n] = citations[orderedSourceIds.indexOf(n)]`
4. When rendering, replace each segment (`[1]`, `[1, 2, 3]`, etc.) with the corresponding citation(s). For `[1, 2, 3]` you may render one badge that expands to all three sources, or separate superscripts ¹²³; use `citationForId[n]` for each `n`. If a number is missing from the map, treat it as invalid and render as plain text or hide.

**Example:**

- Text: `"Equal [1] and free [2]. Also [1] again."`
- Ordered distinct IDs: `[1, 2]` → `citations[0]` is for `[1]`, `citations[1]` is for `[2]`.
- So: every `[1]` → `citations[0]`, every `[2]` → `citations[1]`.

- Text: `"See [2] and [1]."`
- Ordered distinct IDs: `[2, 1]` → `citations[0]` is for `[2]`, `citations[1]` is for `[1]`.
- So: every `[2]` → `citations[0]`, every `[1]` → `citations[1]`.

### 4.2 Suggested UX

- **Inline:** Replace each `[n]` with a **clickable superscript or badge** (e.g. `¹`, `²`, or `[1]`, `[2]`) that:
  - Shows a tooltip or popover with `display_text`, `normativa_title`, and optionally `article_path`.
  - Links to your article/sentencia page using `article_id` when non-empty.
- **Footnotes:** Optionally render a “Sources” or “Referencias” section below the message listing `citations` with `display_text` and links.
- **Accessibility:** Expose the same info to screen readers (e.g. “Referencia 1: Artículo 14, Constitución Española”) and ensure keyboard navigation to links.

### 4.3 Handling legacy format (optional)

If you still have or display old messages with `[cite:cite_key]display text[/cite]`:

- You can **either**:
  - Parse both patterns: `\[(\d+)\]` and `\[cite:([^\]]+)\](.+?)\[/cite\]`, and map the first to `citations` by order and the second by matching `cite_key` in `citations`, **or**
  - Render legacy markers as plain text or a generic “citation” style until all content is migrated.

The API **response** for **new** requests will only use `[1]`, `[2]` in the text; `citations` will still have `cite_key` and `display_text` for each entry.

---

## 5. Backend Context (From Previous Work)

These points are for context; no frontend change is required, but they affect what you get:

- **Deduplication:** Sources are deduplicated by `(article_id, article_number)`, so different fundamentos from the same sentencia can both appear (e.g. [1] and [2] for FJ 1 and FJ 2).
- **Collector errors:** If retrieval fails, the backend can still return 200 with an empty `citations` array and a response that may say it has no sources; your UI should handle empty `citations` gracefully.
- **Citation types:** The API does not yet expose a separate `type` (e.g. `legislation` vs `jurisprudence`). You can infer from context or from `article_id`/URL conventions until an explicit type or link hint is added.

---

## 6. Summary for Frontend

| Item | Action |
|------|--------|
| **Response text** | Expect citation markers as **`[1]`, `[2]`, …** (no `[cite:...]...[/cite]` in new responses). |
| **Mapping** | Map each `[n]` to `citations` by **order of first appearance**; repeated `[n]` reuses the same citation. |
| **Display** | Use `display_text` (and optionally `normativa_title`, `article_path`) for tooltips/footnotes; use `article_id` for “View source” links when non-empty. |
| **Streaming** | Same markers and same `citations` payload; parse `[n]` in streamed chunks and attach final `citations` when the citations event arrives. |
| **Legacy** | Optional: support old `[cite:key]...[/cite]` for stored messages; new API responses use only `[1]`, `[2]`. |

If you need an explicit **citation type** (legislation vs jurisprudence) or **suggested link URL** in the API for better UX, that can be added in a follow-up backend change.

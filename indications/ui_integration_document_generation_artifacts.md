# UI Integration: Document Generation & Artifacts (Claude-Style)

This guide is for **frontend engineers**. It explains how **AI-generated documents** (dictámenes, contratos, informes) work in the backend and how to integrate them in the UI with **auto-open**, **artifact chips**, and **revisit** (seeing and opening artifacts when the user returns to a conversation).

---

## 1. How Document Generation Works (Backend)

- **Documents are created inside the chat flow**, not via a separate “create document” endpoint. When the user asks the agent to generate a document (e.g. “Crea un dictamen sobre responsabilidad civil”), the **main LLM** uses a tool called `create_legal_document`.
- The tool:
  1. Receives `title` and `instruction` from the LLM.
  2. Calls the **document service** (LLM generates Markdown, then it’s persisted).
  3. Emits a **streaming `artifact` event** and appends to **`created_documents`** for the response.
- **Document creation is only available when using the `agent and research_agent` collectors** (e.g. `collector_type=agent` for the first message). Other collectors (rag, matrix) do not use the document tool and will not emit `status` or `artifact` events.

So: same chat/stream request; when the agent decides to create a document, you get events and metadata describing it. Your job is to show it (artifact chip, side panel) and persist references so that **on revisit** the user sees which messages produced which documents.

---

## 2. What the Frontend Must Support

| Feature | Description |
|--------|--------------|
| **Real-time artifact** | During streaming, show an artifact chip/box when an `artifact` event arrives; optionally **auto-open** the document panel when `auto_open === true`. |
| **Done reconciliation** | After the stream, use `done.metadata.created_documents` (and non-streaming `metadata.created_documents`) as the source of truth for “documents created this turn”. |
| **Revisit (Claude-style)** | When loading a conversation with `GET /api/v1/chat/{conversation_id}`, each **assistant** message may include `artifacts` (array of `{ id, title }`). Render a chip/card per artifact; on click, open the document via `GET /api/v1/documents/{id}`. |
| **Loading content** | Document **content** is never in the chat payload. Always fetch it with `GET /api/v1/documents/{document_id}` when the user opens an artifact. |

---

## 3. Where to Get Artifact Data

| Scenario | Source | What to use |
|----------|--------|-------------|
| **Streaming, live** | SSE event `type: "artifact"` | `data.artifact` = `{ id, title }`, `data.auto_open` = hint to open panel. Show chip and optionally open side panel. |
| **Streaming, end of turn** | SSE event `type: "done"` | `data.metadata.created_documents` = `[{ id, title }, ...]`. Reconcile with the artifact(s) you already showed; use for the assistant message you’re appending. |
| **Non-streaming** | `POST /api/v1/chat` response | `response.metadata.created_documents` = `[{ id, title }, ...]`. Attach to the assistant message you add to state. |
| **Revisit: load conversation** | `GET /api/v1/chat/{conversation_id}` | Each message in `messages[]` can have `artifacts: [{ id, title }, ...]` (only on assistant messages that created documents). Render a chip per artifact; on click → `GET /api/v1/documents/{id}`. |

The backend **persists** `created_documents` on the assistant message. So when the user revisits the chat, the API returns that message with `artifacts` populated—no need to call a separate “list documents for conversation” call just to place chips (you can still use `GET /api/v1/documents?conversation_id=...` for a sidebar list if you want).

---

## 4. Streaming Event Sequence (Document Creation)

When the agent creates a document, the stream typically looks like:

1. **`status`** – e.g. `phase: "document_creation_started"`, `message: "Creando documento…"`
2. **`artifact`** – `artifact_type: "document"`, `artifact: { id, title }`, `auto_open: true`
3. **`status`** – e.g. `phase: "document_creation_completed"`, `message: "Documento listo."`
4. **`chunk`** events – assistant text.
5. **`citations`** – citations used in the response.
6. **`done`** – `conversation_id`, `execution_time_ms`, `metadata.created_documents: [{ id, title }]`.

Recommended client behaviour:

- On **`artifact`**: push the artifact into the current turn’s list; show an artifact chip; if `auto_open === true`, open the document panel and call `GET /api/v1/documents/{artifact.id}` to render content.
- On **`done`**: treat `metadata.created_documents` as the canonical list for this assistant message; store it on that message so that if the client later reloads the conversation, it can match (the server already stores it and returns it as `artifacts` on that message).

---

## 5. API Reference (Relevant Parts)

Base URL: `/api/v1`. All require `Authorization: Bearer <token>`.

### 5.1 Chat (streaming) – form body

```http
POST /api/v1/chat/stream
Content-Type: application/x-www-form-urlencoded  (or multipart/form-data if file upload)

message=...&conversation_id=...&top_k=5&collector_type=agent
```

- Use **`collector_type=agent`** (e.g. for the first message) when you want document generation.

### 5.2 SSE event shapes

**Artifact event (during stream):**

```json
{
  "type": "artifact",
  "artifact_type": "document",
  "artifact": { "id": "doc-uuid", "title": "Dictamen sobre responsabilidad civil" },
  "auto_open": true
}
```

**Done event:**

```json
{
  "type": "done",
  "conversation_id": "conv-uuid",
  "execution_time_ms": 2500,
  "metadata": {
    "created_documents": [
      { "id": "doc-uuid", "title": "Dictamen sobre responsabilidad civil" }
    ]
  }
}
```

### 5.3 GET conversation (revisit)

```http
GET /api/v1/chat/{conversation_id}
Authorization: Bearer <token>
```

**Response (200)** – each message can include `artifacts`:

```json
{
  "id": "conv-uuid",
  "messages": [
    { "role": "user", "content": "Crea un dictamen sobre X.", "citations": [], "timestamp": "...", "document_name": null, "artifacts": null },
    {
      "role": "assistant",
      "content": "Aquí tienes el dictamen...",
      "citations": [...],
      "timestamp": "...",
      "document_name": null,
      "artifacts": [
        { "id": "doc-uuid", "title": "Dictamen sobre responsabilidad civil" }
      ]
    }
  ],
  "created_at": "...",
  "updated_at": "..."
}
```

- **`artifacts`** is only present and non-empty for **assistant** messages that created documents in that turn. Use it to render a chip/card next to (or below) that message; on click, open the document.

### 5.4 Get document content

```http
GET /api/v1/documents/{document_id}
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "id": "doc-uuid",
  "title": "Dictamen sobre responsabilidad civil",
  "conversation_id": "conv-uuid",
  "created_at": "...",
  "updated_at": "...",
  "metadata": { "format": "markdown" },
  "current_version": {
    "version_number": 1,
    "content": "# Dictamen jurídico\n\n## 1. Hechos\n...",
    "content_hash": "...",
    "created_at": "...",
    "edit_description": "Initial creation"
  }
}
```

- Render **`current_version.content`** as Markdown (e.g. same component as chat markdown).

### 5.5 List documents (optional)

```http
GET /api/v1/documents?conversation_id={conversation_id}
Authorization: Bearer <token>
```

Use this if you want a **sidebar** “Documents in this conversation” list. For **Claude-style chips per message**, the **`artifacts`** field on each message from `GET /api/v1/chat/{conversation_id}` is enough.

---

## 6. TypeScript Types (Suggested)

```ts
interface ArtifactSummary {
  id: string;
  title: string;
}

interface StreamArtifactEvent {
  type: 'artifact';
  artifact_type: 'document';
  artifact: ArtifactSummary;
  auto_open: boolean;
}

interface StreamDoneEvent {
  type: 'done';
  conversation_id: string;
  execution_time_ms: number;
  metadata?: {
    created_documents?: ArtifactSummary[];
    [key: string]: unknown;
  };
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  citations: Citation[];
  timestamp: string;
  document_name?: string | null;
  artifacts?: ArtifactSummary[] | null;  // only on assistant messages that created docs
}
```

---

## 7. Checklist for Full Support

- [ ] Use **streaming** (`POST /api/v1/chat/stream`) with **`collector_type=agent`** when document generation is desired (e.g. first message of a conversation).
- [ ] On **`artifact`** event: show an artifact chip/box for `data.artifact`; if `data.auto_open` is true, open the document panel and fetch `GET /api/v1/documents/{data.artifact.id}` to display `current_version.content` (Markdown).
- [ ] On **`done`** event: store `metadata.created_documents` on the assistant message you just built so your local state matches the server (and so revisit can rely on the same shape).
- [ ] **Revisit:** When loading a conversation with `GET /api/v1/chat/{conversation_id}`, for each message with `artifacts` (assistant only), render a chip/card per artifact; on click, call `GET /api/v1/documents/{id}` and show the document (e.g. side panel or modal).
- [ ] Always load document **content** via `GET /api/v1/documents/{id}`; never assume content is in the chat or list response.
- [ ] Handle **401** (re-auth) and **404** (document not found / not owned) on document requests.

---

## 8. Summary

- **Document generation** is done by the agent’s `create_legal_document` tool during chat; no separate create endpoint.
- **Streaming:** handle `status` → `artifact` (show chip, optionally auto-open) → `chunk` → `citations` → `done`; persist `created_documents` on the assistant message.
- **Revisit:** `GET /api/v1/chat/{conversation_id}` returns **`artifacts`** on assistant messages that created documents; use them to show Claude-style chips and open documents with `GET /api/v1/documents/{id}`.

This gives you **auto-open**, **artifact display**, and **full revisit** support in the frontend.

# Frontend Integration: Document Name Display

**Audience:** Frontend engineers  
**Purpose:** How to show a document label/logo when the user asked a question about an uploaded file (PDF/DOCX).

---

## 1. What This Feature Is

When a user uploads a document with their first message in a chat, the backend now **persists the document’s original filename** and exposes it so the UI can:

- Show a **document icon + filename** (e.g. “contract.pdf”) in the conversation header or next to the first message.
- Indicate clearly that **this conversation is about an uploaded document**.

The backend does **not** send the file itself again; it only sends the **display name** (original filename).

---

## 2. Where to Get the Document Name

You can get `document_name` in three places, depending on the flow.

| Scenario | Source | Field / event |
|--------|--------|----------------|
| **Right after sending a message with a file** (non‑streaming) | `POST /api/v1/chat` response | `metadata.document_name` |
| **Right after sending a message with a file** (streaming) | SSE stream, after `done` | Event `type: "metadata"` with `document_name` |
| **When loading an existing conversation** | `GET /api/v1/chat/{conversation_id}` response | Top-level `document_name` |

Use the **same value** for the label everywhere (e.g. “Informe.pdf”).

---

## 3. API Contract

### 3.1 Non‑streaming: `POST /api/v1/chat`

When the user sends a message **with an attached file** (and the request succeeds), the response body includes:

```json
{
  "response": "...",
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "citations": [...],
  "execution_time_ms": 1250,
  "metadata": {
    "document_name": "contract.pdf"
  }
}
```

- **`metadata.document_name`**  
  - Type: `string`  
  - Present only when a file was uploaded in **this** request.  
  - Use it to show the document label immediately after send, without a second request.

**Handling in code:**

```javascript
const data = await response.json();
if (data.metadata?.document_name) {
  // Show document icon + data.metadata.document_name in this conversation’s header/title
  setConversationDocumentName(data.conversation_id, data.metadata.document_name);
}
```

---

### 3.2 Streaming: `POST /api/v1/chat/stream`

The stream sends the usual events (`status`, `chunk`, `citations`, `done`, `error`). When the user sent a **file** with this request, the server may send an extra event **after** the `done` event:

```json
{"type": "metadata", "document_name": "contract.pdf"}
```

- **Event type:** `metadata`  
- **Payload:** `document_name` (string) — original filename.

**Handling in code:**

```javascript
for await (const event of parseSSE(reader)) {
  if (event.type === 'done') {
    conversationId = event.conversation_id;
    // ... handle done
  }
  if (event.type === 'metadata' && event.document_name) {
    setConversationDocumentName(conversationId, event.document_name);
  }
}
```

Parse SSE as you already do (e.g. `data: {...}\n\n`); then check `event.type === 'metadata'` and use `event.document_name` for the label.

---

### 3.3 Loading a conversation: `GET /api/v1/chat/{conversation_id}`

When the user opens an existing conversation, the response includes an optional top-level field:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "messages": [...],
  "created_at": "2025-02-15T10:00:00",
  "updated_at": "2025-02-15T10:05:00",
  "document_name": "contract.pdf"
}
```

- **`document_name`**  
  - Type: `string | null`  
  - Present only when this conversation was started with an uploaded document.  
  - Use it to show the document icon + name in the conversation view (e.g. header or subtitle).

**Handling in code:**

```javascript
const conv = await fetch(`/api/v1/chat/${conversationId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
if (conv.document_name) {
  // e.g. set conversation header: icon + conv.document_name
  showDocumentLabel(conv.document_name);
}
```

---

## 4. When to Show the Document Label

- **Conversation view (open chat):**  
  If `GET /api/v1/chat/{conversation_id}` returns `document_name`, show a document icon and the name (e.g. in the header or next to “Asked about: contract.pdf”).
- **Right after sending a message with a file:**  
  Use `metadata.document_name` from `POST /api/v1/chat` or the `metadata` SSE event from `POST /api/v1/chat/stream` and store it for the current `conversation_id` so the same label appears without refetching.
- **Conversation list (optional):**  
  If you list conversations and want a doc icon in the list, you currently need to either cache `document_name` when you get it (from the send response or the metadata event), or open each conversation with `GET /api/v1/chat/{id}` to read `document_name`. There is no dedicated list field for `document_name` yet.

---

## 5. UX Suggestions

- **Display:** One clear pattern is: document icon (e.g. PDF/file icon) + filename, e.g. `contract.pdf`.
- **Sanitization:** The value is the original filename from the upload. For display, you may want to truncate very long names (e.g. max 30–40 chars + “…”) or escape HTML if you render it in the DOM.
- **Missing value:** If `document_name` is `null` or absent, do not show the document block; the conversation is a normal (no-upload) chat.

---

## 6. Checklist for Frontend

- [ ] **Non‑streaming:** After `POST /api/v1/chat`, read `response.metadata.document_name` and store it for the current `conversation_id`; show document icon + name in the conversation UI.
- [ ] **Streaming:** After parsing SSE, handle `type === 'metadata'` and use `document_name` the same way as above.
- [ ] **Load conversation:** When loading a chat with `GET /api/v1/chat/{conversation_id}`, read `document_name` and show the document label if present.
- [ ] **No duplicate requests:** Prefer using the document name from the send response or stream so you don’t need an extra GET just to get the label after the first message.
- [ ] **Null safety:** Only show the document block when `document_name` is a non‑empty string.

---

## 7. Summary Table

| Endpoint / stream      | Where is document name?        | When to use it                          |
|------------------------|---------------------------------|-----------------------------------------|
| `POST /api/v1/chat`    | `response.metadata.document_name` | Right after send (non‑streaming).       |
| `POST /api/v1/chat/stream` | SSE event `type: "metadata"`, `document_name` | Right after send (streaming).           |
| `GET /api/v1/chat/{id}`| `response.document_name`       | When opening/loading that conversation. |

All three provide the same logical value (original filename) for the same conversation; use whichever is available in your current flow.

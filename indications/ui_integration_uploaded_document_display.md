# UI Integration: Uploaded Document Box Above Message

This guide is for **frontend engineers**. It describes how to display user-uploaded documents (PDF/DOCX) as a **box above the specific message that introduced each document**. The backend stores the document name **on that message only** (not globally), so you can support multiple document uploads in one conversation.

---

## 1. Behaviour Summary

- When a user sends a message **with an attached file**, the backend stores the **original filename** on **that message** (message-level metadata).
- You must show a **document box (card) directly above the user message** that had the file attached.
- **Per-message**: Each message can have its own `document_name` or none. Render the box above a message only when that message has `document_name` set. This scales to multiple documents (e.g. user uploads one file in message 1, another in message 5).

**Layout rule:**  
For **each** user message, if that message has `document_name`, render: **document box → then that message**. Otherwise render only the message.

---

## 2. Where to Get the Document Name

| Scenario | Source | Where it lives |
|----------|--------|----------------|
| **Loading an existing conversation** | `GET /api/v1/chat/{conversation_id}` | Each item in `messages[]` has an optional `document_name`. Use `message.document_name` for that message. |
| **Just sent a message with file (non-streaming)** | `POST /api/v1/chat` response | `metadata.document_name`. Attach it to the **user message you just appended** in your state. |
| **Just sent a message with file (streaming)** | SSE stream after `done` | Event `{"type": "metadata", "document_name": "..."}`. Attach it to the **user message you just appended** in your state. |

There is **no** conversation-level `document_name`. Only messages have it.

---

## 3. API Details

### 3.1 GET conversation (when opening a chat or on page load)

**Request**

```http
GET /api/v1/chat/{conversation_id}
Authorization: Bearer <token>
```

**Response (200)**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "messages": [
    {
      "role": "user",
      "content": "Analiza este contrato.",
      "citations": [],
      "timestamp": "2025-02-15T10:00:00",
      "document_name": "contrato.pdf"
    },
    {
      "role": "assistant",
      "content": "En el contrato se observa...",
      "citations": [...],
      "timestamp": "2025-02-15T10:00:05",
      "document_name": null
    },
    {
      "role": "user",
      "content": "Y este otro.",
      "citations": [],
      "timestamp": "2025-02-15T10:01:00",
      "document_name": "informe.docx"
    }
  ],
  "created_at": "2025-02-15T10:00:00",
  "updated_at": "2025-02-15T10:01:00"
}
```

- **`messages[].document_name`**: `string | null`. When present, this **message** introduced an uploaded document. Render the document box **above this message** only. When `null`, do not render a document box for this message.

### 3.2 POST /chat (non-streaming) – immediate display

When the user sends a message **with a file**, the JSON response includes:

```json
{
  "response": "...",
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "citations": [...],
  "execution_time_ms": 1250,
  "metadata": {
    "document_name": "contrato.pdf"
  }
}
```

- **`metadata.document_name`**: Set only when a file was attached to **this** request. Store it on the **user message you just added** in your UI state (e.g. `currentConversation.messages[last].document_name = response.metadata.document_name`). Then render the box above that message.

### 3.3 POST /chat/stream (streaming) – immediate display

After the stream completes, the server may send:

```json
{"type": "metadata", "document_name": "contrato.pdf"}
```

- Parse this and set **the user message you just appended** to have `document_name` in your state. Render the document box above that message.

---

## 4. Placement: Box Above the Message That Introduced the Document

- **Per message**: For each message in `messages`, check `message.document_name`.
- If **set** (non-null, non-empty): render a **document box** directly **above** that message bubble, then the message content.
- If **null** or missing: render only the message, no box.

**Visual order (example with two docs):**

```
┌─────────────────────────────────────┐
│  📄 contrato.pdf                     │   ← box for first message
└─────────────────────────────────────┘
  User: Analiza este contrato.

  Assistant: En el contrato se observa...

┌─────────────────────────────────────┐
│  📄 informe.docx                     │   ← box for third message
└─────────────────────────────────────┘
  User: Y este otro.
```

---

## 5. Suggested Document Box Content

- **Icon**: Document/file icon (e.g. PDF or generic doc).
- **Label**: Use `message.document_name` (e.g. `contrato.pdf`, `informe.docx`).
- **Style**: Card/box so it’s clearly the “document attached to this message”, distinct from the message bubble.

Example (conceptual):

```html
<!-- For each message -->
{if message.document_name}
  <div class="document-box" data-document-name="{{ message.document_name }}">
    <span class="document-icon">📄</span>
    <span class="document-name">{{ message.document_name }}</span>
  </div>
{endif}
<div class="message message--{{ message.role }}">{{ message.content }}</div>
```

---

## 6. State Handling Checklist

- **New message with file (non-streaming)**  
  - Append the user message to your list. Set that message’s `document_name` from `response.metadata.document_name` (if present). Render the box above that message.

- **New message with file (streaming)**  
  - Append the user message when the user sends. When you receive `{"type": "metadata", "document_name": "..."}`, set it on that appended message. Render the box above that message.

- **Loading a previous chat (page load / refresh)**  
  - Call `GET /api/v1/chat/{conversation_id}`. Use the **full** response. Store **each** message with its **own** `document_name` from `messages[].document_name`. When rendering, for each message with `document_name` set, show the box above that message.

- **No document on a message**  
  - `document_name` is `null` or missing → do not render a document box for that message.

- **Multiple documents in one conversation**  
  - Multiple messages can have `document_name`. Each gets its own box above that message.

---

## 7. Quick Reference

| What | Where |
|------|--------|
| Document name for a message | `message.document_name` (from GET conversation) or set from POST/stream `metadata.document_name` on the message you just sent |
| Position | Box **above the same message** that has `document_name` |
| When to show | When `message.document_name` is a non-empty string |
| When not to show | `message.document_name` is `null`, missing, or empty |
| Scale | One box per message that has a document; multiple docs = multiple messages with `document_name` |

This gives frontend engineers everything needed to implement the “document box above the message that introduced it” behaviour with per-message storage and support for multiple documents.

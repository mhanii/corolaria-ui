# Frontend Integration Guide: Document Upload Support

> [!WARNING]
> **BREAKING CHANGE**: The `/chat` and `/chat/stream` endpoints have switched from `application/json` to `multipart/form-data`.
> You **MUST** update your API client to send `FormData` objects instead of JSON strings.

## Overview

The backend now supports uploading optional reference documents (PDF or DOCX) alongside the chat message. To support binary file uploads, we have migrated the chat endpoints to use `multipart/form-data`.

## 1. Endpoints

Both standard and streaming chat endpoints have been updated:

- `POST /api/v1/chat` (Standard request/response)
- `POST /api/v1/chat/stream` (Server-Sent Events streaming)

## 2. Request Structure

**Content-Type:** `multipart/form-data`

### Form Fields (Parameters)

| Field Name | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `message` | `text` | **Yes** | - | The user's query or message. |
| `file` | `file` | No | - | Optional PDF or DOCX file (max 200k extracted chars). |
| `conversation_id` | `text` | No | `null` | UUID of existing conversation. |
| `top_k` | `text` (int) | No | `10` | Number of retrieval results (e.g., "5"). |
| `collector_type` | `text` | No | `rag` | Strategy: `rag`, `qrag`, or `agent`. Only used for **new** conversations. |

### JavaScript Example (Fetch API)

```javascript
// 1. Construct FormData
const formData = new FormData();
formData.append('message', 'Analyze this contract for me.');
formData.append('top_k', '5');

// Optional: Add file if selected by user
const fileInput = document.querySelector('input[type="file"]');
if (fileInput.files[0]) {
    formData.append('file', fileInput.files[0]);
}

// Optional: Add conversation ID
if (currentConversationId) {
    formData.append('conversation_id', currentConversationId);
}

// 2. Send Request
// Note: Do NOT set 'Content-Type' header manually; 
// validation will fail if the browser doesn't set the boundary.
const response = await fetch('https://api.corolaria.com/api/v1/chat', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}` 
    },
    body: formData
});

const data = await response.json();
```

## 3. Response Structure (`/chat`)

The JSON response format remains **unchanged**.

```json
{
  "response": "Based on the document provided and Article 123...",
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "citations": [
    {
      "article_id": "BOE-A-2020-1234",
      "article_number": "Art. 12",
      "normativa_title": "Ley de Enjuiciamiento Civil",
      "article_text": "...",
      "score": 0.85,
      "index": 1
    }
  ],
  "execution_time_ms": 1250,
  "config_matrix": { ... } // Debug metadata
}
```

## 4. Streaming Response (`/chat/stream`)

The streaming structure also remains largely the same, but the **request** must be `multipart/form-data`.

Server-Sent Events (SSE) stream will contain:

1.  **Chunks**: `data: {"chunk": "..."}`
2.  **Citations**: `data: {"citations": [...]}` (Usually sent at the end)
3.  **Completion**: `event: completion` / `data: [DONE]`

### Streaming Implementation Note
When using `fetch` or `EventSource` for streaming, you cannot easily send `FormData` with standard `EventSource`. You likely need to use `fetch` with a readable stream reader.

```javascript
const response = await fetch('/api/v1/chat/stream', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }, // No Content-Type!
    body: formData
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    // Parse SSE format (data: ...)
    // ...
}
```

## 5. Error Handling

- **400 Bad Request**:
    - Missing `message` field.
    - File type not supported (not PDF/DOCX).
    - File too large (text extraction limit exceeded).
- **422 Validation Error**: Malformed parameters.

## Checklist for Frontend Team

- [ ] Remove `JSON.stringify({...})` from API calls.
- [ ] Rename payload construction to use `new FormData()`.
- [ ] Ensure `message` and `file` are appended correctly.
- [ ] Do **not** manually set `Content-Type: multipart/form-data`; let the browser set it with the boundary.
- [ ] Test uploading a PDF and ensuring the backend receives it.

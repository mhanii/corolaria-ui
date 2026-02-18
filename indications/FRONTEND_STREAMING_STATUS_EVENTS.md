# Chat streaming: status events and UI guide

This document describes the **streaming chat API** and the **status/phase events** your frontend must handle to show workflow progress (e.g. research agent, document generation). Use it to implement or update the chat UI.

---

## 1. API overview

### Endpoint

- **Stream chat**: `POST /api/v1/chat/stream`
- **Content-Type**: `multipart/form-data` (or `application/x-www-form-urlencoded` if no file)
- **Authentication**: `Authorization: Bearer <access_token>` (JWT from `POST /api/v1/auth/login`)

### Request parameters (form fields)

| Parameter           | Type    | Required | Description |
|--------------------|---------|----------|-------------|
| `message`          | string  | Yes      | User message / question. |
| `conversation_id`  | string  | No       | Existing conversation ID for multi-turn. Omit for a new conversation. |
| `top_k`            | integer | No       | Number of sources to retrieve (default `5`, range 1–20). |
| `collector_type`   | string  | No       | Context collector. Only applies to the **first** message of a conversation. Values: `rag`, `qrag`, `agent`, `matrix`, `research`. Use `research` for deep research + document generation. |
| `file`             | file    | No       | Optional PDF or Docx file for analysis. |

- For **research + document generation** flows, send `collector_type=research` on the first message and ask e.g. “Genera un dictamen sobre…” or “Crea un documento…”.

### Response

- **Content-Type**: `text/event-stream` (SSE)
- Each event is a single line: `data: <JSON>\n\n`
- Parse each line: strip the `data: ` prefix and `JSON.parse` the payload.

---

## 2. Event types and structure

Every SSE payload is a JSON object. Use the **`type`** field to branch; use **`phase`** (when present) for status/phase-specific UI.

### 2.1 Status events (`type: "status"`)

Used for workflow progress. Show a status line, step list, or progress indicator.

| `phase` | When it is sent | Suggested UI |
|--------|------------------|----------------|
| `context_collection_start` | Start of context retrieval (RAG/research). | Show “Recopilando contexto…” (or use `message`). Optionally show `strategy` (e.g. `ResearchAgent`, `RAGCollector`). |
| `context_collection_end`   | Context retrieval finished. | Hide “Recopilando contexto…” or show “Contexto listo”. Optionally show `strategy`, `chunks_count`. |
| `research_agent_start`    | Deep research (research agent) started. | Show “Investigación profunda…” (or `message`). |
| `research_plan_ready`     | Research plan is ready (list of steps). | Show the plan: use `plan` (array of strings). e.g. “Plan: 1. Buscar artículos… 2. Buscar sentencias…” |
| `research_step_done`       | One research step completed. | Update progress: show `step_index`/total, `step` (description), `summary` (e.g. “Found N items”). |
| `research_agent_end`       | Deep research finished. | Hide research progress. Optionally show `evidence_count`, `plan`, `past_steps`. |
| `generate_start`           | LLM response generation started. | Show “Generando respuesta…” (or `message`). |
| `generate_end`             | LLM response generation finished. | Hide “Generando respuesta…”. |
| `document_creation_started`  | User asked for a document and the tool started. | Show “Creando documento…” (or `message`). |
| `document_creation_completed`| Document was created successfully. | Hide “Creando documento…”, show “Documento listo.” (or `message`). |
| `document_creation_failed`   | Document creation failed. | Show error state using `message`. |

**Common fields for status events**

- `type`: `"status"`
- `phase`: string (see table above)
- `message`: optional human-readable string (e.g. “Recopilando contexto…”)
- Phase-specific: `strategy`, `chunks_count`, `plan`, `step_index`, `step`, `summary`, `past_steps`, `evidence_count`, etc.

**Example payloads**

```json
{"type": "status", "phase": "context_collection_start", "message": "Recopilando contexto…", "strategy": "ResearchAgent"}
{"type": "status", "phase": "research_agent_start", "message": "Investigación profunda…"}
{"type": "status", "phase": "research_plan_ready", "plan": ["Buscar artículos sobre X", "Buscar sentencias sobre Y"]}
{"type": "status", "phase": "research_step_done", "step_index": 0, "step": "Buscar artículos…", "summary": "Found 5 items"}
{"type": "status", "phase": "research_agent_end", "plan": [...], "past_steps": [...], "evidence_count": 12}
{"type": "status", "phase": "generate_start", "message": "Generando respuesta…"}
{"type": "status", "phase": "document_creation_started", "message": "Creando documento…"}
{"type": "status", "phase": "document_creation_completed", "message": "Documento listo."}
```

---

### 2.2 Artifact events (`type: "artifact"`)

Emitted when the assistant creates a document. Use this to open or highlight the new document in the UI.

| Field            | Description |
|------------------|-------------|
| `type`           | `"artifact"` |
| `artifact_type`  | `"document"` |
| `artifact`       | `{ "id": "<document_id>", "title": "<title>" }` |
| `auto_open`      | `true` — suggest opening the document in the side panel or a new view. |

**Example**

```json
{"type": "artifact", "artifact_type": "document", "artifact": {"id": "doc-uuid-123", "title": "Dictamen sobre responsabilidad civil"}, "auto_open": true}
```

**UI change**: When you receive this, show the new document (e.g. in the documents panel) and optionally open it if `auto_open` is true.

---

### 2.3 Chunk events (`type: "chunk"`)

Streamed response text. Append `content` to the assistant message in the UI.

```json
{"type": "chunk", "content": "Este es un fragmento de la respuesta."}
```

---

### 2.4 Citations event (`type: "citations"`)

Final list of citations used in the response. Use it to render references or footnotes.

```json
{"type": "citations", "citations": [{"id": "...", "title": "...", "excerpt": "...", ...}]}
```

---

### 2.5 Done event (`type: "done"`)

Stream finished. Use it to stop the loading state and store the conversation.

| Field               | Description |
|---------------------|-------------|
| `conversation_id`   | ID of the conversation (new or existing). |
| `execution_time_ms`| Total time in milliseconds. |
| `metadata`          | Optional; may include `created_documents` (list of `{id, title}`). |
| `error`             | If present and `true`, the stream ended with an error. |
| `message`           | If error, human-readable message. |

**UI change**: On `done`, hide any “generating”/“research” status, finalize the assistant message, and optionally show `execution_time_ms` or link to created documents from `metadata.created_documents`.

---

### 2.6 Error event (`type: "error"`)

Application or stream error.

```json
{"type": "error", "message": "Human-readable error message"}
```

**UI change**: Show the error (toast, inline, or banner) and stop the loading state.

---

### 2.7 Metadata event (`type: "metadata"`)

Optional; e.g. when a document was attached.

```json
{"type": "metadata", "document_name": "informe.pdf"}
```

Use it to display “Conversation with document: informe.pdf” or similar.

---

## 3. Event order (typical flow with research + document)

For a **first message** with `collector_type=research` and a query like “Genera un dictamen sobre responsabilidad civil”:

1. `context_collection_start` (strategy: ResearchAgent)
2. `research_agent_start`
3. `research_plan_ready` (show plan)
4. `research_step_done` (possibly several)
5. `research_agent_end`
6. `context_collection_end`
7. `generate_start`
8. `chunk` (many)
9. Optionally: `document_creation_started` → `artifact` (document) → `document_creation_completed`
10. `generate_end`
11. `citations`
12. `done`

Status events can appear in a batch after context collection (e.g. all research phases together), then generate and document events are interleaved with chunks. Handle events by `type` and `phase`; do not rely on a fixed order except that `done` is last (or `error` then `done`).

---

## 4. UI checklist

- [ ] **Login**: Call `POST /api/v1/auth/login` with `username`/`password`; store `access_token` and send it as `Authorization: Bearer <token>` on chat requests.
- [ ] **Stream connection**: Use `EventSource` (SSE) or `fetch` with `stream`; parse `data: <JSON>\n\n` and branch on `type`.
- [ ] **Status / phase**: For each `type: "status"`, update UI by `phase` (see table in §2.1): show/hide “Recopilando contexto”, “Investigación profunda”, “Generando respuesta”, “Creando documento”, etc.
- [ ] **Research plan**: On `research_plan_ready`, show the `plan` array (e.g. numbered list).
- [ ] **Research steps**: On `research_step_done`, show step progress (e.g. “Step 2/5: …” and `summary`).
- [ ] **Document creation**: On `document_creation_started` show “Creando documento…”; on `document_creation_completed` hide it; on `artifact` with `artifact_type: "document"` open or highlight the document (`artifact.id`, `artifact.title`).
- [ ] **Chunks**: Append `chunk.content` to the assistant message.
- [ ] **Citations**: On `citations`, render the list (e.g. references/footnotes).
- [ ] **Done**: On `done`, clear loading state, save `conversation_id`, show time or created documents if needed.
- [ ] **Error**: On `error` or `done` with `error: true`, show `message` and stop loading.

---

## 5. Collector types (reference)

| Value     | Description |
|----------|-------------|
| `rag`    | Default; vector RAG retrieval. |
| `qrag`   | Query-focused RAG. |
| `agent`  | ReAct-style agent. |
| `matrix` | Legislation + jurisprudence matrix. |
| `research`| Deep research (plan–execute) + best for “generate a document” flows. |

Use **`research`** when the user explicitly asks for deep research or to generate a document (dictamen, contrato, etc.).

---

## 6. Example: parsing the stream (pseudocode)

```javascript
const eventSource = new EventSource(url, { headers: { Authorization: `Bearer ${token}` } });
// Or use fetch with body and read the stream; then for each line:
for (const line of streamLines) {
  if (!line.startsWith('data: ')) continue;
  const payload = JSON.parse(line.slice(6));
  switch (payload.type) {
    case 'status':
      handleStatusPhase(payload.phase, payload);
      break;
    case 'artifact':
      if (payload.artifact_type === 'document')
        openDocument(payload.artifact.id, payload.artifact.title);
      break;
    case 'chunk':
      appendToMessage(payload.content);
      break;
    case 'citations':
      setCitations(payload.citations);
      break;
    case 'done':
      setConversationId(payload.conversation_id);
      finishLoading();
      break;
    case 'error':
      showError(payload.message);
      break;
  }
}
```

---

## 7. Verification with curl

You can verify the streaming API and status events locally.

**1. Login** (get JWT):

```bash
curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Hamada-_-1"}'
```

Save the `access_token` from the response.

**2. Stream a chat with research + document generation**:

```bash
TOKEN="<paste_access_token_here>"
curl -s -N -X POST "http://localhost:8000/api/v1/chat/stream" \
  -H "Authorization: Bearer $TOKEN" \
  -F "message=Genera un dictamen breve sobre responsabilidad civil por daños." \
  -F "collector_type=research"
```

Replace `localhost:8000` if your API runs elsewhere. You should see SSE lines starting with `data: ` containing status events (e.g. `context_collection_start`, `research_agent_start`, `research_plan_ready`, `research_agent_end`, `generate_start`, `document_creation_started`, `document_creation_completed`, `generate_end`), then `chunk`, `citations`, and finally `done`.

**One-liner** (login + stream, token in env):

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"Hamada-_-1"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
curl -s -N -X POST "http://localhost:8000/api/v1/chat/stream" -H "Authorization: Bearer $TOKEN" -F "message=Genera un dictamen sobre responsabilidad civil." -F "collector_type=research"
```

---

*Backend: LangGraph chat workflow with `event_callback` status events. Last updated to match streaming implementation.*

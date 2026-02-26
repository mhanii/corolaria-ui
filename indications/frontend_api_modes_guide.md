# Frontend Integration Guide: Chat API Modes & Status Events

This document explains the available chat modes in Corolaria's unified API, the distinction between them, and the real-time status events streamed back to the client.

## 1. Unified API Endpoint

All chat requests (both single-turn and multi-turn, streaming and non-streaming) must go through the unified `v1` chat endpoints:

- **Streaming:** `POST /api/v1/chat/stream`
- **Standard:** `POST /api/v1/chat`

Both endpoints accept a `mode` form parameter (or pull it from the `conversation_id` metadata for existing chats).

## 2. Available Modes (`mode` parameter)

There are exactly two supported execution modes in the system:

### `mode="workflow"` (Default)
- **Behavior:** The system performs a deep, multi-iterative research sweep using a "Plan-and-Execute" sub-agent *before* attempting to generate an answer.
- **Use Case:** Best for complex queries requiring exhaustive legal research where thoroughness is more important than immediate latency.
- **UI Implication:** It takes longer to start generating tokens, but will emit rich status events detailing its internal research plan and progress along the way.

### `mode="agent"`
- **Behavior:** The system uses a conversational, reactive agent that Streams text immediately while occasionally grabbing tools (like Legal Search or Web Search) on-demand in the middle of its reasoning.
- **Use Case:** Best for quick answers, conversational follow-ups, web searches, or simpler legal queries that do not require exhaustive deep dives.
- **UI Implication:** Lower latency to first token. Tool execution happens dynamically instead of upfront.

> [!TIP]
> **Mode Persistence:** When starting a new conversation (no `conversation_id`), the backend saves the chosen `mode` in the conversation's metadata. Subsequent messages in that conversation will inherit the mode automatically.

> [!WARNING]
> **Removed Architectural Concepts**: 
> The legacy `collector_type` feature has been permanently removed. We no longer support `"matrix"`, `"agent"` (as a collector), or `"qrag"` (now obsolete). Use the `mode` parameter exclusively as detailed above.

---

## 3. Creating a Request

To initiate a chat, clients must use `multipart/form-data` to post to the generic `/api/v1/chat/stream` or `/api/v1/chat` endpoints.

### Example: Initiating a Workflow Chat (cURL)
```bash
curl -X POST "http://localhost:8000/api/v1/chat/stream" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -F "message=Quiero un resumen de esta ley" \
  -F "mode=workflow" \
  -F "top_k=5"
```
*(If attaching a document, simply add `-F "file=@/path/to/doc.pdf"` to the request).*

## 4. The Status Event System

During a streaming response (`POST /api/v1/chat/stream`), the backend emits Server-Sent Events (SSE). To ensure a resilient UI, **the frontend should handle status events agnostically of the execution mode.** Do not hardcode UI logic that says "if mode is agent, don't expect research events" — modes may evolve to share tools in the future.

### Base Event Structure
Every status event on the SSE stream follows this shape:
```json
{
  "type": "status",
  "phase": "...",
  "message": "...", // Optional human-readable message
  "source": "..."   // Optional component identifier
}
```

### Example SSE Flow
Connecting via SSE to `/api/v1/chat/stream` will yield a series of payloads formatted like this:

```json
data: {"type": "status", "phase": "research_plan_ready", "message": "Investigación profunda iniciada...", "plan": ["Buscar Art. 1", "Buscar sentencias"]}

data: {"type": "status", "phase": "research_step_done", "message": "Ejecutando paso 1...", "step_index": 0}

data: {"type": "chunk", "content": "Según lo investigado, "}

data: {"type": "chunk", "content": "la ley establece que..."}

data: {"type": "citations", "citations": [{"id": 1, "article_number": "Art. 1", "score": 0.89}]}

data: {"type": "done", "conversation_id": "conv-12345"}
```

### Reference: Available `phase` Types

#### Generic Phases
- `context_collection_start` / `context_collection_end`: Emitted when the system starts/finishes gathering baseline data.
- `generate_start` / `generate_end`: Emitted when the main LLM begins/finishes generating text.

#### Deep Research Phases (Common in `workflow` mode)
- `research_agent_start`: The deep research cycle has begun.
- `research_plan_ready`: The agent has formulated an evidence checklist. Payload includes a `"plan"` array (list of strings).
- `research_step_done`: A granular step is complete. Payload includes `"step_index"`, `"step_text"`, and `"results_count"`.
- `research_reflection`: The agent is evaluating if it has enough evidence. Payload includes `"is_complete"` (boolean) and `"reasoning"`.
- `research_agent_end`: The deep research cycle is over.

#### Document Creation Phases (Triggered by either mode)
- `document_creation_started`: The system began generating a standalone document (like a contract or summary).
- `document_creation_completed`: Document generation finished successfully. Look for a subsequent `{"type": "artifact"}` event to get the actual document ID.
- `document_creation_failed`: Document generation failed.

#### Agent Tool Phases (Common in `agent` mode)
The agent mode dynamically uses tools (e.g., `legal_research_tool`, `internet_search`, `create_legal_document`). **Do not hardcode UI states for specific tools.** Instead, read the `"tool"` property from the event payload and display it dynamically so your UI automatically supports any future tools we add.

- `tool_start`: The reactive agent started using a tool. Payload includes `"tool"` (the internal tool name like `"internet_search"`).
- `tool_end`: Tool execution matched/completed successfully. Payload includes `"tool"`.
- `tool_error`: Tool failed. Payload includes `"tool"`, `"error_code"`, and `"retry_suggested"`.

> [!IMPORTANT]
> **Agnostic UI Design:** Build your UI components to map directly to `phase` values, rather than checking the active conversation `mode`. If the backend emits a `research_plan_ready` event, simply render the plan block, regardless of which mode triggered it. This guarantees UI forward-compatibility.

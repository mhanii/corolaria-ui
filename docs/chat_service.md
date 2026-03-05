# Chat Service Documentation

This document describes the architecture and implementation of the chat system in Corolaria UI.

## Overview

The chat system is built around a real-time streaming architecture using Server-Sent Events (SSE). It consists of two main layers:
1.  **API Service Layer**: `src/lib/api/services/chatService.ts`
2.  **React Hook Layer**: `src/hooks/useChatStream.ts`

---

## API Service Layer (`chatService.ts`)

The service layer handles raw communication with the backend.

### `streamChatMessage(request, callbacks)`
This is the core function for real-time interaction. It uses the browser's `fetch` API with a ReadableStream to process SSE events.

**Supported Event Types:**
- `chunk`: Incremental text updates for the assistant response.
- `citations`: Bibliographic references for the assistant response.
- `status`: High-level phase updates (e.g., "Researching", "Thinking").
- `artifact`: Generated documents or complex structured data.
- `metadata`: Supplemental information (e.g., `document_name` of the uploaded file).
- `done`: Signal that the stream has completed.
- `error`: Backend error messages.

**SSE Handling:**
The service parses `data: ` prefixed lines. It maintains a buffer to handle fragmented packets and ensures that only complete JSON objects are processed.

---

## React Hook Layer (`useChatStream.ts`)

The `useChatStream` hook is the primary interface for components to interact with the chat service. It manages state, handles errors, and coordinates the streaming UI.

### Key State Variables:
- `messages`: An array of `Message` objects including user, assistant, system, and tool messages.
- `isTyping`: True when the assistant is "thinking" but no text has arrived yet.
- `isStreaming`: True when words are actively being streamed.
- `conversationId`: The active conversation UUID.
- `mode`: Either `'workflow'` or `'agent'`.

### Streaming Coordination:
The hook uses `StreamingAreaRef` to communicate with the `StreamingArea` component. This decoupling allows the `StreamingArea` to handle complex animations (like word-by-word interpolation) without causing expensive re-renders of the entire message list.

### `handleSendMessage(content, file)`
1.  **Optimistic UI**: Immediately adds the user message to the `messages` array.
2.  **Reset UI**: Resets the `StreamingArea` for the new response.
3.  **Stream Initiation**: Calls `chatService.streamChatMessage`.
4.  **Interruption Handling**: Certain phases (like `tool_start` or `research_plan_ready`) trigger a "flush" of any accumulated text into the message list to keep the UI clean.
5.  **Finalization**: On the `done` event, it invokes the interpolator's `completeStream` callback to ensure the buffer is drained before finalizing the message state and updating the token balance.

---

## Message Structure

```typescript
export interface Message {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    citations?: CitationResponse[];
    document_name?: string | null;
    artifacts?: ArtifactSummary[] | null;
    tool_summary?: {
        tool_name: string;
        label: string;
        artifact?: { type: string; id: string; title: string };
    };
}
```

- **Tool Messages**: Special messages that represent background actions (e.g., search, document creation).
- **Artifacts**: Persistent documents generated during a conversation.

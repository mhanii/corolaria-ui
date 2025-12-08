# Collector Type Selection Implementation

## Overview

Added a quality/collector type selector to the chat input interface, allowing users to choose between three levels of context retrieval quality for **new conversations only**.

## Quality Levels

| Level | Collector Type | Description |
|-------|---------------|-------------|
| **Bajo** (Low) | `rag` | Standard vector search (fast, default) |
| **Medio** (Medium) | `qrag` | Query-optimized search using AI (slower, more accurate) |
| **Pronto** (High) | `pronto` | Coming soon feature |

## Implementation Details

### 1. Type Definitions

**File:** [types.ts](file:///home/kali/coloraria-ui/src/lib/api/types.ts#L226-L238)

Added `collector_type` field to `ChatRequest`:

```typescript
export interface ChatRequest {
    message: string;
    conversation_id?: string | null;
    top_k?: number;
    collector_type?: 'rag' | 'qrag' | 'pronto';
}
```

### 2. Chat Input Component

**File:** [ChatInput.tsx](file:///home/kali/coloraria-ui/src/components/chat/ChatInput.tsx)

#### Props Interface

```typescript
interface ChatInputProps {
    onSendMessage: (message: string) => void
    message: string
    setMessage: (message: string) => void
    collectorType?: 'rag' | 'qrag' | 'pronto'
    onCollectorTypeChange?: (type: 'rag' | 'qrag' | 'pronto') => void
    isNewConversation?: boolean
}
```

#### UI Component

Added a quality selector that:
- Only displays for **new conversations** (when `isNewConversation` is true)
- Shows three buttons: **Bajo**, **Medio**, **Pronto**
- Highlights the currently selected option
- Uses styled buttons with accent color for active state

```tsx
{isNewConversation && onCollectorTypeChange && (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/30 border border-border/50">
        <span className="text-xs font-medium text-muted-foreground mr-1">Calidad:</span>
        <Button variant={collectorType === 'rag' ? 'default' : 'ghost'} ...>
            Bajo
        </Button>
        <Button variant={collectorType === 'qrag' ? 'default' : 'ghost'} ...>
            Medio
        </Button>
        <Button variant={collectorType === 'pronto' ? 'default' : 'ghost'} ...>
            Pronto
        </Button>
    </div>
)}
```

### 3. Chat Page

**File:** [page.tsx](file:///home/kali/coloraria-ui/src/app/chat/page.tsx)

#### State Management

```typescript
const [collectorType, setCollectorType] = useState<'rag' | 'qrag' | 'pronto'>('rag')
```

#### API Integration

Only includes `collector_type` for **new conversations** (when `conversationId` is null):

```typescript
const response = await sendChatMessage({
    message: content,
    conversation_id: conversationId,
    top_k: 5,
    // Only include collector_type for new conversations
    ...(conversationId === null && { collector_type: collectorType })
})
```

#### Component Wiring

```tsx
<ChatInput
    onSendMessage={handleSendMessage}
    message={inputMessage}
    setMessage={setInputMessage}
    collectorType={collectorType}
    onCollectorTypeChange={setCollectorType}
    isNewConversation={conversationId === null}
/>
```

### 4. API Service

**File:** [chatService.ts](file:///home/kali/coloraria-ui/src/lib/api/services/chatService.ts#L47-L56)

Conditionally includes `collector_type` in the request:

```typescript
const chatRequest: ChatRequest = {
    message: request.message.trim(),
    conversation_id: request.conversation_id || null,
    top_k: request.top_k || 5,
    ...(request.collector_type && { collector_type: request.collector_type })
};
```

## Behavior

### ✅ Key Features

1. **New Conversations Only:** The quality selector appears only when starting a new chat
2. **Persistent Selection:** The selected quality level is maintained while composing the first message
3. **Default Value:** Defaults to 'Bajo' (rag) if not explicitly selected
4. **Visual Feedback:** Active selection is highlighted with accent color
5. **API Compliance:** Follows backend specification from `frontend_collector_type_guide.md`

### 🎯 User Flow

1. User opens a new chat (no `conversation_id`)
2. Quality selector appears in the input container
3. User selects quality level: **Bajo**, **Medio**, or **Pronto**
4. User types and sends first message
5. API receives the selected `collector_type`
6. Selector disappears for follow-up messages (conversation continues with initial quality level)

## Files Modified

1. ✅ [types.ts](file:///home/kali/coloraria-ui/src/lib/api/types.ts) - Added `collector_type` to `ChatRequest`
2. ✅ [ChatInput.tsx](file:///home/kali/coloraria-ui/src/components/chat/ChatInput.tsx) - Added quality selector UI
3. ✅ [page.tsx](file:///home/kali/coloraria-ui/src/app/chat/page.tsx) - Added state management and wiring
4. ✅ [chatService.ts](file:///home/kali/coloraria-ui/src/lib/api/services/chatService.ts) - Updated API call

## Testing Checklist

- [ ] Quality selector appears on new chat
- [ ] Quality selector does NOT appear on existing conversations
- [ ] Selecting **Bajo**, **Medio**, or **Pronto** updates the visual state
- [ ] First message includes correct `collector_type` in API request
- [ ] Follow-up messages do NOT include `collector_type`
- [ ] Default quality is 'Bajo' (rag)
- [ ] TypeScript compilation successful ✅ (verified)

## Next Steps

- Test the UI in browser to verify visual appearance
- Verify API receives correct `collector_type` values
- Implement backend support for 'pronto' (currently shows "coming soon")

# Beta Testing API Schema

API endpoints for the Athen Beta Testing program.

## Base URL
```
/api/v1/beta
```

---

## Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

---

## Endpoints

### GET `/status`
Get beta test mode status and user token information.

**Response**: `TestModeStatusResponse`
```json
{
  "test_mode_enabled": true,
  "available_tokens": 5,
  "requires_refill": false,
  "pending_arena": null,
  "surveys_completed": 2
}
```

---

### GET `/survey/questions`
Get list of survey questions.

**Response**: `SurveyQuestionsResponse`
```json
{
  "questions": [
    "¿Qué tan útil fue la respuesta del asistente? (1-5)",
    "¿La respuesta citó fuentes legales de manera clara?",
    "¿Encontraste la información que buscabas?",
    "¿Qué tan fácil fue entender la respuesta?",
    "¿Recomendarías este asistente a un colega?"
  ],
  "total_questions": 5
}
```

---

### POST `/survey`
Submit survey responses to refill tokens.

**Request**: `SurveyRequest`
```json
{
  "responses": [
    "5 - Muy útil",
    "Sí, las citas fueron claras",
    "Sí, encontré lo que buscaba",
    "4 - Bastante fácil",
    "Sí, lo recomendaría"
  ]
}
```

**Response**: `SurveyResponse`
```json
{
  "success": true,
  "tokens_granted": 10,
  "new_balance": 15,
  "message": "¡Gracias! Se han añadido 10 tokens a tu cuenta."
}
```

---

### POST `/feedback`
Submit like/dislike/report feedback on a message.

**Request**: `FeedbackRequest`
```json
{
  "message_id": 42,
  "conversation_id": "abc123-def456",
  "feedback_type": "like",
  "comment": null
}
```

| `feedback_type` | Description |
|-----------------|-------------|
| `like` | User found response helpful |
| `dislike` | User found response unhelpful |
| `report` | User is reporting an issue |

**Response**: `FeedbackResponse`
```json
{
  "id": "feedback-uuid",
  "success": true,
  "message": "Feedback 'like' registrado. ¡Gracias!"
}
```

---

### POST `/arena/{comparison_id}/preference`
Submit preference for an A/B arena comparison.

**Path Parameters**:
- `comparison_id`: ID of the comparison to respond to

**Request**: `PreferenceRequest`
```json
{
  "preference": "A"
}
```

**Response**: `PreferenceResponse`
```json
{
  "success": true,
  "comparison_id": "arena-123",
  "selected": "A"
}
```

---

### GET `/arena/pending`
Get any pending arena comparison awaiting preference.

**Response**: `ArenaResponse | null`
```json
{
  "comparison_id": "arena-123",
  "response_a": "El artículo 14 establece...",
  "response_b": "Según el artículo 14, todos los ciudadanos...",
  "citations_a": [],
  "citations_b": []
}
```

---

## Chat Endpoint Changes

### 402 Payment Required Response
When user has no tokens, error now includes:
```json
{
  "error": "InsufficientTokens",
  "message": "You have no remaining API tokens. Complete a survey to refill.",
  "requires_refill": true,
  "survey_endpoint": "/api/v1/beta/survey"
}
```

### Chat Response Fields (Test Mode)

#### `config_matrix`
Configuration used for response generation:
```json
{
  "config_matrix": {
    "model": "gemini-2.5-flash",
    "temperature": 0.3,
    "top_k": 3,
    "collector_type": "rag",
    "prompt_version": "1.0",
    "context_reused": false,
    "next_version_depth": -1,
    "previous_version_depth": 1,
    "max_refers_to": 3
  }
}
```

#### `arena_comparison` (when A/B test triggered)
When arena triggers (80% probability on new conversations), two responses generated:
```json
{
  "response": "Response A text...",
  "arena_comparison": {
    "comparison_id": "abc-123-def",
    "response_a": "Response A text...",
    "response_b": "Alternative response with different config...",
    "config_a": {"top_k": 3, "collector_type": "rag"},
    "config_b": {"top_k": 10, "collector_type": "rag"},
    "citations_a": [...],
    "citations_b": [...]
  }
}
```

---

## Data Storage

### Arena Comparisons Table
Stores all A/B test data for analysis:
- `query` - Original user query
- `response_a/b` - Full response text
- `config_a/b` - Complete config matrices (JSON)
- `context_a/b` - RAG context provided to LLM
- `citations_a/b` - Citations used
- `user_preference` - A or B (after user selects)

---

## Phoenix Observability

When Phoenix is enabled, spans are tagged with:
```
arena.comparison_id: "abc-123"
arena.config_a.top_k: 3
arena.config_b.top_k: 10
feedback.type: "like"
beta.test_mode: true
```
One question, should i always use api/v1/beta?

No, you use different endpoints depending on the action:

Endpoint	When to Use
/api/v1/chat	Normal chat (includes 
arena_comparison
 + 
config_matrix
 when test mode enabled)
/api/v1/beta/status	Check token balance, test mode status
/api/v1/beta/survey/*	Get questions / submit survey for token refill
/api/v1/beta/feedback	Submit like/dislike/report on a message
/api/v1/beta/arena/*	Get pending arena / submit preference
Summary:

Use /api/v1/chat for all chat interactions (arena triggers automatically in the response)
Use /api/v1/beta/* only for beta-specific actions (surveys, feedback, arena preferences)

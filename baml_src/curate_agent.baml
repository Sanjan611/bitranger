// Curate Agent - Analyzes content and stores it in the context tree
// This agent is responsible for organizing and persisting knowledge.

// CurateContext agent - analyzes content and stores it in the context tree
function CurateContext(content: string, domainHint: string?, topicHint: string?, contextTreeStructure: string, messageHistory: AgentMessage[]) -> ListDomainsTool | ListTopicsTool | ListMemoriesTool | ReadMemoryTool | ReadFileTool | WriteMemoryTool | CurateDoneTool {
  client CustomHaiku
  prompt #"
    You are a context curation agent for the bitranger knowledge management system.
    Your task is to analyze the provided content and store it appropriately in the context tree.

    ## Context Tree Structure
    {{ contextTreeStructure }}

    ## Your Available Tools
    - ListDomains: List all domains in the context tree
    - ListTopics: List topics within a specific domain
    - ListMemories: List memory files within a domain/topic
    - ReadMemory: Read the content of a specific memory file
    - ReadFile: Read source code files from the project codebase
    - WriteMemory: Write or update a memory file in the context tree
    - Done: Signal that curation is complete

    ## CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE STEPS:
    
    1. **Analyze the content** to understand what domain and topic it belongs to
    2. **Explore the context tree** using ListDomains and ListTopics to understand the existing structure
    3. **Choose the best location** - pick an existing domain/topic or determine if a new topic is needed
    4. **YOU MUST CALL WriteMemory** - This is REQUIRED. You must create or update a memory file with the content
       - Choose an appropriate filename (use kebab-case, e.g., "jwt-authentication.md")
       - Format the content as clear, well-structured Markdown
       - Include the original content with proper organization
    5. **ONLY call Done AFTER you have successfully called WriteMemory**
    
    ⚠️  DO NOT call Done without first calling WriteMemory. The user expects their content to be saved.

    {% if domainHint %}
    Domain Hint: {{ domainHint }}
    {% endif %}
    {% if topicHint %}
    Topic Hint: {{ topicHint }}
    {% endif %}

    ## Conversation History
    {% if messageHistory %}
    {% for msg in messageHistory %}
    {{ _.role(msg.role) }}
    {{ msg.message }}

    {% endfor %}
    {% endif %}

    ## Efficient Tool Usage Examples

    Good pattern for SIMPLE content (e.g., "API uses JWT"):
    1. ListDomains → understand available categories
    2. ListTopics (in relevant domain) → find or confirm appropriate topic
    3. WriteMemory → directly create/update the memory file

    Good pattern for COMPLEX content (e.g., detailed architecture):
    1. ListDomains → explore high-level organization
    2. ListTopics → identify relevant topic area
    3. ListMemories (if topic exists) → check for existing related context
    4. ReadMemory (if relevant file exists) → understand existing patterns
    5. WriteMemory → create new or update existing file with merged knowledge

    AVOID:
    - Calling the same tool repeatedly with identical parameters
    - Reading multiple unrelated memories before deciding on a topic
    - Listing all domains/topics when hints are already provided
    - Over-exploration for simple, straightforward content

    For simple content, aim for 3-4 tool calls maximum before WriteMemory.
    For complex content, 5-7 tool calls is reasonable.

    {{ _.role("user") }}
    Content to curate:
    {{ content }}

    {{ ctx.output_format }}
  "#
}

test curate_rate_limiting {
  functions [CurateContext]
  args {
    content #"
      # Rate Limiting Implementation

      ## Overview
      We've implemented a sophisticated rate limiting middleware to protect our API endpoints from abuse and ensure fair usage across all clients.

      ## Implementation Details

      ### Middleware Architecture
      - Uses Redis as the backing store for rate limit counters
      - Implements the token bucket algorithm for smooth rate limiting
      - Supports per-user and per-IP rate limiting strategies

      ### Configuration
      ```python
      RATE_LIMITS = {
          'default': {'requests': 100, 'window': 60},  # 100 req/min
          'authenticated': {'requests': 1000, 'window': 60},  # 1000 req/min
          'premium': {'requests': 5000, 'window': 60}  # 5000 req/min
      }
      ```

      ### Key Features
      - Automatic tier detection based on user authentication
      - Graceful degradation if Redis is unavailable (logs warnings but allows requests)
      - Custom headers in responses: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
      - Exponential backoff suggestions in 429 responses

      ## Integration Points
      - Applied globally via app middleware stack
      - Exceptions for health check and metrics endpoints
      - Integrates with monitoring system to track rate limit hits

      ## Future Considerations
      - Add support for burst allowances
      - Implement per-endpoint custom limits
      - Consider geographic rate limiting for certain endpoints
    "#
    domainHint "engineering"
    topicHint "backend"
    contextTreeStructure #"
      context_tree/
      ├── engineering/
      │   ├── backend/
      │   │   ├── api-design-principles.md
      │   │   └── authentication-flow.md
      │   ├── frontend/
      │   │   └── component-architecture.md
      │   └── infrastructure/
      │       └── deployment-pipeline.md
      ├── product/
      │   ├── features/
      │   │   └── user-onboarding.md
      │   └── decisions/
      │       └── pricing-model.md
      └── operations/
          └── runbooks/
              └── incident-response.md
    "#
    messageHistory [
      {
        role: "user",
        message: #"
Tool: ListDomains
Input: {}
Output:
Available domains:
- engineering
- product
- operations
        "#
      },
      {
        role: "user",
        message: #"
Tool: ListTopics
Input: {"domain": "engineering"}
Output:
Topics in engineering domain:
- backend
- frontend
- infrastructure
        "#
      },
      {
        role: "user",
        message: #"
Tool: ListMemories
Input: {"domain": "engineering", "topic": "backend"}
Output:
Memories in engineering/backend:
- api-design-principles.md
- authentication-flow.md
        "#
      },
      {
        role: "user",
        message: #"
Tool: ReadMemory
Input: {"domain": "engineering", "topic": "backend", "filename": "api-design-principles.md"}
Output:
# API Design Principles

## Core Principles

### RESTful Design
- Use standard HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Resource-oriented URLs (e.g., /users/123/orders)
- Meaningful HTTP status codes

### Versioning
- API version in URL: /v1/users, /v2/users
- Maintain backward compatibility for at least 2 major versions
- Deprecation notices 6 months before removal

### Error Handling
- Consistent error response format:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Human-readable message",
      "details": []
    }
  }
  ```

### Security
- All endpoints require authentication unless explicitly public
- Use JWT tokens for authentication
- Implement CORS properly for web clients

### Performance
- Implement pagination for list endpoints (default: 20 items)
- Use ETags for caching where appropriate
- Compress responses with gzip

## Request/Response Standards
- Accept and return JSON by default
- Use camelCase for field names
- ISO 8601 format for dates and times
- Include request IDs in responses for tracing
        "#
      }
    ]
  }
}

test simple_curate_test {
  functions [CurateContext]
  args {
    content #"
      Our API uses JWT with 15-min expiry
    "#
    contextTreeStructure #"
      context_tree/
      ├── API/
      ├── Architecture/
      └── Frontend/
    "#
    messageHistory []
  }
}


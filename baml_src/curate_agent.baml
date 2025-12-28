// Curate Agent - Analyzes content and stores it in the context tree
// This agent is responsible for organizing and persisting knowledge.

// CurateContext agent - analyzes content and stores it in the context tree
function CurateContext(content: string, domainHint: string?, topicHint: string?, contextTreeStructure: string, toolResults: ToolResult[]) -> ListDomainsTool | ListTopicsTool | ListMemoriesTool | ReadMemoryTool | ReadFileTool | WriteMemoryTool | CurateDoneTool {
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

    ## Instructions
    1. Analyze the content to understand its topic and domain
    2. Explore the existing context tree structure to find the best location
    3. Check for existing related memories that might need updating
    4. Write the content as a new memory or update an existing one
    5. Call Done when curation is complete

    {% if domainHint %}
    Domain Hint: {{ domainHint }}
    {% endif %}
    {% if topicHint %}
    Topic Hint: {{ topicHint }}
    {% endif %}

    ## Previous Tool Results
    {% for result in toolResults %}
    Tool: {{ result.toolName }}
    Input: {{ result.input }}
    Output: {{ result.output }}
    ---
    {% endfor %}

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
    toolResults [
      {
        toolName: "ListDomains",
        input: "{}",
        output: #"
          Available domains:
          - engineering
          - product
          - operations
        "#
      },
      {
        toolName: "ListTopics",
        input: #"{"domain": "engineering"}"#,
        output: #"
          Topics in engineering domain:
          - backend
          - frontend
          - infrastructure
        "#
      },
      {
        toolName: "ListMemories",
        input: #"{"domain": "engineering", "topic": "backend"}"#,
        output: #"
          Memories in engineering/backend:
          - api-design-principles.md
          - authentication-flow.md
        "#
      },
      {
        toolName: "ReadMemory",
        input: #"{"domain": "engineering", "topic": "backend", "filename": "api-design-principles.md"}"#,
        output: #"
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


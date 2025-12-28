// Query Agent - Retrieves relevant context from the context tree
// This agent is responsible for finding and synthesizing knowledge.

// QueryContext agent - retrieves relevant context from the context tree
function QueryContext(query: string, domainFilter: string?, contextTreeStructure: string, toolResults: ToolResult[]) -> ListDomainsTool | ListTopicsTool | ListMemoriesTool | ReadMemoryTool | ReadFileTool | QueryDoneTool {
  client CustomHaiku
  prompt #"
    You are a context retrieval agent for the bitranger knowledge management system.
    Your task is to find and return relevant context from the context tree to answer the user's query.

    ## Context Tree Structure
    {{ contextTreeStructure }}

    ## Your Available Tools
    - ListDomains: List all domains in the context tree
    - ListTopics: List topics within a specific domain
    - ListMemories: List memory files within a domain/topic
    - ReadMemory: Read the content of a specific memory file
    - ReadFile: Read source code files from the project codebase
    - Done: Return the retrieved context and summary

    ## Instructions
    1. Analyze the query to understand what information is needed
    2. Navigate the context tree to find relevant memories
    3. Read memory files that might contain relevant information
    4. When you have gathered enough context, call Done with:
       - results: Array of relevant context pieces with their sources
       - summary: A synthesized answer based on the retrieved context

    {% if domainFilter %}
    Domain Filter: Focus your search on the "{{ domainFilter }}" domain
    {% endif %}

    ## Previous Tool Results
    {% for result in toolResults %}
    Tool: {{ result.toolName }}
    Input: {{ result.input }}
    Output: {{ result.output }}
    ---
    {% endfor %}

    {{ _.role("user") }}
    Query: {{ query }}

    {{ ctx.output_format }}
  "#
}

test query_authentication_system {
  functions [QueryContext]
  args {
    query "How does our authentication system work?"
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
        input: #"{"domain": "engineering", "topic": "backend", "filename": "authentication-flow.md"}"#,
        output: #"
          # Authentication Flow

          ## Overview
          Our authentication system uses JWT (JSON Web Tokens) for stateless authentication across all API endpoints and services.

          ## Authentication Process

          ### 1. User Login
          - User submits credentials (email + password) to POST /v1/auth/login
          - Backend validates credentials against PostgreSQL user database
          - Passwords are hashed using bcrypt with salt rounds of 12

          ### 2. Token Generation
          On successful authentication:
          - Generate access token (JWT) with 15-minute expiration
          - Generate refresh token with 7-day expiration
          - Access token payload includes:
            ```json
            {
              "sub": "user_id",
              "email": "user@example.com",
              "role": "user|admin|premium",
              "iat": 1234567890,
              "exp": 1234568790
            }
            ```

          ### 3. Token Storage
          - Access token: Stored in memory (React context) on frontend
          - Refresh token: Stored in httpOnly secure cookie
          - Never store tokens in localStorage (XSS vulnerability)

          ### 4. API Request Authentication
          - Client includes access token in Authorization header: `Bearer <token>`
          - API Gateway validates token signature and expiration
          - If valid, request proceeds with user context
          - If expired, client must refresh using refresh token

          ### 5. Token Refresh Flow
          - Client sends refresh token to POST /v1/auth/refresh
          - Backend validates refresh token
          - If valid, issues new access token (and optionally new refresh token)
          - If invalid or expired, user must re-login

          ## Security Features

          ### Token Security
          - JWT signed with RS256 (asymmetric encryption)
          - Private key stored in AWS Secrets Manager
          - Public key distributed to all services for validation
          - Token includes jti (JWT ID) for revocation support

          ### Additional Protection
          - Rate limiting on auth endpoints (5 attempts per 15 minutes)
          - Account lockout after 5 failed login attempts
          - Email notification on suspicious login activity
          - IP-based anomaly detection for geographic mismatches

          ### Session Management
          - Refresh tokens stored in Redis with user_id as key
          - Support for multiple active sessions (up to 5 devices)
          - Explicit logout invalidates refresh token in Redis
          - "Logout all devices" endpoint clears all user sessions

          ## Integration Points
          - Works with OAuth2 providers (Google, GitHub) via separate endpoints
          - SSO support for enterprise customers using SAML 2.0
          - Mobile apps use same JWT flow with device fingerprinting
          - Microservices validate tokens using shared public key

          ## Monitoring
          - Track authentication success/failure rates
          - Alert on unusual spike in failed attempts
          - Log all authentication events with IP and user agent
          - Dashboard shows active sessions per user
        "#
      },
      {
        toolName: "ListMemories",
        input: #"{"domain": "engineering", "topic": "frontend"}"#,
        output: #"
          Memories in engineering/frontend:
          - component-architecture.md
        "#
      }
    ]
  }
}


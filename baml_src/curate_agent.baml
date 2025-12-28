// Curate Agent - Analyzes content and stores it in the context tree
// This agent is responsible for organizing and persisting knowledge.

// =============================================================================
// TEMPLATE STRINGS - Reusable prompt sections
// =============================================================================

template_string CurateAgentIdentity() #"
You are an agent that curates memories for the Bitranger memory management system.
Memories are stored in a context tree, which is a hierarchical structure of domains and topics.

Your task is to analyze the provided content and store it appropriately in the context tree.
"#

template_string CurateAvailableTools() #"
## Available Tools

- ListDomains: List all domains in the context tree
- ListTopics: List topics within a specific domain
- ListMemories: List memory files within a domain/topic
- ReadMemory: Read the content of a specific memory file
- ReadFile: Read source code files from the project codebase
- WriteMemory: Write or update a memory file (action: "create" or "update")
- Done: Signal that curation is complete
"#

template_string CurateContextTreeStructure(contextTreeStructure: string, domainHint: string?, topicHint: string?) #"
## Context Tree Structure

{{ contextTreeStructure }}

{% if domainHint %}
Domain Hint: {{ domainHint }}
{% endif %}
{% if topicHint %}
Topic Hint: {{ topicHint }}
{% endif %}
"#

template_string CurateInstructions() #"
## Memory Management Decision Logic

**Determine Action:**
1. Check if a relevant memory file exists using ListMemories
2. If a potentially relevant file exists, ReadMemory to examine its content
3. Decide on action:
   - **No relevant file exists** → WriteMemory with action="create"
   - **Existing file has all details** → Call Done (no write needed)
   - **Existing file is incomplete** → WriteMemory with action="update" (merge content)
   - **Existing file conflicts with new content** → WriteMemory with action="update" (resolve conflict)

**Critical Rules:**
- **Check message history BEFORE calling any tool** - avoid redundant operations
- Do NOT read the same memory file twice (if already read, use that information)
- Do NOT re-list domains/topics if they're already in message history
- Do NOT create a new file if updating existing one is more appropriate
- Do NOT call Done without WriteMemory (unless content already exists and is complete)
- ALWAYS merge existing context when updating (don't overwrite valuable information)

**File Naming:**
- Use kebab-case for filenames (e.g., "jwt-authentication.md")
- Choose descriptive, specific names
- Include the .md extension

**Content Formatting:**
- Format all content as clear, well-structured Markdown
- Use proper headings (##, ###)
- Include code blocks with language tags where appropriate
- Organize information logically
"#

template_string CurateGoodExamples() #"
## Efficient Tool Usage Patterns

**Pattern for SIMPLE content** (e.g., "API uses JWT with 15-min expiry"):
1. ListDomains → identify relevant category
2. ListTopics (in that domain) → find appropriate topic
3. ListMemories (in that topic) → check for existing related files
4. If file exists: ReadMemory → assess completeness → WriteMemory (update) OR Done
5. If no file: WriteMemory (create) → Done

**Pattern for COMPLEX content** (e.g., detailed architecture document):
1. ListDomains → identify target domain
2. ListTopics → find appropriate topic
3. ListMemories → identify candidate files
4. ReadMemory (only most relevant file) → assess overlap/conflict
5. WriteMemory (create new OR update existing) → Done
"#

template_string CurateMessageHistory(messageHistory: AgentMessage[]) #"
{% if messageHistory %}
## Previous Actions

{% for msg in messageHistory %}
{{ _.role(msg.role) }}
{{ msg.message }}

{% endfor %}
{% endif %}
"#

template_string CurateUserRequest(content: string) #"
{{ _.role("user") }}
Content to curate:
{{ content }}
"#

// =============================================================================
// MAIN FUNCTION - Composes all template strings
// =============================================================================

function CurateContext(content: string, domainHint: string?, topicHint: string?, contextTreeStructure: string, messageHistory: AgentMessage[]) -> ListDomainsTool | ListTopicsTool | ListMemoriesTool | ReadMemoryTool | ReadFileTool | WriteMemoryTool | CurateDoneTool {
  client CustomHaiku
  prompt #"
    {{ CurateAgentIdentity() }}

    {{ CurateAvailableTools() }}

    {{ CurateContextTreeStructure(contextTreeStructure, domainHint, topicHint) }}

    {{ CurateInstructions() }}

    {{ CurateGoodExamples() }}

    {{ CurateMessageHistory(messageHistory) }}

    {{ CurateUserRequest(content) }}

    {{ ctx.output_format }}
  "#
}

// =============================================================================
// TESTS
// =============================================================================

test test_curate_first_iteration {
  functions [CurateContext]
  args {
    content "Our API uses Redis for caching with 1-hour TTL. The cache key format is 'cache:{resource}:{id}' and we use Redis SET with EX option."
    contextTreeStructure #"
      context_tree/
      ├── engineering/
      │   ├── backend/
      │   │   └── authentication.md
      │   └── frontend/
      │       └── components.md
      └── product/
          └── features/
              └── onboarding.md
    "#
    messageHistory []
  }
}

test test_curate_mid_iteration {
  functions [CurateContext]
  args {
    content #"
      # Enhanced Rate Limiting

      We're adding burst allowance to our existing rate limiting system:
      - Burst allowance: 20 extra requests per minute for authenticated users
      - Uses token bucket algorithm with refill rate
      - Burst tokens reset every hour
    "#
    domainHint "engineering"
    topicHint "backend"
    contextTreeStructure #"
      context_tree/
      ├── engineering/
      │   ├── backend/
      │   │   ├── authentication.md
      │   │   └── rate-limiting.md
      │   └── frontend/
      │       └── components.md
      └── product/
          └── features/
              └── onboarding.md
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
        "#
      },
      {
        role: "user",
        message: #"
Tool: ListMemories
Input: {"domain": "engineering", "topic": "backend"}
Output:
Memories in engineering/backend:
- authentication.md
- rate-limiting.md
        "#
      }
    ]
  }
}

test test_curate_near_completion {
  functions [CurateContext]
  args {
    content "We use bcrypt with 12 salt rounds for password hashing. Minimum password length is 12 characters."
    domainHint "engineering"
    topicHint "backend"
    contextTreeStructure #"
      context_tree/
      ├── engineering/
      │   ├── backend/
      │   │   ├── authentication.md
      │   │   └── rate-limiting.md
      │   └── frontend/
      │       └── components.md
      └── product/
          └── features/
              └── onboarding.md
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
        "#
      },
      {
        role: "user",
        message: #"
Tool: ListMemories
Input: {"domain": "engineering", "topic": "backend"}
Output:
Memories in engineering/backend:
- authentication.md
- rate-limiting.md
        "#
      },
      {
        role: "user",
        message: #"
Tool: ReadMemory
Input: {"domain": "engineering", "topic": "backend", "filename": "authentication.md"}
Output:
# Authentication

## JWT Tokens
- Access token expiry: 15 minutes
- Refresh token expiry: 7 days
- Stored in httpOnly cookies

## OAuth Integration
- Supports Google and GitHub OAuth
- Uses passport.js library
        "#
      }
    ]
  }
}

test test_curate_conflict_resolution {
  functions [CurateContext]
  args {
    content #"
      # Updated JWT Configuration

      We've changed our JWT token expiry times for better security:
      - Access token expiry: 30 minutes (changed from 15 minutes)
      - Refresh token expiry: 14 days (changed from 7 days)
      
      Reason: Reduce the number of token refreshes while maintaining security.
      This change was approved in the security review on Dec 2024.
    "#
    domainHint "engineering"
    topicHint "backend"
    contextTreeStructure #"
      context_tree/
      ├── engineering/
      │   ├── backend/
      │   │   ├── authentication.md
      │   │   └── rate-limiting.md
      │   └── frontend/
      │       └── components.md
      └── product/
          └── features/
              └── onboarding.md
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
        "#
      },
      {
        role: "user",
        message: #"
Tool: ListMemories
Input: {"domain": "engineering", "topic": "backend"}
Output:
Memories in engineering/backend:
- authentication.md
- rate-limiting.md
        "#
      },
      {
        role: "user",
        message: #"
Tool: ReadMemory
Input: {"domain": "engineering", "topic": "backend", "filename": "authentication.md"}
Output:
# Authentication

## JWT Tokens
- Access token expiry: 15 minutes
- Refresh token expiry: 7 days
- Stored in httpOnly cookies

## OAuth Integration
- Supports Google and GitHub OAuth
- Uses passport.js library

## Password Requirements
- Minimum 12 characters
- Must include uppercase, lowercase, numbers, and special characters
- Hashed with bcrypt using 12 salt rounds
        "#
      }
    ]
  }
}

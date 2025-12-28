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

- ListTopics: List topics within a specific domain. If there are none, returns nothing.
- ListSubtopics: List subtopics within a specific topic. If there are none, returns nothing.
- ReadMemory: Read the content of the implicit context.md file at topic or subtopic level
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
1. Navigate to the relevant domain/topic using Available Domains (in tree structure) and ListTopics (check message history first)
2. Attempt to ReadMemory to examine existing context.md (the filename is always context.md, implicit)
3. Decide on action based on ReadMemory result:
   - **ReadMemory returns error (no file)** → WriteMemory with action="create"
   - **ReadMemory succeeds but has all details** → Call Done (no write needed)
   - **ReadMemory succeeds but incomplete** → WriteMemory with action="update" (merge content)
   - **ReadMemory succeeds but conflicts** → WriteMemory with action="update" (resolve conflict)

**Critical Rules:**
- **Check message history BEFORE calling any tool** - avoid redundant operations
- Do NOT read the same context.md twice (if already read, use that information)
- Do NOT re-list topics/subtopics if they're already in message history (domains are in Available Domains header)
- ReadMemory errors indicate no existing context.md file (not a failure - proceed with create)
- Do NOT create a new file if updating existing one is more appropriate
- Do NOT call Done without WriteMemory (unless content already exists and is complete)
- ALWAYS merge existing context when updating (don't overwrite valuable information)
- ASSUME ReadMemory will fail if trying to read for a topic or subtopic that doesn't exist based on ListTopics or ListSubtopics results

**Hierarchical Organization:**
- Each topic has a context.md file (implicit, no need to specify filename)
- Each subtopic (if used) also has its own context.md file
- Use subtopics for deeper organization (maximum 1 level deep)

**Structure Example:**
```
code_style/
├── error-handling/           # topic
│   ├── context.md           # topic-level overview
│   └── api-tests/           # subtopic
│       └── context.md       # subtopic-specific details
```

**Subtopics:**
- Use subtopics to organize related content within a topic
- Maximum depth: 1 level (domain → topic → subtopic)
- Both topic and subtopic have context.md files
- Topic-level context.md: overview and general information
- Subtopic-level context.md: specific detailed information
- Subtopics are optional - use when content has clear sub-categories

**Content Formatting:**
- Format all content as clear, well-structured Markdown
- Use proper headings (##, ###)
- Include code blocks with language tags where appropriate
- Organize information logically

**Relations Section:**
- Add a ## Relations section at the end of context.md files
- Use @domain/topic or @domain/topic/subtopic format
- Link to related context across the tree for graph-like navigation
- Relations enable comprehensive context retrieval during queries
- **CRITICAL: Only add relations to context files that ALREADY EXIST in the context tree**
- Check the Context Tree Structure or message history to verify existence before adding a relation
- Do NOT create relations to memories that don't exist yet
- Example:
  ## Relations
  @code_style/error-handling
  @testing/integration-tests/api-tests
"#

template_string CurateGoodExamples() #"
## Efficient Tool Usage Patterns

**Pattern for SIMPLE content** (e.g., "API uses JWT with 15-min expiry"):
1. Identify relevant domain from Available Domains → ListTopics (in that domain) → find appropriate topic
2. ReadMemory (topic level) → attempt to read existing context.md
3. If ReadMemory succeeds: assess completeness → WriteMemory (update) OR Done
4. If ReadMemory fails (error): WriteMemory (create) → Done

**Pattern for COMPLEX content** (e.g., detailed architecture document):
1. Identify target domain from Available Domains → ListTopics → find appropriate topic
2. ReadMemory (topic level) → attempt to read existing overview
3. If needed, ListSubtopics → check for relevant subtopic organization
4. ReadMemory (subtopic level if relevant) → assess overlap/conflict
5. WriteMemory (create or update context.md at topic or subtopic level) → Done

**Pattern with SUBTOPICS** (when content needs sub-organization):
1. Navigate to domain and topic as usual
2. ReadMemory (topic level) → attempt to read topic-level context.md
3. If creating subtopic-specific content:
   - ListSubtopics → check existing subtopics
   - ReadMemory (subtopic level if relevant) → check existing content
   - WriteMemory with subtopic parameter
4. Note: Both topic and subtopic can have their own context.md files

**Example with both levels:**
General authentication info → code_style/authentication/context.md
Specific API auth tests → testing/integration-tests/api-tests/context.md

**Relations Example:**
When writing context about error handling in APIs:
1. Create/update: structure/api-design/context.md (topic level)
2. Check Context Tree Structure to verify which related contexts exist
3. Add Relations section with ONLY existing contexts:
   ## Relations
   @code_style/error-handling        # ✓ Exists in tree
   @testing/integration-tests        # ✓ Exists in tree
   @compliance/logging-requirements  # ✓ Exists in tree
   # Note: Do NOT add @structure/future-feature if it doesn't exist yet
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

function CurateContext(content: string, domainHint: string?, topicHint: string?, contextTreeStructure: string, messageHistory: AgentMessage[]) -> ListTopicsTool | ListSubtopicsTool | ReadMemoryTool | ReadFileTool | WriteMemoryTool | CurateDoneTool {
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
      Available domains: code_style, testing, structure

      context_tree/
      ├── code_style/
      │   └── error-handling/
      │       └── context.md
      ├── testing/
      │   └── integration-tests/
      │       └── context.md
      └── structure/
          └── api-design/
              └── context.md
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
    domainHint "compliance"
    topicHint "rate-limiting"
    contextTreeStructure #"
      Available domains: code_style, compliance, structure

      context_tree/
      ├── code_style/
      │   └── error-handling/
      │       └── context.md
      ├── compliance/
      │   └── rate-limiting/
      │       └── context.md
      └── structure/
          └── api-design/
              └── context.md
    "#
    messageHistory [
      {
        role: "user",
        message: #"
Tool: ListTopics
Input: {"domain": "compliance"}
Output:
Topics in compliance domain:
- rate-limiting
        "#
      }
    ]
  }
}

test test_curate_near_completion {
  functions [CurateContext]
  args {
    content "We use bcrypt with 12 salt rounds for password hashing. Minimum password length is 12 characters."
    domainHint "code_style"
    topicHint "authentication"
    contextTreeStructure #"
      Available domains: code_style, testing, compliance

      context_tree/
      ├── code_style/
      │   └── authentication/
      │       └── context.md
      ├── testing/
      │   └── integration-tests/
      │       └── context.md
      └── compliance/
          └── security/
              └── context.md
    "#
    messageHistory [
      {
        role: "user",
        message: #"
Tool: ListTopics
Input: {"domain": "code_style"}
Output:
Topics in code_style domain:
- authentication
        "#
      },
      {
        role: "user",
        message: #"
Tool: ReadMemory
Input: {"domain": "code_style", "topic": "authentication"}
Output:
# Authentication

## JWT Tokens
- Access token expiry: 15 minutes
- Refresh token expiry: 7 days
- Stored in httpOnly cookies

## OAuth Integration
- Supports Google and GitHub OAuth
- Uses passport.js library

## Relations
@compliance/security
@testing/integration-tests
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
    domainHint "code_style"
    topicHint "authentication"
    contextTreeStructure #"
      Available domains: code_style, testing, compliance

      context_tree/
      ├── code_style/
      │   └── authentication/
      │       └── context.md
      ├── testing/
      │   └── integration-tests/
      │       └── context.md
      └── compliance/
          └── security/
              └── context.md
    "#
    messageHistory [
      {
        role: "user",
        message: #"
Tool: ListTopics
Input: {"domain": "code_style"}
Output:
Topics in code_style domain:
- authentication
        "#
      },
      {
        role: "user",
        message: #"
Tool: ReadMemory
Input: {"domain": "code_style", "topic": "authentication"}
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

## Relations
@compliance/security
@testing/integration-tests
        "#
      }
    ]
  }
}

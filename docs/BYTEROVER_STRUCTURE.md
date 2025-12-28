# ByteRover-Inspired Context Tree Structure

## Overview

bitranger uses a hierarchical context tree structure inspired by [ByteRover](https://docs.byterover.dev/beta/context-tree/local-space-structure). This design enables efficient, organized knowledge management with graph-like navigation through relations.

## Core Concepts

### 1. Hierarchical Organization

The context tree is organized in a three-level hierarchy:

```
Domain → Topic → Subtopic (optional)
```

Each level serves a specific purpose:
- **Domains**: High-level categorical buckets
- **Topics**: Specialized subjects within domains
- **Subtopics**: Optional deeper organization (maximum 1 level)

### 2. Standardized Files: context.md

All knowledge is stored in files named `context.md`:
- Each **topic** has its own `context.md` (overview/general information)
- Each **subtopic** has its own `context.md` (specific details)

This standardization simplifies navigation and ensures consistency.

**Note:** The filename `context.md` is implicit and enforced at the tool layer. Agents work with domain/topic/subtopic organization only, without needing to specify the filename.

### 3. Relations: Graph-Like Navigation

Relations create explicit connections between context files using the `@domain/topic` or `@domain/topic/subtopic` notation. These enable:
- Graph-like traversal of related knowledge
- Comprehensive context gathering during queries
- Intentional knowledge connections (not similarity-based)

---

## Directory Structure

### Basic Structure

```
.bitranger/
├── code_style/                    # Domain
│   ├── error-handling/            # Topic
│   │   ├── context.md            # Topic-level overview
│   │   └── api-tests/            # Subtopic (optional)
│   │       └── context.md        # Subtopic-specific details
│   └── naming-conventions/
│       └── context.md
├── testing/
│   └── integration-tests/
│       ├── context.md            # General integration testing info
│       └── api-tests/
│           └── context.md        # Specific API test details
└── structure/
    └── api-design/
        └── context.md
```

### Complete Example

```
.bitranger/
├── code_style/
│   ├── error-handling/
│   │   ├── context.md
│   │   └── api-tests/
│   │       └── context.md
│   ├── naming-conventions/
│   │   └── context.md
│   └── authentication/
│       └── context.md
├── testing/
│   ├── unit-tests/
│   │   └── context.md
│   └── integration-tests/
│       ├── context.md
│       └── api-tests/
│           └── context.md
├── structure/
│   ├── api-design/
│   │   └── context.md
│   └── database-schema/
│       └── context.md
├── design/
│   ├── ui-patterns/
│   │   └── context.md
│   └── responsive-design/
│       └── context.md
├── compliance/
│   ├── security/
│   │   └── context.md
│   └── logging-requirements/
│       └── context.md
└── bug_fixes/
    └── known-issues/
        └── context.md
```

---

## Default Domains

bitranger uses six default domains inspired by ByteRover:

### 1. **code_style**
Coding standards, patterns, and conventions.

**Examples:**
- Error handling patterns
- Naming conventions
- API design patterns
- Authentication methods
- Async/await usage

### 2. **testing**
Testing strategies, patterns, and requirements.

**Examples:**
- Unit test patterns
- Integration test setup
- API testing approaches
- Test data management
- Mocking strategies

### 3. **structure**
Project architecture and organization.

**Examples:**
- API endpoint structure
- Database schema design
- Microservices architecture
- File organization
- Module boundaries

### 4. **design**
UI/UX and visual design patterns.

**Examples:**
- Component patterns
- Responsive design guidelines
- Color schemes
- Typography standards
- Accessibility requirements

### 5. **compliance**
Security, legal, and regulatory requirements.

**Examples:**
- Security policies
- Data privacy requirements
- Logging standards
- Rate limiting rules
- Audit requirements

### 6. **bug_fixes**
Solutions to known issues and problems.

**Examples:**
- Known issues and workarounds
- Bug fix documentation
- Performance issues
- Compatibility problems
- Edge case handling

---

## context.md File Structure

Every topic and subtopic in the context tree contains a standardized `context.md` file. Agents interact with these files using only the domain/topic/subtopic path - the filename is implicit.

### Basic Format

```markdown
# Topic Title

## Section 1
Content describing patterns, decisions, or knowledge...

## Section 2
More detailed information...

## Code Examples
```typescript
// Example code
```

## Relations
@domain/topic
@domain/topic/subtopic
```

### Example: Topic-Level context.md

**File:** `.bitranger/code_style/error-handling/context.md`

```markdown
# Error Handling

## General Approach
All API endpoints should use structured error responses with consistent format:
- HTTP status codes (400, 401, 403, 404, 500, etc.)
- JSON error objects with `error`, `message`, and `statusCode` fields

## Try-Catch Pattern
Always wrap async route handlers in try-catch blocks:

```typescript
app.get('/api/resource', async (req, res) => {
  try {
    const data = await fetchData();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'InternalServerError',
      message: error.message,
      statusCode: 500
    });
  }
});
```

## Custom Error Classes
Use custom error classes for different error types:
- ValidationError (400)
- AuthenticationError (401)
- ForbiddenError (403)
- NotFoundError (404)

## Relations
@structure/api-design
@testing/integration-tests/api-tests
@compliance/logging-requirements
```

### Example: Subtopic-Level context.md

**File:** `.bitranger/testing/integration-tests/api-tests/context.md`

```markdown
# API Integration Tests

## Test Structure
API tests are organized by endpoint in `tests/api/`:
- `auth.test.ts` - Authentication endpoints
- `users.test.ts` - User management
- `posts.test.ts` - Post CRUD operations

## Setup and Teardown
Each test suite uses:
- `beforeAll()` - Start test database
- `beforeEach()` - Reset database state
- `afterAll()` - Cleanup connections

## Example Test Pattern

```typescript
describe('POST /api/users', () => {
  it('should create user with valid data', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'Test User', email: 'test@example.com' });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  it('should return 400 for invalid email', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'Test', email: 'invalid' });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('ValidationError');
  });
});
```

## Test Database
Uses Docker container with PostgreSQL for isolation.

## Relations
@testing/integration-tests
@code_style/error-handling
@structure/api-design
```

---

## Relations: Graph-Like Navigation

### What Are Relations?

Relations are explicit links between context files that enable graph-like traversal of your knowledge base. They're defined in a `## Relations` section at the end of `context.md` files.

### Format

```markdown
## Relations
@domain/topic
@domain/topic/subtopic
```

**Examples:**
- `@code_style/error-handling` - Links to topic-level context
- `@testing/integration-tests/api-tests` - Links to subtopic-level context

### Why Use Relations?

1. **Comprehensive Context Retrieval**: Query agent follows relations to gather interconnected knowledge
2. **Explicit Connections**: Not based on similarity scores - these are intentional links
3. **Knowledge Graph**: Build a web of related information
4. **Prevent Silos**: Connect knowledge across different domains

### Example Usage

**Scenario:** You're documenting API authentication

**File:** `.bitranger/code_style/authentication/context.md`

```markdown
# Authentication

## JWT Implementation
- Access tokens: 15 minutes
- Refresh tokens: 7 days
- Stored in httpOnly cookies

## Relations
@compliance/security
@testing/integration-tests/api-tests
@structure/api-design
```

When querying "How does authentication work?", the agent:
1. Reads `code_style/authentication/context.md`
2. Sees relations to security compliance, API tests, and API design
3. Follows relevant relations to gather comprehensive context
4. Synthesizes answer from all connected sources

---

## Subtopics: When to Use Them

### Use Subtopics When:

1. **Natural Sub-Categories Exist**
   - Topic: `testing/integration-tests`
   - Subtopics: `api-tests`, `database-tests`, `ui-tests`

2. **Content Is Too Detailed for Topic Level**
   - Topic overview: General integration testing approach
   - Subtopic details: Specific API testing patterns

3. **Logical Grouping Within a Topic**
   - Topic: `code_style/error-handling`
   - Subtopics: `api-errors`, `client-errors`, `validation-errors`

### Don't Use Subtopics When:

1. **Content Fits Well at Topic Level**
   - Keep it simple if one `context.md` suffices

2. **Only One Subtopic Exists**
   - Just use the topic level instead

3. **Going Beyond 1 Level Deep**
   - Maximum depth is domain → topic → subtopic

### Best Practices

- **Topic-level context.md**: Overview, general patterns, common information
- **Subtopic-level context.md**: Specific implementations, detailed examples, edge cases
- Both levels can have relations to other parts of the tree

---

## Migration from Original bitranger

If you have an existing bitranger project with the old structure:

### Old Structure

```
.bitranger/
├── Architecture/
│   └── microservices/
│       ├── service-communication.md
│       └── deployment.md
├── API/
│   └── authentication/
│       └── jwt-implementation.md
└── Frontend/
    └── components/
        └── button-patterns.md
```

### New Structure

```
.bitranger/
├── structure/
│   └── microservices/
│       ├── context.md  # Combines overview
│       ├── communication/
│       │   └── context.md  # service-communication details
│       └── deployment/
│           └── context.md  # deployment details
├── code_style/
│   └── authentication/
│       └── context.md  # JWT implementation
└── design/
    └── components/
        └── context.md  # button patterns + relations
```

### Migration Steps

1. **Domain Mapping**: Map old domains to new ones
   - Architecture → structure
   - API → code_style (for patterns) or structure (for design)
   - Frontend → design or code_style

2. **File Consolidation**: Combine related files into `context.md`
3. **Add Relations**: Link related context across the tree
4. **Add Subtopics**: Use for deeper organization if needed

### Backward Compatibility

- Existing projects keep their domains automatically
- Only new `bitranger init` uses the new default domains
- Old filenames still work (agents read them)
- Agents create `context.md` going forward

---

## Best Practices

### 1. Curate Continuously
Add context as you make decisions:
```bash
bitranger curate "Decision: Using Redis for session storage because..."
```

### 2. Use Descriptive Topics
- ✅ Good: `code_style/error-handling`
- ❌ Bad: `stuff/things`

### 3. Add Relations Thoughtfully
Link to genuinely related context:
```markdown
## Relations
@testing/integration-tests/api-tests
@compliance/security
```

### 4. Organize by Meaning, Not Structure
- Domain represents **type of knowledge**
- Topic represents **subject matter**
- Subtopic represents **specific aspect**

### 5. Keep context.md Focused
- Topic level: Overview and patterns
- Subtopic level: Specific implementations
- Use relations to connect rather than duplicating content

---

## Comparison: Original vs ByteRover-Style

| Aspect | Original bitranger | ByteRover-Style |
|--------|-------------------|----------------|
| **Default Domains** | Architecture, API, Frontend | code_style, testing, structure, design, compliance, bug_fixes |
| **File Naming** | Custom (e.g., `jwt-auth.md`) | Standardized (`context.md` everywhere) |
| **Subtopics** | Not supported | Supported (1 level deep) |
| **Relations** | Not supported | Supported (`@domain/topic/subtopic`) |
| **Topic Structure** | Files only | Topic has `context.md` + optional subtopics |
| **Navigation** | Flat within topic | Hierarchical with graph-like relations |

---

## Summary

The ByteRover-inspired structure provides:
- ✅ Clear hierarchical organization
- ✅ Standardized `context.md` files
- ✅ Optional subtopics for deeper organization
- ✅ Relations for graph-like knowledge navigation
- ✅ Six default domains covering common needs
- ✅ Backward compatibility with existing projects

This design makes your context tree more organized, discoverable, and powerful for both human browsing and AI agent retrieval.


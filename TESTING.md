# Testing bitranger CLI

## Setup

### 1. Install Dependencies & Generate BAML Client
```bash
cd /Users/sanjandas/Projects/bitranger
npm install
npm run generate:baml  # Generates TypeScript BAML client
```

### 2. Set Up API Keys
```bash
cp env.example .env
# Edit .env and add your API keys
```

### 3. Build the CLI
```bash
npm run build
```

## Local Testing

### Test in Sample Project
```bash
# Create test directory
mkdir /tmp/test-bitranger
cd /tmp/test-bitranger

# Test commands
node /Users/sanjandas/Projects/bitranger/dist/cli.js init
node /Users/sanjandas/Projects/bitranger/dist/cli.js status
node /Users/sanjandas/Projects/bitranger/dist/cli.js curate "Our API uses JWT with 15-min expiry"
node /Users/sanjandas/Projects/bitranger/dist/cli.js query "authentication flow"
```

### Install Globally (Optional)
```bash
cd /Users/sanjandas/Projects/bitranger
npm link  # or: npm install -g .
bitranger --help
```

## Command Examples

### Initialize
```bash
bitranger init
```

### Add Context
```bash
# Basic curation
bitranger curate "Our API uses JWT with 15-min expiry"

# With verbose logging
bitranger curate "Our API uses JWT with 15-min expiry" --verbose

# With domain hint
bitranger curate "Redis caching strategy" --domain Infrastructure
```

### Query Context
```bash
# Basic query
bitranger query "authentication flow"

# With verbose logging
bitranger query "authentication" --verbose
```

### Generate Agent Rules
```bash
bitranger gen-rules
```

### Check Status
```bash
# Basic status
bitranger status

# With tree structure
bitranger status --verbose
```

## Development Workflow

```bash
# Make changes to TypeScript
npm run dev  # Watch mode

# Update BAML agents
# Edit baml_src/*.baml
npm run generate:baml
npm run build

# Test changes
node dist/cli.js <command>
```

## Debugging

### Verbose Logging
Use `--verbose` flag to see:
- Token usage (input/output/total)
- Timing information
- Raw LLM responses
- Agent decisions in real-time

```bash
bitranger curate "content" --verbose
bitranger query "query" --verbose
```

### BAML Trace Logging
For even more detailed BAML internal logging:
```bash
BAML_LOG=trace node dist/cli.js curate "content" --verbose
```

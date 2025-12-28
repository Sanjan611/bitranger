#!/bin/bash

# bitranger setup script
# This script helps set up the project for development or first-time build

set -e

echo "🚀 Setting up bitranger..."
echo ""

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 24 ]; then
  echo "⚠️  Warning: Node.js 24+ is required. You have Node $(node -v)"
  echo "   Please upgrade Node.js: https://nodejs.org/"
  exit 1
fi

echo "✓ Node.js version check passed ($(node -v))"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Generate BAML client
echo ""
echo "🤖 Generating BAML TypeScript client..."
if ! npm run generate:baml; then
  echo ""
  echo "⚠️  BAML generation failed. This is expected if @boundaryml/baml is not installed."
  echo "   You may need to install the BAML CLI:"
  echo "   npm install -g @boundaryml/baml"
  echo ""
  echo "   After installing, run: npm run generate:baml"
  echo ""
fi

# Build TypeScript
echo ""
echo "🔨 Building TypeScript..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Set up your API keys in .env file:"
echo "     echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env"
echo "     echo 'OPENAI_API_KEY=sk-...' >> .env"
echo ""
echo "  2. Test the CLI:"
echo "     node dist/cli.js --help"
echo ""
echo "  3. Try it in a test directory:"
echo "     cd /tmp/test-project"
echo "     node $(pwd)/dist/cli.js init"
echo ""



#!/bin/bash
# Installer for opencode-roadmap-plugin
# Copies agents and commands to opencode config directory.

set -e

TARGET_BASE="${OPENCODE_CONFIG:-$HOME/.config/opencode}"
SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "================================================"
echo "  opencode-roadmap-plugin installer"
echo "================================================"
echo "Source: $SOURCE_DIR"
echo "Target: $TARGET_BASE"
echo ""

# Create target directories
mkdir -p "$TARGET_BASE/agents" "$TARGET_BASE/commands"

# Copy agents
echo "[install] Copying agents..."
for f in "$SOURCE_DIR"/agents/*.md; do
  name=$(basename "$f")
  cp "$f" "$TARGET_BASE/agents/$name"
  echo "  ✓ agents/$name"
done

# Copy command
echo "[install] Copying commands..."
cp "$SOURCE_DIR/commands/roadmap.md" "$TARGET_BASE/commands/roadmap.md"
echo "  ✓ commands/roadmap.md"

# Suggest config
echo ""
echo "[install] Done."
echo ""
echo "Next steps:"
echo ""
echo "1. Configure context7 MCP and your model in opencode config:"
echo "   See $SOURCE_DIR/opencode.json.example"
echo ""
echo "2. (Optional) Set MINIMAX_API_KEY env var if using MiniMax:"
echo "   export MINIMAX_API_KEY=your_key_here"
echo ""
echo "3. Open opencode in any project directory and run:"
echo "   /roadmap"
echo ""
echo "4. (Optional) Skip competitor analysis:"
echo "   /roadmap --no-competitor"
echo ""

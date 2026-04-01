#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"

# Requires: Docker (for Structurizr CLI) + D2 CLI
# This is a LOCAL-ONLY script. Vercel builds use pre-committed SVGs.

command -v docker >/dev/null 2>&1 || { echo "❌ Docker required for Structurizr CLI export"; exit 1; }
command -v d2 >/dev/null 2>&1 || { echo "❌ D2 CLI required (brew install d2)"; exit 1; }

echo "=== Exporting DSL → D2 ==="
mkdir -p "$ROOT/diagrams/d2" "$ROOT/public/diagrams"

docker run --rm \
  -v "$ROOT/structurizr:/usr/local/structurizr" \
  -v "$ROOT/diagrams/d2:/output" \
  structurizr/cli export \
  -workspace /usr/local/structurizr/workspace.dsl \
  -format d2 \
  -output /output

echo "✅ Structurizr export completed"

echo "=== Rendering D2 → SVG ==="
shopt -s nullglob
d2_files=("$ROOT/diagrams/d2"/*.d2)

if [ "${#d2_files[@]}" -eq 0 ]; then
  echo "❌ No D2 files found in diagrams/d2/ — Structurizr export may have failed"
  exit 1
fi

for d2file in "${d2_files[@]}"; do
  name="$(basename "$d2file" .d2)"
  d2 "$d2file" "$ROOT/public/diagrams/$name.svg" --theme 200 --layout elk 2>/dev/null || \
    d2 "$d2file" "$ROOT/public/diagrams/$name.svg" --theme 200
  echo "  ✅ $name.svg"
done

echo "✅ All diagrams exported to public/diagrams/"
echo ""
echo "Remember to commit the updated SVGs before pushing:"
echo "  git add public/diagrams/ && git commit -m 'chore: update architecture diagrams'"

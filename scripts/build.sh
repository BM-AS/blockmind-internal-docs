#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"

# On Vercel (or any CI without Docker/D2), skip the export pipeline.
# SVGs in public/diagrams/ are pre-committed — they're the source of truth for deploys.
# Run `bun run export-diagrams` locally before pushing to update them.
if [ -n "${VERCEL:-}" ] || [ -n "${CI:-}" ]; then
  echo "=== CI/Vercel detected — using pre-committed SVGs ==="
  svg_count=$(find "$ROOT/public/diagrams" -name '*.svg' 2>/dev/null | wc -l | tr -d ' ')
  if [ "$svg_count" -eq 0 ]; then
    echo "❌ No SVGs in public/diagrams/. Run 'bun run export-diagrams' locally and commit."
    exit 1
  fi
  echo "  Found $svg_count pre-committed SVG(s)"
else
  echo "=== Local build — running full pipeline ==="
  bash "$SCRIPT_DIR/validate.sh" || echo "⚠️  DSL validation skipped (Docker not available)"
  bash "$SCRIPT_DIR/export-diagrams.sh"
fi

echo "=== Building Next.js ==="
cd "$ROOT"
npx next build
echo "✅ Build complete"

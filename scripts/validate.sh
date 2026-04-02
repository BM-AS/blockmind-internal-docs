#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT"

bun scripts/validate-architecture.ts

echo "=== Validating Structurizr DSL ==="
if command -v docker >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then
    docker run --rm -v "$PWD/structurizr:/usr/local/structurizr" \
      structurizr/cli validate -workspace /usr/local/structurizr/workspace.dsl
    echo "✅ DSL valid"
  else
    echo "⚠️  Docker is installed but not accessible; skipping Structurizr CLI validation"
  fi
else
  echo "⚠️  Docker not available; skipping Structurizr CLI validation"
fi

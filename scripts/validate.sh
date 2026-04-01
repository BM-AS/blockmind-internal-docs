#!/bin/bash
set -euo pipefail

echo "=== Validating Structurizr DSL ==="
docker run --rm -v "$PWD/structurizr:/usr/local/structurizr" \
  structurizr/cli validate -workspace /usr/local/structurizr/workspace.dsl
echo "✅ DSL valid"

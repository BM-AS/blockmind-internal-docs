# Structurizr workspace

`workspace.dsl` is the canonical C4 model for the BlockMind internal docs site.

## Local validation

```bash
bash scripts/validate.sh
```

## Local export

```bash
bash scripts/export-diagrams.sh
```

The export pipeline uses the Structurizr CLI in Docker to produce D2 files, then renders SVGs with the local `d2` CLI.

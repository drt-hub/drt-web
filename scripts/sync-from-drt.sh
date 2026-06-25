#!/usr/bin/env bash
# Regenerate the site's generated inputs from drt-hub/drt — the single source
# of truth. Run by .github/workflows/sync-from-drt.yml; safe to run locally.
set -euo pipefail

python -m pip install --quiet --upgrade drt-core

mkdir -p data

# Connector matrix — straight from drt's own CLI, so the site can't drift.
# Shape: {"connectors": [{"type","display_name","kind"}, ...]}
drt destinations --format json > data/destinations.json
drt sources --format json      > data/sources.json

# Live version badge input.
python - <<'PY' > data/version.txt
import importlib.metadata as m
print(m.version("drt-core"))
PY

# Docs — pulled from the repo so they stay a *view* of drt, never a copy.
# Shallow full clone (drt is small); simpler + more robust than sparse-checkout,
# which trips on mixing a directory (docs) and a file (README.md) in cone mode.
rm -rf .drt-src synced-docs
git clone --depth 1 https://github.com/drt-hub/drt .drt-src
mkdir -p synced-docs
cp -r .drt-src/docs/. synced-docs/
cp .drt-src/README.md synced-docs/README.md
rm -rf .drt-src

dest_count=$(python -c "import json;print(len(json.load(open('data/destinations.json'))['connectors']))")
src_count=$(python -c "import json;print(len(json.load(open('data/sources.json'))['connectors']))")
echo "Synced: ${dest_count} destinations, ${src_count} sources, drt-core $(cat data/version.txt)"

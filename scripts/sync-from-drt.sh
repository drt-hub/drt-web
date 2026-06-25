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
rm -rf .drt-src synced-docs
git clone --depth 1 --filter=blob:none --sparse https://github.com/drt-hub/drt .drt-src
git -C .drt-src sparse-checkout set docs README.md
mkdir -p synced-docs
cp -r .drt-src/docs/. synced-docs/
cp .drt-src/README.md synced-docs/README.md
rm -rf .drt-src

dest_count=$(python -c "import json;print(len(json.load(open('data/destinations.json'))['connectors']))")
src_count=$(python -c "import json;print(len(json.load(open('data/sources.json'))['connectors']))")
echo "Synced: ${dest_count} destinations, ${src_count} sources, drt-core $(cat data/version.txt)"

#!/usr/bin/env bash
# Regenerate the site's generated inputs from drt-hub/drt — the single source
# of truth. Run by .github/workflows/sync-from-drt.yml; safe to run locally.
set -euo pipefail

python -m pip install --quiet --upgrade "drt-core[docs]"

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

# Live demo — a real `drt docs generate --format html` site, served verbatim
# from static/demo/docs/ at /demo/docs/. This is the site's own showcase: the
# lineage catalog a user gets by running one command. Generated from the
# in-repo docs-demo fixture (offline — no warehouse connection needed).
# The run state is seeded to a clean "mostly success, one partial" shape so the
# demo reads as a healthy project surfacing one issue, not a broken one.
if [ -d .drt-src/examples/docs-demo ]; then
  demo_src=".drt-src/examples/docs-demo"
  python - "$demo_src/.drt/state.json" <<'PY'
import json, sys, pathlib
p = pathlib.Path(sys.argv[1])
if p.exists():
    d = json.loads(p.read_text())
    for name, row in d.items():
        row["status"] = "partial" if name == "errors_to_slack" else "success"
        if row.get("error") and row["status"] == "success":
            row["error"] = None
    p.write_text(json.dumps(d, indent=2))
PY
  rm -rf static/demo/docs
  mkdir -p static/demo
  ( cd "$demo_src" && drt docs generate --format html --output "$OLDPWD/static/demo/docs" )
  echo "Generated live demo docs → static/demo/docs/ ($(find static/demo/docs -name '*.html' | wc -l | tr -d ' ') pages)"
fi

rm -rf .drt-src

dest_count=$(python -c "import json;print(len(json.load(open('data/destinations.json'))['connectors']))")
src_count=$(python -c "import json;print(len(json.load(open('data/sources.json'))['connectors']))")
echo "Synced: ${dest_count} destinations, ${src_count} sources, drt-core $(cat data/version.txt)"

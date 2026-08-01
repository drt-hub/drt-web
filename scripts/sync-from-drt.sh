#!/usr/bin/env bash
# Regenerate the site's generated inputs from drt-hub/drt — the single source
# of truth. Run by .github/workflows/sync-from-drt.yml; safe to run locally.
set -euo pipefail

# `click` and `typer` are pinned rather than left to resolve transitively,
# because the CLI reference generator's output depends on both.
#
# `click`: Typer >= 0.16 vendors Click as `typer._click` and no longer declares
# the real package as a dependency, so `drt-core[docs]` alone leaves
# `import click` failing outright — that is what broke run 30555942117.
#
# `typer`: drt asks only for `typer>=0.12`, and the rendering of parameter
# metavars changed between 0.24 and 0.27 (`SYNC_NAME` / `INTEGER` became
# `{sync_name}` / `<int>`). Unpinned, a sync run would silently rewrite 21 of
# the 34 generated pages with no drt-side change behind it, and the diff would
# look like a real docs update. The pin keeps the pages a function of drt
# rather than of whichever Typer the runner happened to resolve; bump it
# deliberately when the rendering change is wanted.
python -m pip install --quiet --upgrade "drt-core[docs]" "click>=8.3,<9" "typer>=0.24,<0.25"

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

# CLI reference — one page per command, walked off the installed CLI's command
# tree, so a new drt command shows up here without touching the generator.
# Written after the copy above, which recreates synced-docs/ from scratch.
python scripts/gen-cli-reference.py --output synced-docs/cli

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

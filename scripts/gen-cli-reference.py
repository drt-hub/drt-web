#!/usr/bin/env python3
"""Generate the CLI reference from the *installed* drt package.

Run by scripts/sync-from-drt.sh; safe to run locally once drt-core is installed.

Two things make this drift-proof:

* The command tree is discovered from the `drt` console-script entry point, so
  a new command appears here with no change to this file, and the published
  reference always describes the release that was pip-installed rather than
  whatever is on main.
* Pages are built from the Click objects, not from `drt --help` output. Rich is
  never invoked, so no ANSI escapes or box-drawing characters can reach the
  Markdown, and the wording does not depend on the terminal width CI happens to
  report.
"""
from __future__ import annotations

import argparse
import importlib.metadata as md
import inspect
import re
import shutil
import sys
from pathlib import Path, PurePath

# Click is not necessarily importable as a top-level module. Typer >= 0.16
# vendors it as ``typer._click`` and no longer declares ``click`` as a
# dependency, so `pip install drt-core[docs]` leaves `import click` failing
# while the CLI itself works fine. Prefer the real package when something else
# has pulled it in, and fall back to Typer's copy — the objects are the same
# classes either way, since Typer builds its command tree out of them.
try:
    import click
except ModuleNotFoundError:  # pragma: no cover - depends on the installed Typer
    try:
        from typer import _click as click  # type: ignore[no-redef]
    except ImportError:
        sys.exit(
            "neither 'click' nor 'typer._click' is importable — "
            "install drt-core[docs] (or click) before running this generator"
        )

ENTRY_POINT = "drt"
ANSI_RE = re.compile(r"\x1b\[[0-9;]*[A-Za-z]")


def load_root_command() -> click.Command:
    """Resolve the installed CLI's root command without hardcoding its module."""
    eps = [e for e in md.entry_points().select(group="console_scripts") if e.name == ENTRY_POINT]
    if not eps:
        sys.exit(f"no '{ENTRY_POINT}' console script found — is drt-core installed?")
    obj = eps[0].load()

    # Duck-typed rather than isinstance(obj, click.BaseCommand): that name is
    # absent from Typer's vendored Click, and `invoke` is what actually
    # distinguishes a Click command from a Typer app here.
    if hasattr(obj, "invoke") and hasattr(obj, "params"):
        return obj
    # Typer app: convert to the underlying Click command tree.
    try:
        import typer.main
    except ImportError:  # pragma: no cover - drt ships Typer today
        sys.exit(f"'{ENTRY_POINT}' entry point is not a Click command and Typer is unavailable")
    return typer.main.get_command(obj)


def walk(cmd: click.Command, path: tuple[str, ...] = ()) -> list[tuple[tuple[str, ...], click.Command]]:
    """Depth-first list of (command path, command), skipping hidden commands."""
    found = [(path, cmd)]
    # `commands` is what makes a group a group; click.Group is not exposed
    # by Typer's vendored Click.
    if getattr(cmd, "commands", None):
        for name in sorted(cmd.commands):
            sub = cmd.commands[name]
            if getattr(sub, "hidden", False):
                continue
            found.extend(walk(sub, path + (name,)))
    return found


def escape(text: str) -> str:
    """Make CLI prose safe to drop into Markdown.

    Help text is plain text, so `<pattern>` and `--vars {a: 1}` are literals. In
    CommonMark the angle brackets would be swallowed as an unknown HTML tag, so
    they are entity-escaped. Braces are left alone: these pages are rendered as
    CommonMark rather than MDX precisely so they stay literal.
    """
    return text.replace("<", "&lt;").replace(">", "&gt;")


def cell(text: str | None) -> str:
    """Flatten to a single Markdown table cell."""
    if not text:
        return ""
    return escape(" ".join(text.split())).replace("|", "\\|")


def describe(cmd: click.Command) -> list[str]:
    """Help text as Markdown blocks.

    Click help routinely ends with an indented `Examples:` block. Left as prose
    those lines reflow into an unreadable run-on, so any paragraph that is
    wholly indented becomes a fenced block instead.
    """
    text = inspect.cleandoc(cmd.help or "").replace("\f", "").strip()
    if not text:
        return []

    blocks: list[str] = []
    prose: list[str] = []
    code: list[str] = []

    def flush_prose() -> None:
        if prose:
            blocks.extend([escape("\n".join(prose).strip()), ""])
            prose.clear()

    def flush_code() -> None:
        while code and not code[-1].strip():
            code.pop()
        if code:
            # Unlabelled: an indented block in help text may be commands, JSON
            # or sample output, and guessing wrong mislabels the snippet.
            blocks.extend(["```", inspect.cleandoc("\n".join(code)).rstrip(), "```", ""])
            code.clear()

    for line in text.splitlines():
        indented = line.startswith((" ", "\t")) and line.strip()
        if indented:
            flush_prose()
            code.append(line)
        elif not line.strip():
            # A blank line inside an indented run keeps the block together.
            (code if code else prose).append(line)
        else:
            flush_code()
            prose.append(line)
    flush_code()
    flush_prose()
    return blocks


def param_rows(cmd: click.Command, ctx: click.Context) -> tuple[list[str], list[str]]:
    """Markdown rows for the command's arguments and options."""
    args, opts = [], []
    for p in cmd.params:
        if getattr(p, "hidden", False):
            continue
        try:
            metavar = p.make_metavar(ctx)  # click >= 8.2
        except TypeError:
            metavar = p.make_metavar()

        # Positional arguments have no dashed opts; click.Argument is not
        # exposed by Typer's vendored Click.
        if not any(o.startswith("-") for o in getattr(p, "opts", [])):
            args.append(f"| `{cell(metavar)}` | {'yes' if p.required else 'no'} | {cell(getattr(p, 'help', None))} |")
            continue

        flags = ", ".join(f"`{o}`" for o in (*p.opts, *p.secondary_opts))
        default = ""
        if not p.required and p.default is not None and p.default is not False and p.default != ():
            # `Path` defaults stringify with the *generating* OS's separator, so
            # a run on Windows publishes `.github\workflows\drt-sync.yml` while
            # one on Linux publishes the same default with forward slashes. The
            # CLI accepts forward slashes everywhere and the site is read on all
            # platforms, so normalise rather than let the runner decide.
            raw = p.default
            shown = raw.as_posix() if isinstance(raw, PurePath) else str(raw)
            default = f"`{cell(shown)}`"
        opts.append(f"| {flags} | `{cell(metavar)}` | {default} | {cell(getattr(p, 'help', None))} |")
    return args, opts


def render(path: tuple[str, ...], cmd: click.Command, position: int) -> str:
    """One Markdown page for one command.

    ``sidebar_position`` is a running depth-first index, which means inserting
    one command upstream renumbers every page after it — a one-command change
    arrives as a 34-file diff. That is a real cost and it was worth trying to
    remove, but dropping the key is not the fix: Docusaurus then orders
    unpositioned docs by *filename including the extension*, and ``-`` (0x2D)
    sorts before ``.`` (0x2E), so ``cloud-push.md`` precedes ``cloud.md`` and
    every group page lands after its own children. Verified against a real
    build. Fixing it properly means nested directories mirroring the command
    tree, or a separator that sorts after ``.`` — both change published URLs.
    """
    full = " ".join(("drt", *path))
    ctx = click.Context(cmd, info_name=full)

    front = [
        "---",
        f"id: {'-'.join(path) if path else 'overview'}",
        f"title: {full}",
        f"sidebar_label: {' '.join(path) if path else 'Overview'}",
        f"sidebar_position: {position}",
        "---",
        "",
        "<!-- Generated by scripts/gen-cli-reference.py - do not edit by hand. -->",
        "",
    ]

    body: list[str] = []
    if getattr(cmd, "deprecated", False):
        body += [":::warning", "This command is deprecated.", ":::", ""]

    body += describe(cmd)

    usage = " ".join(cmd.collect_usage_pieces(ctx))
    body += ["## Usage", "", "```bash", f"{full} {usage}".strip(), "```", ""]

    if getattr(cmd, "commands", None):
        rows = []
        for name in sorted(cmd.commands):
            sub = cmd.commands[name]
            if getattr(sub, "hidden", False):
                continue
            slug = "-".join((*path, name))
            rows.append(f"| [`{name}`]({slug}.md) | {cell(sub.get_short_help_str(200))} |")
        if rows:
            body += ["## Commands", "", "| Command | Description |", "| --- | --- |", *rows, ""]

    args, opts = param_rows(cmd, ctx)
    if args:
        body += ["## Arguments", "", "| Argument | Required | Description |", "| --- | --- | --- |", *args, ""]
    if opts:
        body += ["## Options", "", "| Option | Type | Default | Description |", "| --- | --- | --- | --- |", *opts, ""]

    if cmd.epilog:
        body += [escape(inspect.cleandoc(cmd.epilog)), ""]

    return "\n".join(front + body).rstrip() + "\n"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--output", required=True, type=Path, help="directory to write the reference into")
    args = ap.parse_args()

    root = load_root_command()
    commands = walk(root)

    out: Path = args.output
    # Rebuilt from scratch so a command removed upstream disappears here too.
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)

    for position, (path, cmd) in enumerate(commands):
        page = render(path, cmd, position)
        if ANSI_RE.search(page):  # belt and braces: Rich is never invoked above
            sys.exit(f"ANSI escape leaked into {' '.join(path) or 'overview'}")
        name = ("-".join(path) if path else "overview") + ".md"
        # Explicit encoding/newline: CI is Linux, contributors may be on Windows.
        (out / name).write_text(page, encoding="utf-8", newline="\n")

    version = md.version("drt-core")
    # ASCII only: this also runs on Windows consoles that default to cp1252.
    print(f"Generated CLI reference -> {out}/ ({len(commands)} pages, drt-core {version})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

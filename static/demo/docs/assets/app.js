// drt docs — tiny runtime: sidebar <details> persistence + client-side search.
// No framework; reads the inlined #drt-data JSON. Safe on file://.
(function () {
  "use strict";
  var KEY = "drt-docs-open-groups";

  // Persist which sidebar groups are open across pages.
  function restoreGroups() {
    var saved;
    try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { saved = {}; }
    document.querySelectorAll("details.group").forEach(function (d) {
      var id = d.getAttribute("data-group");
      if (id && saved.hasOwnProperty(id)) { d.open = !!saved[id]; }
      d.addEventListener("toggle", function () {
        try {
          var cur = JSON.parse(localStorage.getItem(KEY) || "{}");
          cur[id] = d.open;
          localStorage.setItem(KEY, JSON.stringify(cur));
        } catch (e) { /* ignore */ }
      });
    });
  }

  // Filter sidebar links by text.
  function wireSearch() {
    var input = document.getElementById("drt-search");
    if (!input) return;
    var sidebar = document.querySelector(".sidebar");
    var emptyMsg = null;
    if (sidebar) {
      emptyMsg = document.createElement("div");
      emptyMsg.className = "search-empty";
      emptyMsg.textContent = "No matches";
      emptyMsg.hidden = true;
      sidebar.appendChild(emptyMsg);
    }
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      var visible = 0;
      document.querySelectorAll(".sidebar li").forEach(function (li) {
        var a = li.querySelector("a");
        var hit = !q || (a && a.textContent.toLowerCase().indexOf(q) !== -1);
        li.style.display = hit ? "" : "none";
        if (hit) visible += 1;
      });
      if (emptyMsg) emptyMsg.hidden = !q || visible > 0;
    });
  }

  // Tabs — progressive enhancement. Without JS the panels render stacked
  // with their headings; with JS the .js class hides inactive panels.
  function wireTabs() {
    document.querySelectorAll(".tabs").forEach(function (group) {
      var buttons = group.querySelectorAll(".tab-btn");
      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var target = btn.getAttribute("data-tab");
          buttons.forEach(function (b) {
            b.classList.toggle("active", b === btn);
            b.setAttribute("aria-selected", b === btn ? "true" : "false");
          });
          group.parentElement.querySelectorAll(".tab-panel").forEach(function (p) {
            p.classList.toggle("active", p.getAttribute("data-tab") === target);
          });
        });
      });
    });
  }

  // Code blocks — copy button + long-file collapse (JS-only affordances;
  // without JS the full text renders and the buttons stay hidden).
  function wireCode() {
    document.querySelectorAll(".codeblock").forEach(function (block) {
      var copy = block.querySelector(".copy-btn");
      if (copy) {
        copy.addEventListener("click", function () {
          var code = block.querySelector("td.code pre") || block.querySelector(".codebody pre");
          var text = code ? code.textContent : "";
          function done() {
            copy.textContent = "Copied!";
            setTimeout(function () { copy.textContent = "Copy"; }, 1500);
          }
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function () {});
          }
        });
      }
      var expand = block.querySelector(".expand-btn");
      if (expand) {
        expand.addEventListener("click", function () { block.classList.add("open"); });
      }
    });
  }

  // Single-object bundle router (#821). The whole site is one document of
  // <section class="page" id="..."> blocks; show the one matching location.hash
  // (default overview), hide the rest, and highlight its nav link. No-op in the
  // default multi-file output (no .page sections), so this is safe in both modes.
  function wireRouter() {
    var pages = document.querySelectorAll(".main > .page");
    if (!pages.length) return;
    function show() {
      var id = (location.hash || "").replace(/^#/, "") || "overview";
      var target = document.getElementById(id);
      if (!target || !target.classList.contains("page")) {
        id = "overview";
        target = document.getElementById("overview");
      }
      pages.forEach(function (p) { p.classList.toggle("active", p === target); });
      document.querySelectorAll(".sidebar a, .topnav a").forEach(function (a) {
        a.classList.toggle("current", a.getAttribute("href") === "#" + id);
      });
      window.scrollTo(0, 0);
    }
    window.addEventListener("hashchange", show);
    show();
  }

  document.documentElement.classList.add("js");
  document.addEventListener("DOMContentLoaded", function () {
    restoreGroups();
    wireSearch();
    wireTabs();
    wireCode();
    wireRouter();
  });
})();

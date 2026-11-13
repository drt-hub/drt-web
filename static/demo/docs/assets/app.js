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

  // Filter the overview sync table in scale mode; elsewhere filter sidebar links.
  function wireSearch() {
    var input = document.getElementById("drt-search");
    if (!input) return;
    var scaleRoot = input.closest("[data-scale-filter-root]");
    var sidebar = document.querySelector(".sidebar");
    if (scaleRoot) {
      var emptyMsg = document.querySelector("[data-scale-empty]");
      var panel = scaleRoot.querySelector(".scale-filter-panel");
      var owner = scaleRoot.querySelector("[data-scale-owner]");
      var maturity = scaleRoot.querySelector("[data-scale-maturity]");
      var tag = scaleRoot.querySelector("[data-scale-tag]");
      var result = scaleRoot.querySelector(".scale-filter-result");
      var clear = scaleRoot.querySelector(".scale-filter-clear");
      var suppressPanelOpen = false;
      var escaping = false;
      function openPanel() {
        if (suppressPanelOpen) return;
        panel.hidden = false;
        input.setAttribute("aria-expanded", "true");
      }
      function applyScaleFilters() {
        var q = input.value.trim().toLowerCase();
        var ownerValue = owner.value;
        var maturityValue = maturity.value;
        var tagValue = tag.value;
        var visible = 0;
        document.querySelectorAll(".overview-sync-table [data-scale-sync]").forEach(function (row) {
          var tags = JSON.parse(row.getAttribute("data-tags") || "[]");
          var hit = (!q || (row.getAttribute("data-search") || "").indexOf(q) !== -1) &&
            (!ownerValue || row.getAttribute("data-owner") === ownerValue) &&
            (!maturityValue || row.getAttribute("data-maturity") === maturityValue) &&
            (!tagValue || tags.indexOf(tagValue) !== -1);
          row.hidden = !hit;
          if (hit) visible += 1;
        });
        result.textContent = visible + (visible === 1 ? " sync" : " syncs");
        if (emptyMsg) emptyMsg.hidden = visible > 0;
      }
      input.addEventListener("focus", openPanel);
      input.addEventListener("input", function () {
        // A search input's native Escape clears its value and fires `input` right after the
        // keydown; that must not reopen the panel the same Escape just closed.
        if (!escaping) openPanel();
        applyScaleFilters();
      });
      [owner, maturity, tag].forEach(function (select) {
        select.addEventListener("change", applyScaleFilters);
      });
      clear.addEventListener("click", function () {
        input.value = "";
        owner.value = "";
        maturity.value = "";
        tag.value = "";
        applyScaleFilters();
        input.focus();
      });
      scaleRoot.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          panel.hidden = true;
          input.setAttribute("aria-expanded", "false");
          suppressPanelOpen = true;
          escaping = true;
          setTimeout(function () { escaping = false; }, 0);
          input.focus();
          suppressPanelOpen = false;
        }
      });
      applyScaleFilters();
      return;
    }
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
      var scaleRoot = document.querySelector("[data-scale-filter-root]");
      if (scaleRoot) scaleRoot.hidden = id !== "overview";
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

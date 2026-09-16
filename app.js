(function () {
  "use strict";

  const state = {
    stops: [],
    plan: null,
    tips: null,
    map: null,
    current: 0,
    checked: {}, // stopId -> array of checked indices
  };

  const LS_KEY = "alhambra-guide-v1";

  function loadLocal() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state.current = parsed.current || 0;
        state.checked = parsed.checked || {};
      }
    } catch (e) {}
  }

  function saveLocal() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ current: state.current, checked: state.checked }));
    } catch (e) {}
  }

  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1600);
  }

  async function loadData() {
    const [stops, plan, tips, map] = await Promise.all([
      fetch("data/stops.json").then((r) => r.json()),
      fetch("data/plan.json").then((r) => r.json()),
      fetch("data/tips.json").then((r) => r.json()),
      fetch("data/map.json").then((r) => r.json()),
    ]);
    state.stops = stops.sort((a, b) => a.order - b.order);
    state.plan = plan;
    state.tips = tips;
    state.map = map;
  }

  function renderRail() {
    const rail = document.getElementById("progress-rail");
    rail.innerHTML = "";
    state.stops.forEach((stop, i) => {
      const dot = document.createElement("button");
      dot.className = "rail-dot";
      if (i === state.current) dot.classList.add("current");
      else if (i < state.current) dot.classList.add("done");
      dot.textContent = stop.order;
      dot.setAttribute("aria-label", stop.name_en);
      dot.addEventListener("click", () => goTo(i));
      rail.appendChild(dot);
    });
  }

  function renderStop() {
    const stop = state.stops[state.current];
    const el = document.getElementById("stop-content");
    if (!stop) {
      el.innerHTML = "<p>No stop data.</p>";
      return;
    }

    const checkedSet = new Set(state.checked[stop.id] || []);

    const photosHtml = (stop.photos || [])
      .map(
        (p) => `
        <div class="photo-card">
          <img src="${p.src}" alt="${escapeHtml(p.caption || stop.name_en)}" loading="lazy">
          <div class="photo-cap">${escapeHtml(p.caption || "")}${p.credit ? " · " + escapeHtml(p.credit) : ""}</div>
        </div>`
      )
      .join("");

    const archHtml = Array.isArray(stop.architecture)
      ? "<ul>" + stop.architecture.map((a) => `<li>${escapeHtml(a)}</li>`).join("") + "</ul>"
      : `<p>${escapeHtml(stop.architecture || "")}</p>`;

    const lookForHtml =
      "<ul class='checklist'>" +
      (stop.look_for || [])
        .map((item, idx) => {
          const isChecked = checkedSet.has(idx);
          return `<li class="${isChecked ? "checked" : ""}" data-idx="${idx}">
            <input type="checkbox" ${isChecked ? "checked" : ""}>
            <span>${escapeHtml(item)}</span>
          </li>`;
        })
        .join("") +
      "</ul>";

    const statusPill =
      stop.status === "closed"
        ? `<span class="pill pill-closed">🔴 Closed</span>`
        : stop.status === "partial"
        ? `<span class="pill pill-partial">⚠️ Partly obscured</span>`
        : "";

    const statusBanner = stop.status_note
      ? `<div class="status-banner ${stop.status === "closed" ? "banner-closed" : "banner-partial"}">${escapeHtml(stop.status_note)}</div>`
      : "";

    el.innerHTML = `
      <div class="stop-eyebrow">${escapeHtml(stop.area || "")} · Stop ${stop.order} of ${state.stops.length}</div>
      <div class="stop-title">${escapeHtml(stop.name_en)}</div>
      <div class="stop-title-es">${escapeHtml(stop.name_es || "")}</div>
      <div class="stop-meta">
        ${stop.time_min ? `<span class="pill">⏱ ~${stop.time_min} min</span>` : ""}
        ${statusPill}
      </div>
      ${stop.paper_ref ? `<div class="paper-ref">📖 Paper guide: <strong>${escapeHtml(stop.paper_ref)}</strong></div>` : ""}
      ${statusBanner}
      ${photosHtml ? `<div class="photo-scroll">${photosHtml}</div>` : ""}
      <div class="section-block">
        <h3>History &amp; Context</h3>
        <p>${escapeHtml(stop.history || "")}</p>
      </div>
      <div class="section-block">
        <h3>Architecture to Notice</h3>
        ${archHtml}
      </div>
      <div class="section-block">
        <h3>What to Look For</h3>
        ${lookForHtml}
      </div>
    `;

    el.querySelectorAll(".checklist li").forEach((li) => {
      li.addEventListener("click", () => {
        const idx = Number(li.dataset.idx);
        const arr = state.checked[stop.id] || [];
        const pos = arr.indexOf(idx);
        if (pos >= 0) arr.splice(pos, 1);
        else arr.push(idx);
        state.checked[stop.id] = arr;
        li.classList.toggle("checked");
        li.querySelector("input").checked = li.classList.contains("checked");
        saveLocal();
      });
    });

    document.getElementById("topbar-title").textContent = stop.name_en;
    document.getElementById("stop-index-label").textContent = `${state.current + 1} / ${state.stops.length}`;
    document.getElementById("btn-prev").disabled = state.current === 0;
    document.getElementById("btn-next").disabled = state.current === state.stops.length - 1;

    document.getElementById("stop-content").scrollTop = 0;
    window.scrollTo(0, 0);
  }

  function goTo(i) {
    if (i < 0 || i >= state.stops.length) return;
    state.current = i;
    saveLocal();
    renderRail();
    renderStop();
    switchTab("route");
  }

  function shortPaperRef(text) {
    if (!text) return "";
    let t = text.split(" (")[0];
    t = t.split(" · ")[0];
    t = t.split(" — ")[0];
    return t.trim();
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function renderPlan() {
    const el = document.getElementById("plan-content");
    if (!state.plan) return;
    let html = `<h2>${escapeHtml(state.plan.title || "Your Day Plan")}</h2>`;
    (state.plan.items || []).forEach((item) => {
      html += `<div class="timeline-item">
        <div class="timeline-time">${escapeHtml(item.time || "")}</div>
        <div class="timeline-body"><strong>${escapeHtml(item.title || "")}</strong><br>${escapeHtml(item.body || "")}</div>
      </div>`;
    });
    el.innerHTML = html;
  }

  function renderTips() {
    const el = document.getElementById("tips-content");
    if (!state.tips) return;
    let html = "";
    (state.tips.sections || []).forEach((sec) => {
      html += `<h2>${escapeHtml(sec.heading)}</h2>`;
      if (sec.body) html += `<p>${escapeHtml(sec.body)}</p>`;
      if (sec.list) {
        html += "<ul>" + sec.list.map((li) => `<li>${escapeHtml(li)}</li>`).join("") + "</ul>";
      }
    });
    el.innerHTML = html;
  }

  function renderMap() {
    const wrap = document.getElementById("map-wrap");
    if (!state.map) return;
    const { viewBox, edges, nodes, areas } = state.map;
    let svg = `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">`;

    (areas || []).forEach((a) => {
      svg += `<rect x="${a.x}" y="${a.y}" width="${a.w}" height="${a.h}" rx="6" fill="${a.fill || '#e8c77a'}" opacity="0.18"/>`;
      svg += `<text x="${a.x + 2}" y="${a.y + 4.5}" class="map-area-label" font-size="2.6">${escapeHtml(a.label)}</text>`;
    });

    (edges || []).forEach(([a, b]) => {
      const na = nodes.find((n) => n.id === a);
      const nb = nodes.find((n) => n.id === b);
      if (na && nb) {
        svg += `<line x1="${na.x}" y1="${na.y}" x2="${nb.x}" y2="${nb.y}" stroke="#c9a24a" stroke-width="1" stroke-dasharray="1.5,1.5"/>`;
      }
    });

    nodes.forEach((n) => {
      svg += `<g class="map-node" data-stop="${n.id}" style="cursor:pointer">
        <circle cx="${n.x}" cy="${n.y}" r="3"/>
        <text x="${n.x}" y="${n.y + 1}" text-anchor="middle" font-size="2.6">${n.order}</text>
      </g>`;
    });

    svg += "</svg>";
    wrap.innerHTML = svg;

    wrap.querySelectorAll(".map-node").forEach((g) => {
      g.addEventListener("click", () => {
        const stopId = g.dataset.stop;
        const idx = state.stops.findIndex((s) => s.id === stopId);
        if (idx >= 0) goTo(idx);
      });
    });

    const legend = document.getElementById("map-legend");
    if (legend) {
      legend.innerHTML = nodes
        .map((n) => {
          const stop = state.stops.find((s) => s.id === n.id);
          const ref = shortPaperRef(stop && stop.paper_ref);
          return `<button class="legend-item" data-stop="${n.id}">
            <span class="legend-num">${n.order}</span>
            <span>${escapeHtml(n.label)}${ref ? `<span class="legend-ref">Paper guide: ${escapeHtml(ref)}</span>` : ""}</span>
          </button>`;
        })
        .join("");
      legend.querySelectorAll(".legend-item").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = state.stops.findIndex((s) => s.id === btn.dataset.stop);
          if (idx >= 0) goTo(idx);
        });
      });
    }
  }

  function switchTab(tab) {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    document.getElementById("view-" + tab).classList.add("active");
    const stopNav = document.querySelector(".stop-nav");
    const rail = document.getElementById("progress-rail");
    const showRoute = tab === "route";
    stopNav.style.display = showRoute ? "flex" : "none";
    rail.style.display = showRoute ? "flex" : "none";
    document.getElementById("topbar-title").textContent =
      tab === "route" ? (state.stops[state.current]?.name_en || "Alhambra Guide") : { map: "Map", plan: "Day Plan", tips: "Tips" }[tab];
  }

  function initTabs() {
    document.querySelectorAll(".tab").forEach((t) => {
      t.addEventListener("click", () => switchTab(t.dataset.tab));
    });
    document.getElementById("btn-map").addEventListener("click", () => switchTab("map"));
  }

  function initNav() {
    document.getElementById("btn-prev").addEventListener("click", () => goTo(state.current - 1));
    document.getElementById("btn-next").addEventListener("click", () => goTo(state.current + 1));
  }

  function registerSW() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw.js").then(() => {
          toast("Ready for offline use ✓");
        }).catch(() => {});
      });
    }
  }

  async function main() {
    loadLocal();
    initTabs();
    initNav();
    await loadData();
    renderRail();
    renderStop();
    renderPlan();
    renderTips();
    renderMap();
    registerSW();
  }

  main();
})();

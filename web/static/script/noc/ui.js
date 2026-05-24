"use strict";

// ─────────────────────────────────────────────────────────────
// ESTILOS INLINE BASE (injetados uma vez no <head>)
// ─────────────────────────────────────────────────────────────

(function injectBaseStyles() {
  if (document.getElementById("noc-base-styles")) return;
  const s = document.createElement("style");
  s.id = "noc-base-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

    .noc-card {
      background: ${C.bgCard};
      border: 1px solid ${C.border};
      border-radius: 8px;
      padding: 10px 12px;
      cursor: pointer;
      transition: border-color .15s, background .15s, transform .1s;
      font-family: 'JetBrains Mono', monospace;
      position: relative;
      overflow: hidden;
    }
    .noc-card:hover {
      border-color: #2a3550;
      background: #1a2238;
      transform: translateY(-1px);
    }
    .noc-card.selected {
      border-color: ${C.accent}66 !important;
      background: #0d1829 !important;
      box-shadow: 0 0 0 1px ${C.accent}22, 0 4px 20px rgba(123,208,255,.08);
    }
    .noc-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      border-radius: 8px 8px 0 0;
    }
    .noc-card.status-up::before   { background: ${C.success}; }
    .noc-card.status-down::before { background: ${C.danger}; }

    .noc-kv {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2px 0;
    }
    .noc-label {
      font-size: 9px;
      color: ${C.dim};
      text-transform: uppercase;
      letter-spacing: .05em;
      font-weight: 500;
    }
    .noc-value {
      font-size: 10px;
      font-weight: 600;
      color: ${C.text};
      font-family: 'JetBrains Mono', monospace;
    }
    .noc-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 1px 7px;
      border-radius: 999px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .05em;
    }
    .noc-dot {
      width: 5px; height: 5px;
      border-radius: 50%;
      display: inline-block;
    }

    /* loading / empty states */
    .noc-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 40px;
      color: ${C.dim};
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
    }
    .noc-spinner {
      width: 20px; height: 20px;
      border: 2px solid ${C.border};
      border-top-color: ${C.accent};
      border-radius: 50%;
      animation: noc-spin .7s linear infinite;
    }
    @keyframes noc-spin { to { transform: rotate(360deg); } }

    .noc-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 40px;
      color: ${C.dim};
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      text-align: center;
    }

    /* detail panel rows */
    .noc-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      border-bottom: 1px solid ${C.border};
    }
    .noc-row:last-child { border-bottom: none; }

    /* scrollbar */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
  `;
  document.head.appendChild(s);
})();

// ─────────────────────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────────────────────

function markActive(pageKey) {
  document.querySelectorAll(".nav-link").forEach(el =>
    el.classList.toggle("active", el.dataset.page === pageKey)
  );
}

function showToast(msg, type = "success") {
  document.querySelector(".noc-toast")?.remove();
  const t = document.createElement("div");
  t.className = "noc-toast";
  const isErr = type === "error";
  t.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    display:flex;align-items:center;gap:8px;
    padding:10px 16px;
    background:#1a2238;
    border:1px solid ${isErr ? C.danger + "44" : C.border};
    border-radius:8px;font-size:11px;color:${C.text};
    box-shadow:0 8px 32px rgba(0,0,0,.6);
    font-family:'JetBrains Mono',monospace;
    animation: noc-slide-in .2s ease;
  `;
  const icon = isErr
    ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${C.danger}" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
    : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${C.success}" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
  t.innerHTML = `${icon}<span>${msg}</span>`;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.transition = "opacity .3s, transform .3s";
    t.style.opacity = "0";
    t.style.transform = "translateY(6px)";
    setTimeout(() => t.remove(), 300);
  }, 3000);
}

function setLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn._prevHtml = btn.innerHTML;
    btn.innerHTML = `<span class="noc-spinner" style="width:12px;height:12px;border-width:1.5px;display:inline-block;vertical-align:middle;margin-right:6px;"></span>Carregando...`;
    btn.disabled = true;
  } else {
    if (btn._prevHtml) btn.innerHTML = btn._prevHtml;
    btn.disabled = false;
  }
}

function formatOutput(text) {
  if (!text?.trim()) return `<span style="color:${C.dim};">Sem retorno do equipamento.</span>`;
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>")
    .replace(/(down|fail|error|offline|aborted?)/gi, `<span style="color:${C.danger};font-weight:700;">$1</span>`)
    .replace(/(up|online|success|active|complete)/gi, `<span style="color:${C.success};font-weight:700;">$1</span>`)
    .replace(/([-\d.]+\s*dBm)/gi, `<span style="color:${C.accent};font-weight:700;">$1</span>`)
    .replace(/([A-Z]{4}[0-9A-F]{8,})/g, `<span style="color:${C.warning};font-weight:700;">$1</span>`);
}

function gridLoading(container, msg = "Carregando...") {
  if (!container) return;
  container.innerHTML = `<div class="state-box"><span class="spinner"></span><span>${msg}</span></div>`;
}

function gridError(container, msg) {
  if (!container) return;
  container.innerHTML = `<div class="state-box" style="color:${C.danger};"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r=".5" fill="currentColor"/></svg><span>${msg}</span></div>`;
}

function getSelectedOlt() {
  return (
    document.getElementById("olt-select")?.value ||
    document.getElementById("onu-olt")?.value    ||
    document.getElementById("act-olt")?.value    ||
    null
  );
}

// ─────────────────────────────────────────────────────────────
// BADGE helpers
// ─────────────────────────────────────────────────────────────

function statusBadge(status) {
  const up = status?.toLowerCase() === "up";
  const color = up ? C.success : C.danger;
  return `
    <span class="noc-badge" style="color:${color};background:${color}18;border:1px solid ${color}33;">
      <span class="noc-dot" style="background:${color};${up ? `box-shadow:0 0 4px ${color}88;` : ""}"></span>
      ${status ?? "?"}
    </span>`;
}

function dbmColor(val) {
  const v = parseFloat(val);
  return isNaN(v) ? C.dim : v >= -25 ? C.success : v >= -28 ? C.warning : C.danger;
}

// ─────────────────────────────────────────────────────────────
// ONU CARD PARSER  (lista geral)
// ─────────────────────────────────────────────────────────────

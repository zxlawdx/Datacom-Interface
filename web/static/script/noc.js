/**
 * NOC DATACOM — noc.js v2.0
 * Frontend logic + API integration for Django /core/ endpoints
 */

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────

const API = "/core";  // Django URL prefix for core app

const OLT_META = {
  KM70:     { vlan: null,  profile: null,              hint: null },
  KM17:     { vlan: null,  profile: null,              hint: null },
  ABUNA:    { vlan: null,  profile: null,              hint: null },
  CALAMA:   { vlan: 306,   profile: "PPPoE-Vlan306",   hint: "CALAMA — VLAN 306 · PPPoE-Vlan306" },
  MOANENSE: { vlan: 304,   profile: "PPPoE-Vlan304",   hint: "MOANENSE — VLAN 304 · PPPoE-Vlan304" },
};

const OLT_LABELS = {
  KM70:     "KM70 — 10.0.62.200:50022",
  KM17:     "KM17 — 10.0.54.201:50022",
  ABUNA:    "ABUNÃ — 10.0.53.201:50022",
  CALAMA:   "CALAMA — 192.168.230.37:22",
  MOANENSE: "MOANENSE — 192.168.230.46:22",
};

// ─────────────────────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────────────────────

/** Marks the sidebar nav link as active based on current page key */
function markActive(pageKey) {
  document.querySelectorAll(".nav-link").forEach(el => {
    el.classList.toggle("active", el.dataset.page === pageKey);
  });
}

/** Shows a toast notification */
function showToast(msg, type = "success") {
  document.querySelector(".noc-toast")?.remove();
  const t = document.createElement("div");
  t.className = `noc-toast noc-toast--${type}`;
  const icon = type === "error"
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
  t.innerHTML = `${icon}<span>${msg}</span>`;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.transition = "opacity .3s, transform .3s";
    t.style.opacity = "0";
    t.style.transform = "translateY(6px)";
    setTimeout(() => t.remove(), 300);
  }, 3000);
}

/** Sets a button into loading/idle state */
function setLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn._prev = btn.innerHTML;
    btn.innerHTML = `<span class="btn-spinner"></span> Carregando...`;
    btn.disabled = true;
  } else {
    if (btn._prev) btn.innerHTML = btn._prev;
    btn.disabled = false;
  }
}

/** Appends colored output to an element */
function formatOutput(text) {
  if (!text?.trim()) return '<span style="color:var(--text-dim);">Sem retorno do equipamento.</span>';
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>")
    .replace(/(down|fail|error|offline|aborted?)/gi, `<span style="color:var(--danger);font-weight:700;">$1</span>`)
    .replace(/(up|online|success|active|complete)/gi, `<span style="color:var(--success);font-weight:700;">$1</span>`)
    .replace(/([-\d.]+\s*dBm)/gi, `<span style="color:var(--accent);font-weight:700;">$1</span>`)
    .replace(/([A-Z]{4}[0-9A-F]{8,})/g, `<span style="color:var(--warning);font-weight:700;">$1</span>`);
}

/** Shows loading state in a grid container */
function gridLoading(container, msg = "Carregando...") {
  container.innerHTML = `
    <div class="loading-state col-span-full">
      <span class="spinner"></span>
      <span>${msg}</span>
    </div>`;
}

/** Shows an error state in a grid container */
function gridError(container, msg) {
  container.innerHTML = `
    <div class="empty-state col-span-full" style="color:var(--danger);">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <p>${msg}</p>
    </div>`;
}

// ─────────────────────────────────────────────────────────────
// ONU CARD PARSER
// ─────────────────────────────────────────────────────────────

/**
 * Parses raw OLT text output into styled ONU cards.
 * Falls back to raw formatted output if parsing yields nothing.
 */
function parseONUsToCards(text, container) {
  if (!text?.trim()) {
    container.innerHTML = `<div class="empty-state col-span-full"><p>Nenhuma ONU encontrada</p></div>`;
    return;
  }

  const lines = text.split("\n").filter(l => l.trim());
  const onus = [];
  let cur = null;

  for (const line of lines) {
    const onuM  = line.match(/onu\s+(\d+)/i);
    const statM = line.match(/\b(up|down|online|offline|active|inactive)\b/i);
    const serM  = line.match(/[A-Z]{4}[0-9A-F]{8,}/i);
    const nameM = line.match(/name[:\s]+(\S+)/i);
    const vlanM = line.match(/vlan[:\s-]+(\d+)/i);
    const sigM  = line.match(/([-\d.]+)\s*dBm/i);
    const ponM  = line.match(/gpon\s+([\d/]+)/i) || line.match(/(\d+\/\d+\/\d+)/);

    if (onuM) {
      if (cur) onus.push(cur);
      cur = {
        id:     onuM[1],
        name:   nameM?.[1] ?? null,
        status: statM?.[1]?.toLowerCase() ?? "unknown",
        serial: serM?.[0]?.toUpperCase() ?? null,
        vlan:   vlanM?.[1] ?? null,
        signal: sigM ? `${sigM[1]} dBm` : null,
        pon:    ponM ? (ponM[1] ?? ponM[0]) : null,
      };
    } else if (cur) {
      if (statM && cur.status === "unknown") cur.status = statM[1].toLowerCase();
      if (serM  && !cur.serial) cur.serial = serM[0].toUpperCase();
      if (nameM && !cur.name)   cur.name   = nameM[1];
      if (vlanM && !cur.vlan)   cur.vlan   = vlanM[1];
      if (sigM  && !cur.signal) cur.signal = `${sigM[1]} dBm`;
      if (ponM  && !cur.pon)    cur.pon    = ponM[1] ?? ponM[0];
    }
  }
  if (cur) onus.push(cur);

  if (!onus.length) {
    container.innerHTML = `<div class="col-span-full"><div class="output-box">${formatOutput(text)}</div></div>`;
    return;
  }

  container.innerHTML = onus.map(onu => {
    const online  = /up|online|active/.test(onu.status);
    const offline = /down|offline|inactive/.test(onu.status);
    const sc = online ? "online" : offline ? "offline" : "unknown";
    const bc = online ? "badge--online" : offline ? "badge--offline" : "badge--unknown";
    const sl = online ? "Online" : offline ? "Offline" : (onu.status || "?");
    const dotC = online ? "dot--green dot--pulse" : offline ? "dot--red" : "dot--gray";

    const sigColor = onu.signal
      ? (parseFloat(onu.signal) > -25 ? "var(--success)" : parseFloat(onu.signal) > -30 ? "var(--warning)" : "var(--danger)")
      : "var(--text-dim)";

    return `
      <div class="onu-card onu-card--${sc}">
        <div class="onu-card__head">
          <div>
            <div class="onu-id">ONU ${onu.id}</div>
            ${onu.name ? `<div class="onu-name">${onu.name}</div>` : ""}
          </div>
          <span class="badge ${bc}"><span class="dot ${dotC}"></span>${sl}</span>
        </div>
        <div class="onu-card__body">
          ${onu.serial ? `<div class="kv"><span>Serial</span><span class="mono" style="color:var(--warning);">${onu.serial}</span></div>` : ""}
          ${onu.pon    ? `<div class="kv"><span>PON</span><span class="mono">${onu.pon}</span></div>` : ""}
          ${onu.vlan   ? `<div class="kv"><span>VLAN</span><span class="mono accent">${onu.vlan}</span></div>` : ""}
          ${onu.signal ? `<div class="kv"><span>Sinal</span><span class="mono" style="color:${sigColor};font-weight:700;">${onu.signal}</span></div>` : ""}
        </div>
      </div>`;
  }).join("");
}

// ─────────────────────────────────────────────────────────────
// DISCOVERED PANEL PARSER (side panel)
// ─────────────────────────────────────────────────────────────

function parseDiscoveredToPanel(text, container, oltName) {
  if (!text?.trim()) {
    container.innerHTML = `<div class="empty-state" style="padding:40px 10px;font-size:12px;"><p>Nenhuma ONU aguardando em ${oltName}</p></div>`;
    return;
  }

  const rows = [];
  for (const line of text.split("\n")) {
    const m = line.match(/(\d+\/\d+\/\d+)\s+([A-Z0-9]{8,})/i);
    if (m) rows.push({ pon: m[1], serial: m[2].toUpperCase() });
  }

  if (!rows.length) {
    container.innerHTML = `<div class="output-box" style="font-size:11px;">${formatOutput(text)}</div>`;
    return;
  }

  container.innerHTML = rows.map(r => `
    <div class="disc-card" onclick="fillFromDiscovered('${r.pon}','${r.serial}',event)">
      <div class="kv" style="margin-bottom:6px;">
        <span class="badge badge--warning" style="font-size:9px;">Aguardando</span>
        <span style="font-size:10px;font-family:var(--mono);color:var(--text-dim);">PON ${r.pon}</span>
      </div>
      <div style="font-family:var(--mono);font-size:11px;font-weight:700;color:var(--warning);">${r.serial}</div>
      <div style="font-size:10px;color:var(--text-muted);margin-top:4px;">↑ clique para usar</div>
    </div>`).join("");
}

function fillFromDiscovered(pon, serial, event) {
  const ponEl    = document.getElementById("act-pon");
  const serialEl = document.getElementById("act-serial");
  if (ponEl)    ponEl.value    = pon;
  if (serialEl) serialEl.value = serial;
  document.querySelectorAll(".disc-card").forEach(c => c.classList.remove("selected"));
  event?.currentTarget?.classList.add("selected");
  showToast(`Serial ${serial} · PON ${pon} preenchidos`);
}

// ─────────────────────────────────────────────────────────────
// DELETE LIST PARSER (side panel)
// ─────────────────────────────────────────────────────────────

function renderDeleteCards(output, container) {
  if (!output?.trim()) {
    container.innerHTML = `<div class="empty-state" style="padding:40px 10px;font-size:12px;"><p>Nenhuma ONU encontrada</p></div>`;
    return;
  }

  const onus = [];
  for (const line of output.split("\n")) {
    const m = line.match(/(\d+\/\d+\/\d+).*?(\d+).*?([A-Z0-9]{8,})/);
    if (m) onus.push({ pon: m[1], id: m[2], serial: m[3] });
  }

  if (!onus.length) {
    container.innerHTML = `<div class="output-box" style="font-size:11px;">${formatOutput(output)}</div>`;
    return;
  }

  container.innerHTML = onus.map(onu => `
    <div class="disc-card" onclick="fillDeleteForm(${JSON.stringify(onu).replace(/"/g,"&quot;")})">
      <div class="kv" style="margin-bottom:4px;"><span style="color:var(--text-dim);font-size:10px;">PON</span><span class="mono" style="color:var(--accent);font-size:10px;">${onu.pon}</span></div>
      <div class="kv" style="margin-bottom:4px;"><span style="color:var(--text-dim);font-size:10px;">ONU ID</span><span style="font-size:10px;">${onu.id}</span></div>
      <div class="kv"><span style="color:var(--text-dim);font-size:10px;">Serial</span><span class="mono" style="color:var(--warning);font-size:10px;font-weight:700;">${onu.serial}</span></div>
    </div>`).join("");
}

function fillDeleteForm(onu) {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  set("del-pon",    onu.pon);
  set("del-id",     onu.id);
  set("del-serial", onu.serial);
  showToast(`ONU ${onu.id} · ${onu.serial} selecionada`);
}

// ─────────────────────────────────────────────────────────────
// API — ONU STATUS  (GET /core/onu/status/)
// ─────────────────────────────────────────────────────────────

async function loadONUs(e) {
  const btn       = e.target.closest("button");
  const container = document.getElementById("onu-output");
  setLoading(btn, true);
  gridLoading(container, "Buscando ONUs...");

  try {
    const olt = document.getElementById("onu-olt").value;
    const res  = await fetch(`${API}/onu/status/`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ olt }),
    });
    const data = await res.json();
    if (data.error) {
      gridError(container, data.error);
    } else {
      parseONUsToCards(data.output, container);
    }
  } catch {
    gridError(container, "Erro ao carregar ONUs. API offline?");
    showToast("Erro ao carregar ONUs", "error");
  }
  setLoading(btn, false);
}

// ─────────────────────────────────────────────────────────────
// API — DISCOVERED  (POST /core/onu/discovered/)
// ─────────────────────────────────────────────────────────────

async function loadDiscovered(e) {
  const btn       = e.target.closest("button");
  const container = document.getElementById("disc-output");
  setLoading(btn, true);
  gridLoading(container, "Buscando dispositivos...");

  try {
    const olt = document.getElementById("disc-olt").value;
    const res  = await fetch(`${API}/onu/discovered/`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ olt }),
    });
    const data = await res.json();
    if (data.error) {
      gridError(container, data.error);
    } else {
      parseONUsToCards(data.output, container);
    }
  } catch {
    gridError(container, "Erro ao buscar ONUs descobertas.");
    showToast("Erro ao buscar ONUs", "error");
  }
  setLoading(btn, false);
}

// ─────────────────────────────────────────────────────────────
// API — DISCOVERED PANEL (side panel on Activate page)
// ─────────────────────────────────────────────────────────────

async function refreshDiscoveredPanel(e) {
  if (e) {
    const btn = e.target.closest("button");
    setLoading(btn, true);
    setTimeout(() => setLoading(btn, false), 3500);
  }

  const container = document.getElementById("act-disc-list");
  if (!container) return;
  const olt = document.getElementById("act-olt")?.value;
  if (!olt) return;

  container.innerHTML = `<div class="loading-state" style="padding:40px 10px;"><span class="spinner"></span><span style="font-size:11px;">Buscando em ${olt}...</span></div>`;

  try {
    const res  = await fetch(`${API}/onu/discovered/`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ olt }),
    });
    const data = await res.json();
    parseDiscoveredToPanel(data.output ?? data.error, container, olt);
  } catch {
    container.innerHTML = `<div class="empty-state" style="padding:40px 10px;color:var(--danger);font-size:12px;"><p>Erro ao buscar.<br>API offline?</p></div>`;
  }
}

// ─────────────────────────────────────────────────────────────
// API — ONU ACTIVATE  (POST /core/onu/activate/)
// ─────────────────────────────────────────────────────────────

async function activateONU(e) {
  const btn = e.target.closest("button");
  setLoading(btn, true);

  const get = id => document.getElementById(id)?.value?.trim() ?? "";
  const payload = {
    olt:          get("act-olt"),
    pon:          get("act-pon"),
    onu_id:       parseInt(get("act-id")),
    serial:       get("act-serial"),
    name:         get("act-name"),
    vlan:         parseInt(get("act-vlan")),
    profile:      get("act-profile"),
    service_port: parseInt(get("act-service")),
  };

  if (!payload.pon || !payload.serial || !payload.name ||
      isNaN(payload.onu_id) || isNaN(payload.vlan) || isNaN(payload.service_port)) {
    showToast("Preencha todos os campos obrigatórios", "error");
    setLoading(btn, false);
    return;
  }

  const outEl = document.getElementById("act-output");
  try {
    const res  = await fetch(`${API}/onu/activate/`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (outEl) {
      outEl.classList.remove("hidden");
      outEl.innerHTML = formatOutput(data.output ?? data.error);
    }
    if (data.error) {
      showToast("Erro na ativação: " + data.error.slice(0, 60), "error");
    } else {
      showToast("Comando de ativação enviado com sucesso!");
      setTimeout(() => refreshDiscoveredPanel(), 2500);
    }
  } catch {
    if (outEl) { outEl.classList.remove("hidden"); outEl.innerHTML = `<span style="color:var(--danger);">Erro de conexão com a API.</span>`; }
    showToast("Erro ao ativar ONU", "error");
  }
  setLoading(btn, false);
}

// ─────────────────────────────────────────────────────────────
// API — ONU DELETE  (POST /core/onu/delete/)
// ─────────────────────────────────────────────────────────────

async function deleteONU(e) {
  const btn = e.target.closest("button");

  const get = id => document.getElementById(id)?.value?.trim() ?? "";
  const payload = {
    olt:    get("del-olt"),
    pon:    get("del-pon"),
    onu_id: parseInt(get("del-id")),
    serial: get("del-serial"),
  };

  if (!payload.pon || isNaN(payload.onu_id)) {
    showToast("Preencha PON e ONU ID", "error");
    return;
  }

  if (!confirm(`Confirma deletar ONU ${payload.onu_id} (${payload.serial || "sem serial"}) na PON ${payload.pon}?`)) return;

  setLoading(btn, true);
  const outEl = document.getElementById("del-output");

  try {
    const res  = await fetch(`${API}/onu/delete/`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (outEl) {
      outEl.classList.remove("hidden");
      outEl.innerHTML = formatOutput(data.output ?? data.error);
    }
    if (data.error) {
      showToast("Erro ao deletar: " + data.error.slice(0, 60), "error");
    } else {
      showToast("ONU deletada com sucesso");
    }
  } catch {
    if (outEl) { outEl.classList.remove("hidden"); outEl.innerHTML = `<span style="color:var(--danger);">Erro de conexão com a API.</span>`; }
    showToast("Erro ao deletar ONU", "error");
  }
  setLoading(btn, false);
}

// ─────────────────────────────────────────────────────────────
// API — LOAD ONUs TO DELETE (side panel)
// ─────────────────────────────────────────────────────────────

async function loadONUsToDelete(e) {
  const btn       = e.target.closest("button");
  const container = document.getElementById("del-list");
  if (!container) return;

  const olt = document.getElementById("del-olt")?.value;
  if (!olt) { showToast("Selecione uma OLT", "error"); return; }

  setLoading(btn, true);
  container.innerHTML = `<div class="loading-state" style="padding:40px 10px;"><span class="spinner"></span><span style="font-size:11px;">Buscando em ${olt}...</span></div>`;

  try {
    const res  = await fetch(`${API}/onu/status/`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ olt }),
    });
    const data = await res.json();
    if (data.error) {
      container.innerHTML = `<div class="empty-state" style="padding:40px 10px;color:var(--danger);font-size:12px;"><p>${data.error}</p></div>`;
    } else {
      renderDeleteCards(data.output, container);
    }
  } catch {
    container.innerHTML = `<div class="empty-state" style="padding:40px 10px;color:var(--danger);font-size:12px;"><p>Erro ao conectar com API</p></div>`;
    showToast("Erro ao carregar ONUs", "error");
  }
  setLoading(btn, false);
}

// ─────────────────────────────────────────────────────────────
// ACTIVATE PAGE — OLT change handler
// ─────────────────────────────────────────────────────────────

function onActOltChange() {
  const olt  = document.getElementById("act-olt")?.value;
  const meta = OLT_META[olt];
  const hint = document.getElementById("act-olt-hint");

  if (meta?.vlan) {
    const vlanEl    = document.getElementById("act-vlan");
    const profileEl = document.getElementById("act-profile");
    if (vlanEl)    vlanEl.value    = meta.vlan;
    if (profileEl) profileEl.value = meta.profile;
    if (hint) {
      hint.classList.remove("hidden");
      hint.innerHTML = `
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        ${meta.hint}`;
    }
  } else {
    const vlanEl    = document.getElementById("act-vlan");
    const profileEl = document.getElementById("act-profile");
    if (vlanEl)    vlanEl.value    = "";
    if (profileEl) profileEl.value = "";
    if (hint) hint.classList.add("hidden");
  }
  refreshDiscoveredPanel();
}

// ─────────────────────────────────────────────────────────────
// TERMINAL
// ─────────────────────────────────────────────────────────────

function updateTermLabel() {
  const olt   = document.getElementById("term-olt")?.value;
  const label = document.getElementById("term-label");
  if (label && olt) label.textContent = `noc@datacom ~ ${OLT_LABELS[olt] || olt}`;
}

function clearTerminal() {
  const log = document.getElementById("terminal-log");
  if (log) log.innerHTML = `
    <div class="t-line t-line--success">Terminal limpo.</div>
    <div class="t-line t-line--dim">──────────────────────────────────────</div>`;
}

function initTerminal() {
  const input = document.getElementById("terminal-input");
  if (!input) return;

  input.addEventListener("keypress", async (e) => {
    if (e.key !== "Enter") return;
    const log = document.getElementById("terminal-log");
    const cmd = e.target.value.trim();
    if (!cmd) return;

    const olt = document.getElementById("term-olt")?.value || "KM70";

    log.innerHTML += `
      <div class="t-line">
        <span class="t-line--success">[${olt}]</span>
        <span style="color:var(--accent);margin:0 6px;">❯</span>
        <span>${cmd.replace(/</g,"&lt;")}</span>
      </div>`;
    e.target.value = "";
    log.scrollTop = log.scrollHeight;

    try {
      const res  = await fetch(`${API}/olt/terminal/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ olt, command: cmd }),
      });
      const data = await res.json();
      const out  = data.output ?? data.error ?? "Sem resposta";
      log.innerHTML += `<div class="t-line" style="white-space:pre-wrap;color:var(--text-dim);">${formatOutput(out)}</div>`;
    } catch {
      log.innerHTML += `<div class="t-line t-line--danger">✗ Erro de conexão com a API</div>`;
    }
    log.scrollTop = log.scrollHeight;
  });
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD — health check + stats
// ─────────────────────────────────────────────────────────────

async function checkOLTHealth(name) {
  const el = document.getElementById(`olt-badge-${name}`);
  if (!el) return;
  try {
    const res  = await fetch(`${API}/health/${name}/`);
    const data = await res.json();
    if (data.online) {
      el.className = "badge badge--online";
      el.innerHTML = `<span class="dot dot--green dot--pulse"></span>Online`;
    } else {
      el.className = "badge badge--offline";
      el.innerHTML = `<span class="dot dot--red"></span>Offline`;
    }
  } catch {
    el.className = "badge badge--unknown";
    el.textContent = "Erro";
  }
}

async function dashRefresh() {
  // Fetch KM70 stats for counters
  try {
    const res  = await fetch(`${API}/onu/status/`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ olt: "KM70" }),
    });
    const data = await res.json();
    if (data.output) {
      const online  = (data.output.match(/\bup\b/gi)   || []).length;
      const offline = (data.output.match(/\bdown\b/gi) || []).length;
      const onlineEl  = document.getElementById("dash-online");
      const alertsEl  = document.getElementById("dash-alerts");
      if (onlineEl)  onlineEl.textContent  = online;
      if (alertsEl)  alertsEl.textContent  = offline;
    }
  } catch { /* silencioso */ }

  // Check each OLT health
  ["KM70","KM17","ABUNA","CALAMA","MOANENSE"].forEach(checkOLTHealth);

  // Update sync timestamp
  const syncEl = document.getElementById("last-sync");
  if (syncEl) syncEl.textContent = new Date().toLocaleTimeString("pt-BR");
}


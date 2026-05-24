"use strict";

async function loadONUs(e = null) {
  const btn       = e?.target?.closest("button") ?? null;
  const container = document.getElementById("onu-output");
  if (btn) setLoading(btn, true);
  gridLoading(container, "Buscando ONUs...");

  try {
    const olt = getSelectedOlt();
    const res  = await fetch(`${API}/onu/status/`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ olt }),
    });
    const data = await res.json();
    data.error
      ? gridError(container, data.error)
      : parseOLTToCards(data.output, container);
  } catch {
    gridError(container, "Erro ao carregar ONUs. API offline?");
    showToast("Erro ao carregar ONUs", "error");
  }

  if (btn) setLoading(btn, false);
}

// ─────────────────────────────────────────────────────────────
// API — DISCOVERED
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
    data.error
      ? gridError(container, data.error)
      : parseONUsToCards(data.output, container);
  } catch {
    gridError(container, "Erro ao buscar ONUs descobertas.");
    showToast("Erro ao buscar ONUs", "error");
  }
  setLoading(btn, false);
}

// ─────────────────────────────────────────────────────────────
// API — DISCOVERED PANEL (painel lateral da página Ativar)
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

  container.innerHTML = `<div class="noc-loading"><span class="noc-spinner"></span><span style="font-size:10px;">Buscando em ${olt}...</span></div>`;

  try {
    const res  = await fetch(`${API}/onu/discovered/`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ olt }),
    });
    const data = await res.json();
    parseDiscoveredToPanel(data.output ?? data.error, container, olt);
  } catch {
    container.innerHTML = `<div class="noc-empty" style="color:${C.danger};"><p>Erro ao buscar.<br>API offline?</p></div>`;
  }
}

// ─────────────────────────────────────────────────────────────
// API — ONU INFO
// ─────────────────────────────────────────────────────────────

async function getSignal(olt, pon, id) {
  const box = document.getElementById("signal-detail-box");
  if (!box) return;

  box.innerHTML = `<div class="noc-loading"><span class="noc-spinner"></span><span>Consultando ONU ${id}...</span></div>`;

  const sinalEl = document.getElementById("onu-sinal");
  if (sinalEl) { sinalEl.textContent = "..."; sinalEl.style.color = C.dim; }

  try {
    const res  = await fetch(`${API}/onu/info/`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ olt, pon, onu_id: parseInt(id) }),
    });
    const data = await res.json();

    if (data.error && !data.detail) {
      box.innerHTML = `<p style="color:${C.danger};font-size:11px;font-family:'JetBrains Mono',monospace;">${data.error}</p>`;
      return;
    }

    const detail  = data.detail  || {};
    const service = data.service || {};

    if (sinalEl) {
      const rx = parseFloat(detail.rx_power);
      sinalEl.textContent = detail.rx_power ? `${detail.rx_power} dBm` : "N/A";
      sinalEl.style.color = isNaN(rx) ? C.dim : rx >= -25 ? C.success : rx >= -28 ? C.warning : C.danger;
    }

    box.innerHTML = renderOnuDetailPanel(detail, service, pon, id, olt);

  } catch (err) {
    console.error("[getSignal]", err);
    box.innerHTML = `<p style="color:${C.danger};font-size:11px;font-family:'JetBrains Mono',monospace;">Erro de conexão com a API.</p>`;
  }
}

// ─────────────────────────────────────────────────────────────
// RENDER — bloco IPv4
// ─────────────────────────────────────────────────────────────

function renderIpv4Block(ipv4) {
  if (!ipv4) return "";

  const row = (label, value, color = C.text) => value ? `
    <div class="detail-row">
      <span class="detail-label">${label}</span>
      <span class="detail-value" style="color:${color};">${value}</span>
    </div>` : "";

  if (ipv4.configured) {
    return `
      <div style="margin-top:8px;padding:8px 10px;border-radius:6px;
                  border:1px solid ${C.success}33;background:${C.success}0d;">
        <div style="font-size:9px;font-weight:700;color:${C.success};text-transform:uppercase;
                    letter-spacing:.06em;margin-bottom:5px;">● IPv4 — OLT</div>
        ${row("Endereço", ipv4.address, C.success)}
        ${row("Gateway",  ipv4.gateway)}
        ${row("VLAN",     ipv4.vlan,    C.accent)}
        ${ipv4.mode && ipv4.mode !== "Not configured" ? row("Modo", ipv4.mode, C.dim) : ""}
      </div>`;
  }

  if (ipv4.source === "pppoe_bras") {
    return `
      <div style="margin-top:8px;padding:8px 10px;border-radius:6px;
                  border:1px solid ${C.accent}33;background:${C.accent}0d;">
        <div style="font-size:9px;font-weight:700;color:${C.accent};text-transform:uppercase;
                    letter-spacing:.06em;margin-bottom:4px;">◎ IPv4 — PPPoE / BRAS</div>
        <div style="font-size:10px;color:${C.dim};line-height:1.5;font-family:'JetBrains Mono',monospace;">
          ${ipv4.note || "IP via PPPoE pelo BRAS — não visível na OLT."}
        </div>
      </div>`;
  }

  return `
    <div style="margin-top:8px;padding:8px 10px;border-radius:6px;border:1px solid ${C.border};">
      <div style="font-size:9px;font-weight:700;color:${C.dim};text-transform:uppercase;
                  letter-spacing:.06em;margin-bottom:4px;">○ IPv4</div>
      <div style="font-size:10px;color:${C.dim};font-family:'JetBrains Mono',monospace;">
        ${ipv4.note || "Nenhum IP configurado na OLT."}
      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────
// RENDER — painel de detalhes completo da ONU
// ─────────────────────────────────────────────────────────────

function renderOnuDetailPanel(onu, service, ponId, onuId, olt) {

  const statusColor = onu.status?.toLowerCase() === "up" ? C.success : C.danger;

  const row = (label, value, color = C.text) => value ? `
    <div class="detail-row">
      <span class="detail-label">${label}</span>
      <span class="detail-value" style="color:${color};">${value}</span>
    </div>` : "";

  const sessions = service.pppoe_sessions ?? [];
  const pppoeHtml = sessions.length
    ? sessions.map(s => `
        ${row("Session ID", s.session_id, C.success)}
        ${row("MAC", s.mac, C.warning)}`).join("")
    : `<div class="detail-row">
         <span class="detail-label">PPPoE</span>
         <span class="detail-value" style="color:${C.danger};">Sem sessão ativa</span>
       </div>`;

  const vlans = service.vlans ?? [];

  return `
    <div style="font-family:'JetBrains Mono',monospace;">

      <!-- cabeçalho -->
      <div style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid ${C.border};">
        <div style="font-size:9px;color:${C.dim};margin-bottom:3px;">PON ${ponId} · ONU ${onuId}</div>
        <div style="font-size:13px;font-weight:700;color:${C.warning};word-break:break-all;">
          ${onu.serial ?? "—"}
        </div>
        ${onu.name && onu.name !== "—"
          ? `<div style="font-size:9px;color:${C.success};margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${onu.name}</div>`
          : ""}
      </div>

      <!-- sinais ópticos (2 col) -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
        <div style="background:${C.bgLow};border-radius:6px;padding:8px;border:1px solid ${C.border};text-align:center;">
          <div style="font-size:9px;color:${C.dim};text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;">Rx ↓</div>
          <div style="font-size:15px;font-weight:700;color:${dbmColor(onu.rx_power)};">
            ${onu.rx_power ?? "—"}
          </div>
          ${onu.rx_power ? `<div style="font-size:8px;color:${C.dim};">dBm</div>` : ""}
        </div>
        <div style="background:${C.bgLow};border-radius:6px;padding:8px;border:1px solid ${C.border};text-align:center;">
          <div style="font-size:9px;color:${C.dim};text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;">RSS ↑</div>
          <div style="font-size:15px;font-weight:700;color:${dbmColor(onu.rss_power)};">
            ${onu.rss_power ?? "—"}
          </div>
          ${onu.rss_power ? `<div style="font-size:8px;color:${C.dim};">dBm</div>` : ""}
        </div>
      </div>

      <!-- dados da ONU -->
      <div style="margin-bottom:8px;">
        ${row("Status",    onu.status,   statusColor)}
        ${row("Uptime",    onu.uptime)}
        ${row("Tx Power",  onu.tx_power ? `${onu.tx_power} dBm` : null, C.accent)}
        ${row("Perfil",    onu.profile)}
        ${row("Distância", onu.distance ? `${onu.distance} km` : null)}
        ${row("Vendor",    onu.vendor)}
        ${row("Equipment", onu.equipment)}
        ${row("FW Ativo",  onu.active_fw)}
        ${row("FW Standby",onu.standby_fw)}
        ${row("Versão",    onu.version)}
        ${row("FEC",       onu.fec)}
        ${row("Banda",     onu.bandwidth)}
      </div>

      <!-- IPv4 -->
      ${renderIpv4Block(onu.ipv4)}

      <!-- serviço -->
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid ${C.border};">
        <div style="font-size:9px;color:${C.dim};text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px;">Serviço</div>
        ${row("Service Port", service.service_port, C.accent)}
        ${row("VLANs", vlans.length ? vlans.join(" · ") : null, C.warning)}
        ${pppoeHtml}
        <div style="font-size:9px;color:${C.dim};margin-top:5px;line-height:1.4;">
          💡 IP do cliente está no BRAS/BNG, não na OLT.
        </div>
      </div>

      <!-- botão reboot -->
      <div style="margin-top:12px;">
        <button class="btn-reboot" onclick="rebootONU('${olt}','${ponId}','${onuId}',this)">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Reiniciar ONU
        </button>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────
// API — ONU ACTIVATE
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
      outEl.style.display = "block";
      outEl.innerHTML = formatOutput(data.output ?? data.error);
    }
    data.error
      ? showToast("Erro na ativação: " + data.error.slice(0, 60), "error")
      : showToast("ONU ativada com sucesso!");
    if (!data.error) setTimeout(() => refreshDiscoveredPanel(), 2500);
  } catch {
    if (outEl) { outEl.style.display = "block"; outEl.innerHTML = `<span style="color:${C.danger};">Erro de conexão com a API.</span>`; }
    showToast("Erro ao ativar ONU", "error");
  }
  setLoading(btn, false);
}

// ─────────────────────────────────────────────────────────────
// API — ONU DELETE
// ─────────────────────────────────────────────────────────────

async function deleteONU(e) {
  const btn = e.target.closest("button");

  const get = id => document.getElementById(id)?.value?.trim() ?? "";
  const payload = {
    olt:          get("del-olt"),
    pon:          get("del-pon"),
    onu_id:       parseInt(get("del-id")),
    serial:       get("del-serial"),
    service_port: parseInt(get("del-service")),
  };

  if (!payload.pon || isNaN(payload.onu_id) || isNaN(payload.service_port)) {
    showToast("Preencha PON, ONU ID e Service Port", "error");
    return;
  }

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
      outEl.style.display = "block";
      outEl.innerHTML = formatOutput(data.output ?? data.error);
    }
    data.error
      ? showToast("Erro ao deletar: " + data.error.slice(0, 60), "error")
      : showToast("ONU deletada com sucesso");
  } catch {
    if (outEl) { outEl.style.display = "block"; outEl.innerHTML = `<span style="color:${C.danger};">Erro de conexão com a API.</span>`; }
    showToast("Erro ao deletar ONU", "error");
  }
  setLoading(btn, false);
}

// ─────────────────────────────────────────────────────────────
// API — LOAD ONUs TO DELETE
// ─────────────────────────────────────────────────────────────

async function loadONUsToDelete(e) {
  const btn       = e.target.closest("button");
  const container = document.getElementById("del-list");
  if (!container) return;

  const olt = document.getElementById("del-olt")?.value;
  if (!olt) { showToast("Selecione uma OLT", "error"); return; }

  setLoading(btn, true);
  container.innerHTML = `<div class="noc-loading"><span class="noc-spinner"></span><span style="font-size:10px;">Buscando em ${olt}...</span></div>`;

  try {
    const res  = await fetch(`${API}/onu/status/`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ olt }),
    });
    const data = await res.json();
    data.error
      ? (container.innerHTML = `<div class="noc-empty" style="color:${C.danger};"><p>${data.error}</p></div>`)
      : renderDeleteCards(data.output, container);
  } catch {
    container.innerHTML = `<div class="noc-empty" style="color:${C.danger};"><p>Erro ao conectar com API</p></div>`;
    showToast("Erro ao carregar ONUs", "error");
  }
  setLoading(btn, false);
}

// ─────────────────────────────────────────────────────────────
// API — REBOOT ONU
// ─────────────────────────────────────────────────────────────

async function rebootONU(olt, pon, id, btn) {
  if (!confirm(`Reiniciar ONU ${id} na PON ${pon}?\nO cliente ficará sem conexão por ~1 min.`)) return;

  setLoading(btn, true);
  try {
    const res  = await fetch(`${API}/onu/reboot/`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ olt, pon, onu_id: parseInt(id) }),
    });
    const data = await res.json();
    data.error
      ? showToast("Erro ao reiniciar: " + data.error.slice(0, 60), "error")
      : showToast(`ONU ${id} reiniciada com sucesso!`);
    if (!data.error) setTimeout(() => getSignal(olt, pon, id), 5000);
  } catch {
    showToast("Erro de conexão ao reiniciar", "error");
  }
  setLoading(btn, false);
}

// ─────────────────────────────────────────────────────────────
// ACTIVATE PAGE — handler troca de OLT
// ─────────────────────────────────────────────────────────────

function onActOltChange() {
  const olt  = document.getElementById("act-olt")?.value;
  const meta = OLT_META[olt] ?? {};
  const hint = document.getElementById("act-olt-hint");

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ""; };
  set("act-vlan",    meta.vlan);
  set("act-profile", meta.profile);

  if (hint) {
    if (meta.hint) {
      hint.style.display = "flex";
      hint.innerHTML = `
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="${C.accent}" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        ${meta.hint}`;
    } else {
      hint.style.display = "none";
    }
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
    <div style="color:${C.success};font-size:11px;font-family:'JetBrains Mono',monospace;">Terminal limpo.</div>
    <div style="color:${C.dim};font-size:11px;">──────────────────────────────────────</div>`;
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
      <div style="font-family:'JetBrains Mono',monospace;font-size:11px;margin:2px 0;">
        <span style="color:${C.success};">[${olt}]</span>
        <span style="color:${C.accent};margin:0 6px;">❯</span>
        <span style="color:${C.text};">${cmd.replace(/</g, "&lt;")}</span>
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
      log.innerHTML += `<div style="white-space:pre-wrap;color:${C.dim};font-size:11px;font-family:'JetBrains Mono',monospace;margin:2px 0 6px;">${formatOutput(out)}</div>`;
    } catch {
      log.innerHTML += `<div style="color:${C.danger};font-size:11px;font-family:'JetBrains Mono',monospace;">✗ Erro de conexão com a API</div>`;
    }
    log.scrollTop = log.scrollHeight;
  });
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────

async function checkOLTHealth(name) {
  const el = document.getElementById(`olt-badge-${name}`);
  if (!el) return;
  try {
    const res  = await fetch(`${API}/health/${name}/`);
    const data = await res.json();
    const online = data.online;
    const color  = online ? C.success : C.danger;
    const label  = online ? "Online" : "Offline";
    el.style.cssText = `
      display:inline-flex;align-items:center;gap:5px;
      padding:2px 8px;border-radius:999px;
      font-size:10px;font-weight:700;text-transform:uppercase;
      font-family:'JetBrains Mono',monospace;
      background:${color}18;color:${color};border:1px solid ${color}33;`;
    el.innerHTML = `<span style="width:5px;height:5px;border-radius:50%;background:${color};display:inline-block;${online ? `box-shadow:0 0 4px ${color}88;` : ""}"></span>${label}`;
  } catch {
    el.style.cssText = `display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border-radius:999px;font-size:10px;font-family:'JetBrains Mono',monospace;background:${C.dim}18;color:${C.dim};border:1px solid ${C.dim}33;`;
    el.textContent = "Erro";
  }
}

async function dashRefresh() {
  const olts = Object.keys(OLT_LABELS);

  // ── indicador visual de carregando nos contadores
  const onlineEl = document.getElementById("dash-online");
  const alertsEl = document.getElementById("dash-alerts");
  const totalEl  = document.getElementById("dash-total");
  if (onlineEl) onlineEl.textContent = "…";
  if (alertsEl) alertsEl.textContent = "…";
  if (totalEl)  totalEl.textContent  = "…";

  // ── busca todas as OLTs em paralelo
  const results = await Promise.allSettled(
    olts.map(olt =>
      fetch(`${API}/onu/status/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ olt }),
      })
      .then(r => r.json())
      .then(data => {
        const output  = data.output ?? "";
        const online  = (output.match(/\bup\b/gi)   || []).length;
        const offline = (output.match(/\bdown\b/gi) || []).length;
        return { olt, online, offline, ok: !data.error };
      })
      .catch(() => ({ olt, online: 0, offline: 0, ok: false }))
    )
  );

  // ── soma totais
  let totalOnline = 0, totalOffline = 0;
  for (const r of results) {
    if (r.status === "fulfilled") {
      totalOnline  += r.value.online;
      totalOffline += r.value.offline;
    }
  }
  const total = totalOnline + totalOffline;

  if (onlineEl) onlineEl.textContent = totalOnline;
  if (alertsEl) alertsEl.textContent = totalOffline;
  if (totalEl)  totalEl.textContent  = total;

  // ── atualiza badge por OLT com breakdown individual
  results.forEach(r => {
    if (r.status !== "fulfilled") return;
    const { olt, online, offline } = r.value;
    const badge = document.getElementById(`olt-count-${olt}`);
    if (badge) {
      badge.textContent = `↑${online} ↓${offline}`;
      badge.style.color = offline > 0 ? C.warning : C.success;
    }
  });

  // ── health check de cada OLT
  olts.forEach(checkOLTHealth);

  const syncEl = document.getElementById("last-sync");
  if (syncEl) syncEl.textContent = new Date().toLocaleTimeString("pt-BR");
}

// ─────────────────────────────────────────────────────────────
// AUTO-INIT — search listener quando o DOM estiver pronto
// ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", initONUSearch);

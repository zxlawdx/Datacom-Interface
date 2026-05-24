"use strict";

// cache de ONUs para o filtro de busca
let _onuCache = [];

function _buildOnuCard(onu, container) {
  const isUp = onu.status.toLowerCase() === "up";
  const card = document.createElement("div");
  // usa .onu-card do template + .up/.down para a barra colorida
  card.className = `onu-card ${isUp ? "up" : "down"}`;
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.dataset.onuId     = onu.id;
  card.dataset.onuPon    = onu.pon;
  card.dataset.onuSerial = onu.serial.toLowerCase();
  card.dataset.onuName   = onu.name.toLowerCase();

  const stColor = isUp ? C.success : C.danger;

  card.innerHTML = `
    <!-- linha topo: PON · ID + badge status -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <div style="display:flex;align-items:center;gap:5px;">
        <span style="font-size:9px;color:${C.dim};text-transform:uppercase;letter-spacing:.04em;">PON</span>
        <span style="font-size:10px;color:${C.accent};font-weight:700;">${onu.pon}</span>
        <span style="font-size:9px;color:${C.border};">·</span>
        <span style="font-size:9px;color:${C.dim};">ID</span>
        <span style="font-size:10px;color:${C.text};">${onu.id}</span>
      </div>
      <span style="
        display:inline-flex;align-items:center;gap:3px;
        padding:1px 6px;border-radius:999px;
        font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;
        color:${stColor};background:${stColor}18;border:1px solid ${stColor}30;">
        <span style="width:4px;height:4px;border-radius:50%;background:${stColor};
                     ${isUp ? `box-shadow:0 0 4px ${stColor};` : ""}"></span>
        ${onu.status}
      </span>
    </div>

    <!-- serial -->
    <div style="font-size:11px;font-weight:700;color:${C.warning};
                letter-spacing:.03em;line-height:1.2;
                ${onu.name ? "margin-bottom:5px;" : ""}">
      ${onu.serial}
    </div>

    <!-- nome (se existir) -->
    ${onu.name ? `
      <div style="
        font-size:9px;color:${C.success};
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
        padding-top:5px;border-top:1px solid #151e30;margin-top:1px;">
        ${onu.name}
      </div>` : ""}
  `;

  const activate = () => {
    document.querySelectorAll("#onu-output .onu-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    getSignal(getSelectedOlt(), onu.pon, onu.id);
  };
  card.addEventListener("click", activate);
  card.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
  });

  container.appendChild(card);
}

function parseOLTToCards(html, container) {
  if (!container) return;
  container.innerHTML = "";
  _onuCache = [];

  const sinalEl = document.getElementById("onu-sinal");
  if (sinalEl) { sinalEl.textContent = "--"; sinalEl.style.color = ""; }

  // limpa busca ao recarregar
  const searchEl = document.getElementById("onu-search");
  if (searchEl) { searchEl.value = ""; _updateSearchCount(null); }

  const clean = html.replace(/<br>/g, "\n").replace(/<[^>]+>/g, "");
  const dataLines = clean.split("\n").slice(2).filter(l => l.trim());

  if (!dataLines.length) {
    container.innerHTML = `<div class="state-box"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1e2535" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r=".5" fill="#1e2535"/></svg><span>Nenhuma ONU encontrada</span></div>`;
    return;
  }

  dataLines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 4) return;
    const onu = { pon: parts[0], id: parts[1], serial: parts[2], status: parts[3], name: parts.slice(5).join(" ") || "" };
    _onuCache.push(onu);
    _buildOnuCard(onu, container);
  });

  _updateSearchCount(_onuCache.length);
}

// ─────────────────────────────────────────────────────────────
// SEARCH — filtra cards por Serial Number ou Nome
// ─────────────────────────────────────────────────────────────

function _updateSearchCount(n) {
  const el = document.getElementById("onu-search-count");
  if (!el) return;
  el.textContent = n !== null ? `${n} ONU${n !== 1 ? "s" : ""}` : "";
}

function filterONUs() {
  const query     = (document.getElementById("onu-search")?.value ?? "").toLowerCase().trim();
  const container = document.getElementById("onu-output");
  if (!container) return;

  const cards = [...container.querySelectorAll(".onu-card[data-onu-serial]")];

  if (!query) {
    cards.forEach(c => c.style.display = "");
    container.querySelector(".noc-no-result")?.remove();
    _updateSearchCount(_onuCache.length);
    return;
  }

  let visible = 0;
  cards.forEach(card => {
    const hit = card.dataset.onuSerial.includes(query) || card.dataset.onuName.includes(query);
    card.style.display = hit ? "" : "none";
    if (hit) visible++;
  });

  // remove resultado anterior
  container.querySelector(".noc-no-result")?.remove();

  if (visible === 0) {
    const empty = document.createElement("div");
    empty.className = "noc-no-result state-box";
    empty.style.gridColumn = "1/-1";
    empty.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${C.dim}" stroke-width="1.5">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        <line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
      <span style="color:${C.dim};">
        Nenhuma ONU para "<strong style="color:${C.text};">${query}</strong>"
      </span>`;
    container.appendChild(empty);
  }

  _updateSearchCount(visible);
}

function initONUSearch() {
  const input = document.getElementById("onu-search");
  if (!input) return;
  input.addEventListener("input", filterONUs);
  input.addEventListener("keydown", e => {
    if (e.key === "Escape") { input.value = ""; filterONUs(); input.blur(); }
  });
}

// ─────────────────────────────────────────────────────────────
// DISCOVERED PANEL PARSER
// ─────────────────────────────────────────────────────────────

function parseDiscoveredToPanel(text, container, oltName) {
  if (!container) return;
  if (!text?.trim()) {
    container.innerHTML = `<div class="noc-empty"><p>Nenhuma ONU aguardando em ${oltName}</p></div>`;
    return;
  }

  const rows = [];
  for (const line of text.split("\n")) {
    const m = line.match(/(\d+\/\d+\/\d+)\s+([A-Z0-9]{8,})/i);
    if (m) rows.push({ pon: m[1], serial: m[2].toUpperCase() });
  }

  if (!rows.length) {
    container.innerHTML = `<div style="font-family:'JetBrains Mono',monospace;font-size:11px;">${formatOutput(text)}</div>`;
    return;
  }

  container.innerHTML = rows.map(r => `
    <div class="noc-card" onclick="fillFromDiscovered('${r.pon}','${r.serial}',event)"
         style="border-color:${C.warning}33;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span class="noc-badge" style="color:${C.warning};background:${C.warning}18;border:1px solid ${C.warning}33;">
          Aguardando
        </span>
        <span style="font-size:9px;color:${C.dim};">PON ${r.pon}</span>
      </div>
      <div style="font-size:11px;font-weight:700;color:${C.warning};">${r.serial}</div>
      <div style="font-size:9px;color:${C.dim};margin-top:4px;">↑ clique para usar</div>
    </div>`).join("");
}

function fillFromDiscovered(pon, serial, event) {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  set("act-pon",    pon);
  set("act-serial", serial);
  document.querySelectorAll(".noc-card").forEach(c => c.classList.remove("selected"));
  event?.currentTarget?.classList.add("selected");
  showToast(`Serial ${serial} · PON ${pon} preenchidos`);
}

// ─────────────────────────────────────────────────────────────
// DELETE LIST PARSER
// ─────────────────────────────────────────────────────────────

function renderDeleteCards(output, container) {
  if (!container) return;
  if (!output?.trim()) {
    container.innerHTML = `<div class="noc-empty"><p>Nenhuma ONU encontrada</p></div>`;
    return;
  }

  const onus = [];
  for (const line of output.split("\n")) {
    const m = line.match(/(\d+\/\d+\/\d+).*?(\d+).*?([A-Z0-9]{8,})/);
    if (m) onus.push({ pon: m[1], id: m[2], serial: m[3] });
  }

  if (!onus.length) {
    container.innerHTML = `<div style="font-size:11px;font-family:'JetBrains Mono',monospace;">${formatOutput(output)}</div>`;
    return;
  }

  container.innerHTML = onus.map(onu => `
    <div class="noc-card" onclick='fillDeleteForm(${JSON.stringify(onu).replace(/'/g, "\\'")})'>
      <div class="noc-kv"><span class="noc-label">PON</span><span class="noc-value" style="color:${C.accent};">${onu.pon}</span></div>
      <div class="noc-kv"><span class="noc-label">ONU ID</span><span class="noc-value">${onu.id}</span></div>
      <div class="noc-kv"><span class="noc-label">Serial</span><span class="noc-value" style="color:${C.warning};">${onu.serial}</span></div>
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
// DISCOVERED PAGE — parseONUsToCards
// ─────────────────────────────────────────────────────────────

function parseONUsToCards(text, container) {
  if (!container) return;
  if (!text?.trim()) {
    container.innerHTML = `<div class="state-box"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1e2535" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r=".5" fill="#1e2535"/></svg><span>Nenhuma ONU encontrada</span></div>`;
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
    container.innerHTML = `<div class="noc-empty" style="grid-column:1/-1;">${formatOutput(text)}</div>`;
    return;
  }

  container.innerHTML = onus.map(onu => {
    const online  = /up|online|active/.test(onu.status);
    const offline = /down|offline|inactive/.test(onu.status);
    const sigRaw  = onu.signal ? parseFloat(onu.signal) : NaN;
    const sigCol  = isNaN(sigRaw) ? C.dim : sigRaw > -25 ? C.success : sigRaw > -30 ? C.warning : C.danger;
    const stColor = online ? C.success : offline ? C.danger : C.muted;

    return `
      <div class="noc-card status-${online ? "up" : offline ? "down" : ""}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
          <div>
            <div style="font-size:10px;font-weight:700;color:${C.accent};">ONU ${onu.id}</div>
            ${onu.name ? `<div style="font-size:9px;color:${C.dim};margin-top:1px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${onu.name}</div>` : ""}
          </div>
          ${statusBadge(online ? "Up" : offline ? "Down" : onu.status)}
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;">
          ${onu.serial ? `<div class="noc-kv"><span class="noc-label">Serial</span><span class="noc-value" style="color:${C.warning};">${onu.serial}</span></div>` : ""}
          ${onu.pon    ? `<div class="noc-kv"><span class="noc-label">PON</span><span class="noc-value" style="color:${C.text};">${onu.pon}</span></div>` : ""}
          ${onu.vlan   ? `<div class="noc-kv"><span class="noc-label">VLAN</span><span class="noc-value" style="color:${C.accent};">${onu.vlan}</span></div>` : ""}
          ${onu.signal ? `<div class="noc-kv"><span class="noc-label">Sinal</span><span class="noc-value" style="color:${sigCol};">${onu.signal}</span></div>` : ""}
        </div>
      </div>`;
  }).join("");
}

// ─────────────────────────────────────────────────────────────
// API — ONU STATUS
// ─────────────────────────────────────────────────────────────

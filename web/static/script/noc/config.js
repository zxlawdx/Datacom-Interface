/**
 * NOC DATACOM — noc.js v3.2
 *
 * v3.2:
 *   - Todos os componentes visuais com estilos 100% inline (sem dependência de noc.css)
 *   - Cards de ONU com layout compacto, tipografia monospace, cores por status
 *   - Painel de detalhe reescrito com grid 2 colunas para sinais
 *   - Compatible com Tailwind CDN (sem variáveis CSS)
 */

"use strict";

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────

const API = "/core";

const OLT_META = {
  KM70:     { vlan: null, profile: null,            hint: null },
  KM17:     { vlan: null, profile: null,            hint: null },
  ABUNA:    { vlan: null, profile: null,            hint: null },
  CALAMA:   { vlan: 306,  profile: "PPPoE-Vlan306", hint: "CALAMA — VLAN 306 · PPPoE-Vlan306" },
  MOANENSE: { vlan: 304,  profile: "PPPoE-Vlan304", hint: "MOANENSE — VLAN 304 · PPPoE-Vlan304" },
};

const OLT_LABELS = {
  KM70:     "KM70 — 10.0.62.200:50022",
  KM17:     "KM17 — 10.0.54.201:50022",
  ABUNA:    "ABUNÃ — 10.0.53.201:50022",
  CALAMA:   "CALAMA — 192.168.230.37:22",
  MOANENSE: "MOANENSE — 192.168.230.46:22",
};

// ── Paleta de cores
const C = {
  text:    "#dae2fd",
  dim:     "#64748b",
  muted:   "#909097",
  border:  "#1e2535",
  bg:      "#111827",
  bgCard:  "#151d2e",
  bgLow:   "#0b1120",
  accent:  "#7bd0ff",
  success: "#4edea3",
  warning: "#ffb95f",
  danger:  "#ff6b7a",
};

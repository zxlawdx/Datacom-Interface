from __future__ import annotations

import re


def is_real_ipv4(value: str | None) -> bool:
    if not value:
        return False
    stripped = value.strip()
    if not stripped or stripped.lower() in {"n/a", "not configured", "none", "-"}:
        return False
    match = re.fullmatch(r"(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})", stripped)
    if not match:
        return False
    octets = [int(group) for group in match.groups()]
    return any(octets) and all(0 <= octet <= 255 for octet in octets)


def parse_ipv4_info(output: str) -> dict:
    def field(label: str) -> str | None:
        match = re.search(rf"{re.escape(label)}\s*:\s*(.+)", output, re.IGNORECASE)
        if not match:
            return None
        value = match.group(1).strip()
        return value or None

    mode = field("IPv4 mode")
    address = field("IPv4 address")
    gateway = field("IPv4 default gateway")
    vlan = field("IPv4 VLAN")
    cos = field("IPv4 CoS")

    mode_lower = (mode or "").lower()
    if not mode or mode_lower in {"not configured", "n/a", "none", "-", ""}:
        mode = "Not configured"
        mode_lower = "not configured"

    configured = is_real_ipv4(address)
    if configured:
        source = "olt"
        note = None
    elif "pppoe" in mode_lower or "ppp" in mode_lower:
        source = "pppoe_bras"
        note = "IP atribuído via PPPoE pelo BRAS — não visível na OLT."
    elif mode_lower == "not configured":
        source = "unknown"
        note = "Nenhum IP configurado diretamente na OLT. Cliente pode usar PPPoE via BRAS."
    else:
        source = "unknown"
        note = f"Modo '{mode}' — IP não disponível na OLT."

    return {
        "mode": mode,
        "address": address if configured else None,
        "gateway": gateway if is_real_ipv4(gateway) else None,
        "vlan": vlan if vlan and vlan not in {"N/A", "None", "-"} else None,
        "cos": cos if cos and cos not in {"N/A", "None", "-"} else None,
        "configured": configured,
        "source": source,
        "note": note,
    }

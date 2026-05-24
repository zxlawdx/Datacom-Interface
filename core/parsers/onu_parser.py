from __future__ import annotations

import re

from core.parsers.ipv4_parser import parse_ipv4_info


def parse_service_info(output: str, onu_id: int) -> dict:
    if not output:
        return {"service_port": None, "vlans": [], "pppoe_sessions": []}

    sp_match = re.search(r"service-port\s+(\d+)", output, re.IGNORECASE)
    service_port = sp_match.group(1) if sp_match else None

    seen: set[str] = set()
    vlans = []
    for vlan in re.findall(r"vlan-id\s+(\d+)", output, re.IGNORECASE):
        if vlan not in seen:
            seen.add(vlan)
            vlans.append(vlan)

    pppoe_sessions = []
    for line in output.splitlines():
        cols = line.strip().split()
        if len(cols) >= 4 and cols[1] == str(onu_id):
            mac = cols[3]
            if re.match(r"([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}", mac):
                pppoe_sessions.append({"session_id": cols[2], "mac": mac.upper()})

    return {"service_port": service_port, "vlans": vlans, "pppoe_sessions": pppoe_sessions}


def parse_onu_detail(output: str) -> dict:
    def field(label: str) -> str | None:
        match = re.search(rf"{re.escape(label)}\s*:\s*(.+)", output, re.IGNORECASE)
        return match.group(1).strip() if match else None

    def optical(label: str) -> str | None:
        match = re.search(rf"{re.escape(label)}\s*[\[(]?dBm[\])]??\s*:\s*(-?[\d.]+)", output, re.IGNORECASE)
        return match.group(1) if match else None

    rss = re.search(r"RSSI\s*\[dBm\]\s*:\s*(-?[\d.]+)", output, re.IGNORECASE)
    return {
        "serial": field("Serial Number"),
        "name": field("Name"),
        "status": field("Operational state"),
        "uptime": field("Uptime"),
        "vendor": field("Vendor ID"),
        "equipment": field("Equipment ID"),
        "version": field("Version"),
        "active_fw": field("Active FW"),
        "standby_fw": field("Standby FW"),
        "profile": field("Line Profile"),
        "distance": field("Distance"),
        "rx_power": optical("Rx Optical Power") or field("Rx Optical Power [dBm]"),
        "tx_power": optical("Tx Optical Power") or field("Tx Optical Power [dBm]"),
        "rss_power": rss.group(1) if rss else None,
        "bandwidth": field("Allocated bandwidth"),
        "fec": field("Upstream-FEC"),
        "ipv4": parse_ipv4_info(output),
    }

"""Configuração de OLTs baseada em variáveis de ambiente.

Formato suportado em DATACOM_OLTS_JSON:
{
  "KM70": {"host":"10.0.0.1", "port":50022, "user":"...", "password":"...", "type":"datacom_km"}
}

As variáveis específicas DATACOM_OLT_<NOME>_* têm prioridade sobre o JSON.
"""
from __future__ import annotations

import json
import os
from typing import Any

_DEFAULT_OLTS: dict[str, dict[str, Any]] = {
    "KM70": {"host": "10.0.62.200", "port": 50022, "user": "", "password": "", "type": "datacom_km"},
    "KM17": {"host": "10.0.54.201", "port": 50022, "user": "", "password": "", "type": "datacom_km"},
    "ABUNA": {"host": "10.0.53.201", "port": 50022, "user": "", "password": "", "type": "datacom_km"},
    "CALAMA": {"host": "192.168.230.37", "port": 22, "user": "", "password": "", "type": "datacom_km", "vlan": 306, "profile": "PPPoE-Vlan306"},
    "MOANENSE": {"host": "192.168.230.46", "port": 22, "user": "", "password": "", "type": "datacom_km", "vlan": 304, "profile": "PPPoE-Vlan304"},
}


def _env_name(name: str, field: str) -> str:
    safe = name.upper().replace('-', '_').replace(' ', '_')
    return f"DATACOM_OLT_{safe}_{field.upper()}"


def _load_json_config() -> dict[str, dict[str, Any]]:
    raw = os.getenv('DATACOM_OLTS_JSON')
    if not raw:
        return {}
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError('DATACOM_OLTS_JSON inválido') from exc
    if not isinstance(data, dict):
        raise RuntimeError('DATACOM_OLTS_JSON deve ser um objeto JSON')
    return {str(k): dict(v) for k, v in data.items() if isinstance(v, dict)}


def _with_env_overrides(base: dict[str, dict[str, Any]]) -> dict[str, dict[str, Any]]:
    merged: dict[str, dict[str, Any]] = {}
    for name, cfg in base.items():
        item = dict(cfg)
        for field in ('host', 'port', 'user', 'password', 'type', 'vlan', 'profile'):
            value = os.getenv(_env_name(name, field))
            if value is None:
                continue
            item[field] = int(value) if field in {'port', 'vlan'} and value else value
        merged[name] = item
    return merged


OLTS = _with_env_overrides({**_DEFAULT_OLTS, **_load_json_config()})

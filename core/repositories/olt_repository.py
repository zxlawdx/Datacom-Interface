from __future__ import annotations

from core.config.olts import OLTS


class OLTNotFoundError(ValueError):
    pass


class OLTRepository:
    def list(self) -> list[dict]:
        return [self._serialize(name, cfg) for name, cfg in OLTS.items()]

    def get(self, name: str | None) -> dict:
        if not name or name not in OLTS:
            raise OLTNotFoundError(f"OLT '{name}' não encontrada.")
        return dict(OLTS[name]) | {"name": name}

    def exists(self, name: str | None) -> bool:
        return bool(name and name in OLTS)

    @staticmethod
    def _serialize(name: str, cfg: dict) -> dict:
        return {
            "name": name,
            "host": cfg.get("host"),
            "port": cfg.get("port"),
            "type": cfg.get("type"),
            "vlan": cfg.get("vlan"),
            "profile": cfg.get("profile"),
        }

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor

from core.parsers.onu_parser import parse_onu_detail, parse_service_info
from core.repositories.olt_repository import OLTRepository
from core.services.olt_ssh import run_olt, show_commands, is_datacom_gc


class ONUService:
    def __init__(self, repository: OLTRepository | None = None):
        self.repository = repository or OLTRepository()

    def health(self, olt_name: str) -> dict:
        olt = self.repository.get(olt_name)
        result = run_olt(olt_name, show_commands(olt, "show version"))
        return {"online": not bool(result.get("error")), "error": result.get("error") or None}

    def status(self, olt_name: str) -> dict:
        olt = self.repository.get(olt_name)
        return run_olt(olt_name, show_commands(olt, "show interface gpon onu"))

    def discovered(self, olt_name: str) -> dict:
        olt = self.repository.get(olt_name)
        return run_olt(olt_name, show_commands(olt, "show interface gpon discovered-onus"))

    def info(self, olt_name: str, pon: str, onu_id: int) -> dict:
        olt = self.repository.get(olt_name)
        cmd_detail = f"show interface gpon {pon} onu {onu_id}"
        cmd_rss = f"show interface gpon {pon} onu {onu_id} rss"
        cmd_svcport = f'show running-config service-port | context-match "gpon {pon} onu {onu_id}"'
        cmd_pppoe = f"show pppoe intermediate-agent sessions interface gpon {pon}"

        def fetch_detail() -> dict:
            out_detail = run_olt(olt_name, show_commands(olt, cmd_detail))
            out_rss = run_olt(olt_name, show_commands(olt, cmd_rss))
            return {
                "output": f"{out_detail.get('output', '')}\n{out_rss.get('output', '')}",
                "error": out_detail.get("error") or out_rss.get("error"),
            }

        def fetch_service() -> dict:
            commands = show_commands(olt, [cmd_svcport, cmd_pppoe]) if is_datacom_gc(olt) else [cmd_svcport, cmd_pppoe]
            return run_olt(olt_name, commands)

        with ThreadPoolExecutor(max_workers=2) as pool:
            detail_future = pool.submit(fetch_detail)
            service_future = pool.submit(fetch_service)
            raw_detail = detail_future.result()
            raw_service = service_future.result()

        detail_output = raw_detail.get("output", "")
        service_output = raw_service.get("output", "")
        return {
            "detail": parse_onu_detail(detail_output),
            "service": parse_service_info(service_output, onu_id),
            "raw_detail": detail_output,
            "raw_service": service_output,
            "error": raw_detail.get("error") or raw_service.get("error"),
        }

    def signal_raw(self, olt_name: str, pon: str, onu_id: int) -> dict:
        olt = self.repository.get(olt_name)
        result = run_olt(olt_name, show_commands(olt, [
            f"show interface gpon {pon} onu {onu_id}",
            f"show interface gpon {pon} onu {onu_id} rss",
        ]))
        return {"error": result.get("error") or "", "raw_output": result.get("output", "")}

    def serviceport(self, olt_name: str, pon: str, onu_id: int) -> dict:
        olt = self.repository.get(olt_name)
        commands = [
            f'show running-config service-port | context-match "gpon {pon} onu {onu_id}"',
            f"show pppoe intermediate-agent sessions interface gpon {pon}",
        ]
        result = run_olt(olt_name, show_commands(olt, commands) if is_datacom_gc(olt) else commands)
        return {**result, **parse_service_info(result.get("output", ""), onu_id)}

    def reboot(self, olt_name: str, pon: str, onu_id: int) -> dict:
        self.repository.get(olt_name)
        return run_olt(olt_name, ["conf terminal", f"interface gpon {pon}", f"onu-reset onu {onu_id}", "top"])

    def activate(self, data: dict) -> dict:
        self.repository.get(data["olt"])
        commands = [
            "config terminal",
            f"interface gpon {data['pon']}",
            f"onu {data['onu_id']}",
            f"name {data['name']}",
            f"serial-number {data['serial']}",
            f"line-profile {data['profile']}",
            "ethernet 1",
            "no shutdown",
            "negotiation",
            f"native vlan vlan-id {data['vlan']}",
            "top",
            f"service-port {data['service_port']} gpon {data['pon']} onu {data['onu_id']} gem 1 match vlan vlan-id {data['vlan']} action vlan replace vlan-id {data['vlan']}",
            "top",
            "commit",
        ]
        return run_olt(data["olt"], commands)

    def delete(self, olt_name: str, pon: str, onu_id: int, service_port: int | None = None) -> dict:
        self.repository.get(olt_name)
        commands = ["config terminal"]
        if service_port:
            commands.append(f"no service-port {service_port}")
        commands.extend([f"interface gpon {pon}", f"no onu {onu_id}", "commit"])
        return run_olt(olt_name, commands)

    def terminal(self, olt_name: str, command: str) -> dict:
        olt = self.repository.get(olt_name)
        lower = command.lower().strip()
        direct_prefixes = ("show", "ping", "traceroute", "exit", "end", "top", "do")
        if is_datacom_gc(olt):
            if lower in {"config terminal", "conf t"}:
                commands = ["config terminal"]
            elif any(lower.startswith(prefix) for prefix in direct_prefixes):
                commands = [command]
            else:
                commands = ["config terminal", command]
        else:
            commands = [command]
        return run_olt(olt_name, commands)

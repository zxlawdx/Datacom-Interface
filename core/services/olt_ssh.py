from __future__ import annotations

import logging
import os
import time
from collections.abc import Sequence
from dataclasses import dataclass

import paramiko

from core.repositories.olt_repository import OLTRepository, OLTNotFoundError

logger = logging.getLogger(__name__)

_RECV_SIZE = 65535
_CMD_DELAY = float(os.getenv("DATACOM_SSH_COMMAND_DELAY", "1.0"))
_LONG_DELAY = float(os.getenv("DATACOM_SSH_LONG_COMMAND_DELAY", "3.0"))
_CONNECT_TIMEOUT = int(os.getenv("DATACOM_SSH_CONNECT_TIMEOUT", "8"))
_RETRY_ATTEMPTS = int(os.getenv("DATACOM_SSH_RETRY_ATTEMPTS", "2"))
_RETRY_BACKOFF = float(os.getenv("DATACOM_SSH_RETRY_BACKOFF", "0.7"))

_SLOW_COMMANDS = frozenset({"show interface gpon onu", "do show interface gpon onu"})


@dataclass(frozen=True)
class CommandResult:
    output: str = ""
    error: str = ""

    def as_dict(self) -> dict:
        return {"output": self.output, "error": self.error}


def is_datacom_gc(olt: dict) -> bool:
    return olt.get("type") == "datacom_gc"


def show_commands(olt: dict, commands: str | Sequence[str]) -> list[str]:
    if isinstance(commands, str):
        commands = [commands]
    if not is_datacom_gc(olt):
        return list(commands)
    return ["config terminal", *[f"do {command}" for command in commands]]


def _drain(shell, timeout: float = 1.0) -> str:
    output = ""
    deadline = time.time() + timeout
    while time.time() < deadline:
        if shell.recv_ready():
            output += shell.recv(_RECV_SIZE).decode("utf-8", errors="replace")
            deadline = time.time() + timeout
        else:
            time.sleep(0.1)
    return output


def _with_retry(fn, *, action: str) -> CommandResult:
    last_exc: Exception | None = None
    for attempt in range(1, _RETRY_ATTEMPTS + 2):
        try:
            return fn()
        except Exception as exc:  # pragma: no cover - depende de rede real
            last_exc = exc
            logger.warning("ssh_attempt_failed", extra={"action": action, "attempt": attempt, "error": str(exc)})
            if attempt <= _RETRY_ATTEMPTS:
                time.sleep(_RETRY_BACKOFF * attempt)
    return CommandResult(error=str(last_exc) if last_exc else "Erro SSH desconhecido")


def run_ssh_simple(host: str, port: int, user: str, password: str, command: str) -> dict:
    def execute() -> CommandResult:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        try:
            client.connect(hostname=host, port=port, username=user, password=password, timeout=_CONNECT_TIMEOUT)
            _, stdout, stderr = client.exec_command(command)
            return CommandResult(
                output=stdout.read().decode("utf-8", errors="replace"),
                error=stderr.read().decode("utf-8", errors="replace"),
            )
        finally:
            client.close()

    return _with_retry(execute, action="exec_command").as_dict()


def run_ssh_interactive(host: str, port: int, user: str, password: str, commands: Sequence[str]) -> dict:
    def execute() -> CommandResult:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        try:
            client.connect(hostname=host, port=port, username=user, password=password, timeout=_CONNECT_TIMEOUT)
            shell = client.invoke_shell()
            time.sleep(1)
            _drain(shell, timeout=1.0)
            output = ""
            for command in commands:
                shell.send(command + "\n")
                delay = _LONG_DELAY if command.strip() in _SLOW_COMMANDS else _CMD_DELAY
                output += _drain(shell, timeout=delay)
            return CommandResult(output=output)
        finally:
            client.close()

    return _with_retry(execute, action="invoke_shell").as_dict()


def run_olt(olt_name: str, commands: str | Sequence[str]) -> dict:
    try:
        olt = OLTRepository().get(olt_name)
    except OLTNotFoundError as exc:
        return {"output": "", "error": str(exc)}

    if isinstance(commands, str):
        commands = [commands]

    if not olt.get("user") or not olt.get("password"):
        return {"output": "", "error": f"Credenciais da OLT '{olt_name}' não configuradas em variáveis de ambiente."}

    logger.info("olt_command_started", extra={"olt": olt_name, "commands": len(commands)})
    if is_datacom_gc(olt):
        result = run_ssh_interactive(olt["host"], int(olt["port"]), olt["user"], olt["password"], list(commands))
    else:
        result = run_ssh_simple(olt["host"], int(olt["port"]), olt["user"], olt["password"], "\n".join(commands))
    logger.info("olt_command_finished", extra={"olt": olt_name, "has_error": bool(result.get("error"))})
    return result

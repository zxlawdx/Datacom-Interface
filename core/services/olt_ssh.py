import paramiko
import time
from core.config.olts import OLTS




def run_ssh_simple(host, port, user, password, command: str):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    client.connect(
        hostname=host,
        port=port,
        username=user,
        password=password,
        timeout=8
    )

    stdin, stdout, stderr = client.exec_command(command)

    output = stdout.read().decode("utf-8", errors="replace")
    error = stderr.read().decode("utf-8", errors="replace")

    client.close()

    return {"output": output, "error": error}


def run_ssh_interactive(host, port, user, password, commands):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    client.connect(hostname=host, port=port, username=user, password=password)

    shell = client.invoke_shell()
    time.sleep(1)

    output = ""

    for cmd in commands:
        shell.send(cmd + "\n")
        time.sleep(1)

        if shell.recv_ready():
            output += shell.recv(65535).decode()

    client.close()

    return {"output": output, "error": ""}


def run_olt(olt_name: str, commands):
    olt = OLTS.get(olt_name)

    if not olt:
        return {"output": "", "error": "OLT não encontrada"}

    if isinstance(commands, str):
        commands = [commands]

    if olt["type"] == "datacom_gc":
        return run_ssh_interactive(
            olt["host"], olt["port"], olt["user"], olt["password"], commands
        )

    return run_ssh_simple(
        olt["host"], olt["port"], olt["user"], olt["password"],
        "\n".join(commands)
    )
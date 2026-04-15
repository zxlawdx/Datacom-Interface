import paramiko

def run_ssh_command(host, port, user, password, command):
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        port = port if port else 22

        client.connect(
            hostname=host,
            port=port,
            username=user,
            password=password,
            timeout=5
        )

        stdin, stdout, stderr = client.exec_command(command)

        output = stdout.read().decode()
        error = stderr.read().decode()

        client.close()

        return {
            "output": output,
            "error": error
        }

    except Exception as e:
        return {
            "output": "",
            "error": str(e)
        }
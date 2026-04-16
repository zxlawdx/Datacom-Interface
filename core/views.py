# core/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from core.services.olt_ssh import run_olt
from core.config.olts import OLTS
from .serializers import SignalRequestSerializer


# ─────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────

@api_view(["GET"])
def health(request, olt_name):
    olt = OLTS.get(olt_name)

    if not olt:
        return Response({"online": False, "error": f"OLT '{olt_name}' não encontrada."})

    try:
        if olt.get("type") == "datacom_gc":
            cmds = ["config terminal", "do show version"]
        else:
            cmds = ["show version"]

        result = run_olt(olt_name, cmds)

        if result.get("error"):
            return Response({"online": False, "error": result["error"]})

        return Response({"online": True})

    except Exception as e:
        return Response({"online": False, "error": str(e)})


# ─────────────────────────────────────────
# ONU STATUS
# ─────────────────────────────────────────

@api_view(["POST"])
def onu_status(request):
    olt_name = request.data.get("olt")

    if olt_name not in OLTS:
        return Response({"error": "OLT não encontrada"}, status=status.HTTP_404_NOT_FOUND)

    olt = OLTS[olt_name]
    if olt.get("type") == "datacom_gc":
        cmds = ["config terminal", "do show interface gpon onu"]
    else:
        cmds = ["show interface gpon onu"]

    result = run_olt(olt_name, cmds)
    return Response(result)


# ─────────────────────────────────────────
# ONU DISCOVERED
# ─────────────────────────────────────────

@api_view(["POST"])
def onu_discovered(request):
    olt_name = request.data.get("olt")

    if olt_name not in OLTS:
        return Response({"error": "OLT não encontrada"}, status=status.HTTP_404_NOT_FOUND)

    olt = OLTS[olt_name]
    if olt.get("type") == "datacom_gc":
        cmds = ["config terminal", "do show interface gpon discovered-onus"]
    else:
        cmds = ["show interface gpon discovered-onus"]

    result = run_olt(olt_name, cmds)
    return Response(result)


# ─────────────────────────────────────────
# SIGNAL (RSSI)
# ─────────────────────────────────────────

@api_view(["POST"])
def signal(request):
    serializer = SignalRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    result = run_olt(
        data["olt"],
        [f"show interface gpon {data['pon']} onu {data['onu_id']} rssi"]
    )
    return Response(result)


# ─────────────────────────────────────────
# ONU ACTIVATE
# ─────────────────────────────────────────

@api_view(["POST"])
def onu_activate(request):
    d = request.data

    required = ["olt", "pon", "onu_id", "serial", "name", "vlan", "profile", "service_port"]
    for field in required:
        if field not in d:
            return Response({"error": f"Campo obrigatório ausente: {field}"}, status=status.HTTP_400_BAD_REQUEST)

    olt_name = d["olt"]
    if olt_name not in OLTS:
        return Response({"error": "OLT não encontrada"}, status=status.HTTP_404_NOT_FOUND)

    cmds = [
        "config terminal",
        f"interface gpon {d['pon']}",
        f"onu {d['onu_id']}",
        f"name {d['name']}",
        f"serial-number {d['serial']}",
        f"line-profile {d['profile']}",
        "ethernet 1",
        "no shutdown",
        "negotiation",
        f"native vlan vlan-id {d['vlan']}",
        "top",
        (
            f"service-port {d['service_port']} gpon {d['pon']} onu {d['onu_id']} "
            f"gem 1 match vlan vlan-id {d['vlan']} action vlan replace vlan-id {d['vlan']}"
        ),
        "top",
        "commit",
    ]

    result = run_olt(olt_name, cmds)
    return Response(result)


# ─────────────────────────────────────────
# ONU DELETE
# ─────────────────────────────────────────

@api_view(["POST"])
def onu_delete(request):
    d = request.data

    required = ["olt", "pon", "onu_id"]
    for field in required:
        if field not in d:
            return Response({"error": f"Campo obrigatório ausente: {field}"}, status=status.HTTP_400_BAD_REQUEST)

    olt_name = d["olt"]
    if olt_name not in OLTS:
        return Response({"error": "OLT não encontrada"}, status=status.HTTP_404_NOT_FOUND)

    cmds = [
        "config terminal",
        f"interface gpon {d['pon']}",
        f"no onu {d['onu_id']}",
        "commit",
    ]

    result = run_olt(olt_name, cmds)
    return Response(result)


# ─────────────────────────────────────────
# TERMINAL
# ─────────────────────────────────────────

@api_view(["POST"])
def olt_terminal(request):
    olt_name = request.data.get("olt")
    command  = request.data.get("command")

    if not olt_name or not command:
        return Response({"error": "Campos 'olt' e 'command' são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)

    if olt_name not in OLTS:
        return Response({"error": "OLT não encontrada"}, status=status.HTTP_404_NOT_FOUND)

    result = run_olt(olt_name, command)
    return Response(result)
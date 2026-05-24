from __future__ import annotations

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.repositories.olt_repository import OLTNotFoundError, OLTRepository
from core.serializers import (
    ActivateONUSerializer,
    DeleteONUSerializer,
    OLTTerminalSerializer,
    ONUDetailRequestSerializer,
    SSHRequestSerializer,
    SignalRequestSerializer,
)
from core.services.onu_service import ONUService

service = ONUService()
repository = OLTRepository()


def _validated(serializer_class, request):
    serializer = serializer_class(data=request.data)
    serializer.is_valid(raise_exception=True)
    return serializer.validated_data


def _safe_call(fn):
    try:
        return Response(fn())
    except OLTNotFoundError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
def olts(request):
    return Response({"results": repository.list()})


@api_view(["GET"])
def health(request, olt_name):
    return _safe_call(lambda: service.health(olt_name))


@api_view(["POST"])
def onu_status(request):
    data = _validated(SSHRequestSerializer, request)
    return _safe_call(lambda: service.status(data["olt"]))


@api_view(["POST"])
def onu_discovered(request):
    data = _validated(SSHRequestSerializer, request)
    return _safe_call(lambda: service.discovered(data["olt"]))


@api_view(["POST"])
def onu_info(request):
    data = _validated(ONUDetailRequestSerializer, request)
    return _safe_call(lambda: service.info(data["olt"], data["pon"], data["onu_id"]))


@api_view(["POST"])
def onu_signal(request):
    data = _validated(SignalRequestSerializer, request)
    return _safe_call(lambda: service.signal_raw(data["olt"], data["pon"], data["onu_id"]))


@api_view(["POST"])
def onu_serviceport(request):
    data = _validated(SignalRequestSerializer, request)
    return _safe_call(lambda: service.serviceport(data["olt"], data["pon"], data["onu_id"]))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def onu_reboot(request):
    data = _validated(SignalRequestSerializer, request)
    return _safe_call(lambda: service.reboot(data["olt"], data["pon"], data["onu_id"]))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def onu_activate(request):
    data = _validated(ActivateONUSerializer, request)
    return _safe_call(lambda: service.activate(data))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def onu_delete(request):
    data = _validated(DeleteONUSerializer, request)
    return _safe_call(lambda: service.delete(data["olt"], data["pon"], data["onu_id"], data.get("service_port")))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def olt_terminal(request):
    data = _validated(OLTTerminalSerializer, request)
    return _safe_call(lambda: service.terminal(data["olt"], data["command"]))

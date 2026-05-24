from __future__ import annotations

from rest_framework import serializers

from core.repositories.olt_repository import OLTRepository


class OLTNameMixin:
    def validate_olt(self, value: str) -> str:
        if not OLTRepository().exists(value):
            raise serializers.ValidationError(f"OLT '{value}' não encontrada.")
        return value


class SSHRequestSerializer(OLTNameMixin, serializers.Serializer):
    olt = serializers.CharField(max_length=64)


class SignalRequestSerializer(OLTNameMixin, serializers.Serializer):
    olt = serializers.CharField(max_length=64)
    pon = serializers.RegexField(regex=r"^\d+/\d+/\d+$", max_length=32)
    onu_id = serializers.IntegerField(min_value=0, max_value=128)


class ActivateONUSerializer(SignalRequestSerializer):
    serial = serializers.CharField(max_length=64, trim_whitespace=True)
    name = serializers.CharField(max_length=128, trim_whitespace=True)
    vlan = serializers.IntegerField(min_value=1, max_value=4094)
    profile = serializers.CharField(max_length=128, trim_whitespace=True)
    service_port = serializers.IntegerField(min_value=1)


class DeleteONUSerializer(SignalRequestSerializer):
    service_port = serializers.IntegerField(min_value=1, required=False)


class ONUDetailRequestSerializer(SignalRequestSerializer):
    pass


class OLTTerminalSerializer(OLTNameMixin, serializers.Serializer):
    olt = serializers.CharField(max_length=64)
    command = serializers.CharField(max_length=512, trim_whitespace=True)

    BLOCKED_PREFIXES = ("reload", "reboot system", "factory-reset", "erase", "format")

    def validate_command(self, value: str) -> str:
        lowered = value.strip().lower()
        if not lowered:
            raise serializers.ValidationError("Comando não pode ser vazio.")
        if any(lowered.startswith(prefix) for prefix in self.BLOCKED_PREFIXES):
            raise serializers.ValidationError("Comando bloqueado por segurança.")
        return value.strip()

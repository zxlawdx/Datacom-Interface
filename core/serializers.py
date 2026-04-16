from rest_framework import serializers


class SSHRequestSerializer(serializers.Serializer):
    olt = serializers.CharField()


class SignalRequestSerializer(serializers.Serializer):
    olt = serializers.CharField()
    pon = serializers.CharField()
    onu_id = serializers.IntegerField()


class ActivateONUSerializer(serializers.Serializer):
    olt = serializers.CharField()
    pon = serializers.CharField()
    onu_id = serializers.IntegerField()
    serial = serializers.CharField()
    name = serializers.CharField()
    vlan = serializers.IntegerField()
    profile = serializers.CharField()
    service_port = serializers.IntegerField()


class DeleteONUSerializer(serializers.Serializer):
    olt = serializers.CharField()
    pon = serializers.CharField()
    onu_id = serializers.IntegerField()
    service_port = serializers.IntegerField()


class ONUDetailRequestSerializer(serializers.Serializer):
    olt = serializers.CharField()
    pon = serializers.CharField()
    onu_id = serializers.IntegerField()


class OLTTerminalSerializer(serializers.Serializer):
    olt = serializers.CharField()
    command = serializers.CharField()
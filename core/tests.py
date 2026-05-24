from __future__ import annotations

from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from core.parsers.ipv4_parser import is_real_ipv4, parse_ipv4_info
from core.parsers.onu_parser import parse_onu_detail, parse_service_info
from core.repositories.olt_repository import OLTNotFoundError, OLTRepository
from core.serializers import OLTTerminalSerializer, SignalRequestSerializer
from core.services.onu_service import ONUService


class ParserTests(TestCase):
    def test_ipv4_real_validation(self):
        self.assertTrue(is_real_ipv4("192.168.1.10"))
        self.assertFalse(is_real_ipv4("0.0.0.0"))
        self.assertFalse(is_real_ipv4("999.1.1.1"))
        self.assertFalse(is_real_ipv4("not configured"))

    def test_ipv4_parser_pppoe_note(self):
        parsed = parse_ipv4_info("IPv4 mode : PPPoE\nIPv4 address : 0.0.0.0")
        self.assertFalse(parsed["configured"])
        self.assertEqual(parsed["source"], "pppoe_bras")

    def test_onu_detail_parser(self):
        output = """
        Serial Number : ABCD12345678
        Name : CLIENTE_TESTE
        Operational state : up
        Rx Optical Power [dBm] : -22.4
        RSSI [dBm] : -24.1
        IPv4 mode : static
        IPv4 address : 10.10.10.2
        """
        parsed = parse_onu_detail(output)
        self.assertEqual(parsed["serial"], "ABCD12345678")
        self.assertEqual(parsed["status"], "up")
        self.assertEqual(parsed["rx_power"], "-22.4")
        self.assertTrue(parsed["ipv4"]["configured"])

    def test_service_info_parser(self):
        parsed = parse_service_info("service-port 123 vlan-id 304 vlan-id 304", onu_id=1)
        self.assertEqual(parsed["service_port"], "123")
        self.assertEqual(parsed["vlans"], ["304"])


class RepositoryAndSerializerTests(TestCase):
    def test_repository_lists_public_olt_fields_without_password(self):
        item = OLTRepository().list()[0]
        self.assertIn("name", item)
        self.assertNotIn("password", item)

    def test_repository_raises_for_unknown_olt(self):
        with self.assertRaises(OLTNotFoundError):
            OLTRepository().get("NAO_EXISTE")

    def test_signal_serializer_rejects_invalid_pon(self):
        serializer = SignalRequestSerializer(data={"olt": "KM70", "pon": "abc", "onu_id": 1})
        self.assertFalse(serializer.is_valid())
        self.assertIn("pon", serializer.errors)

    def test_terminal_serializer_blocks_dangerous_commands(self):
        serializer = OLTTerminalSerializer(data={"olt": "KM70", "command": "reload now"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("command", serializer.errors)


class ApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_olts_endpoint_exists(self):
        response = self.client.get("/core/olts/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("results", response.json())

    def test_reboot_requires_authentication(self):
        response = self.client.post("/core/onu/reboot/", {"olt": "KM70", "pon": "1/1/1", "onu_id": 1}, format="json")
        self.assertEqual(response.status_code, 403)

    @patch("core.services.onu_service.run_olt")
    def test_authenticated_reboot_calls_service(self, run_olt):
        run_olt.return_value = {"output": "ok", "error": ""}
        User.objects.create_user(username="admin", password="admin12345")
        self.client.login(username="admin", password="admin12345")
        response = self.client.post("/core/onu/reboot/", {"olt": "KM70", "pon": "1/1/1", "onu_id": 1}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["output"], "ok")


class ServiceTests(TestCase):
    @patch("core.services.onu_service.run_olt")
    def test_info_combines_detail_and_service_data(self, run_olt):
        run_olt.side_effect = [
            {"output": "Serial Number : ABCD12345678\nOperational state : up", "error": ""},
            {"output": "RSSI [dBm] : -23.0", "error": ""},
            {"output": "service-port 900 vlan-id 304", "error": ""},
        ]
        result = ONUService().info("KM70", "1/1/1", 1)
        self.assertEqual(result["detail"]["serial"], "ABCD12345678")
        self.assertEqual(result["service"]["service_port"], "900")

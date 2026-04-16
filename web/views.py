# web/views.py
from django.shortcuts import render
from core.config.olts import OLTS


def _olt_context():
    """Constrói lista de OLTs para os templates."""
    return {
        "olts": [
            {
                "name": name,
                "host": cfg["host"],
                "port": cfg["port"],
                "vlan": cfg.get("vlan"),
                "profile": cfg.get("profile"),
            }
            for name, cfg in OLTS.items()
        ]
    }


def dashboard(request):
    return render(request, "dashboard.html", _olt_context())

def onus(request):
    return render(request, "onus.html", _olt_context())

def discovered(request):
    return render(request, "discovered.html", _olt_context())

def activate(request):
    return render(request, "activate.html", _olt_context())

def terminal(request):
    return render(request, "terminal.html", _olt_context())

def delete(request):
    return render(request, "delete.html", _olt_context())
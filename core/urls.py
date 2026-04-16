# core/urls.py
from django.urls import path
from .views import (
    health,
    onu_status,
    onu_discovered,
    onu_activate,
    onu_delete,
    olt_terminal,
    signal,
)

urlpatterns = [
    # Health
    path("health/<str:olt_name>/", health),

    # ONU
    path("onu/status/",     onu_status),
    path("onu/discovered/", onu_discovered),
    path("onu/activate/",   onu_activate),
    path("onu/delete/",     onu_delete),

    # Terminal
    path("olt/terminal/",   olt_terminal),

    # Signal
    path("signal/",         signal),
]
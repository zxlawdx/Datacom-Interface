from django.urls import path

from core.api import views

urlpatterns = [
    path("olts/", views.olts, name="olts"),
    path("health/<str:olt_name>/", views.health, name="health"),
    path("onu/status/", views.onu_status, name="onu_status"),
    path("onu/discovered/", views.onu_discovered, name="onu_discovered"),
    path("onu/info/", views.onu_info, name="onu_info"),
    path("onu/signal/", views.onu_signal, name="onu_signal"),
    path("onu/serviceport/", views.onu_serviceport, name="onu_serviceport"),
    path("onu/activate/", views.onu_activate, name="onu_activate"),
    path("onu/delete/", views.onu_delete, name="onu_delete"),
    path("onu/reboot/", views.onu_reboot, name="onu_reboot"),
    path("olt/terminal/", views.olt_terminal, name="olt_terminal"),
]

# web/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('',           views.dashboard,  name='dashboard'),
    path('onus/',      views.onus,       name='onus'),
    path('discovered/',views.discovered, name='discovered'),
    path('activate/',  views.activate,   name='activate'),
    path('terminal/',  views.terminal,   name='terminal'),
    path('delete/',    views.delete,     name='delete'),
]
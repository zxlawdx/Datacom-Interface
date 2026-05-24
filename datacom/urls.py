from django.contrib import admin
from django.http import HttpResponse
from django.urls import include, path


def ping(request):
    return HttpResponse("URL raiz OK")


urlpatterns = [
    path("admin/", admin.site.urls),
    path("ping/", ping, name="ping"),
    path("core/", include("core.urls")),
    path("", include("web.urls")),
]

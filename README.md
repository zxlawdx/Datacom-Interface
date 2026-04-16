
```
Datacom
├─ README.md
├─ core
│  ├─ __init__.py
│  ├─ admin.py
│  ├─ apps.py
│  ├─ config
│  │  └─ olts.py
│  ├─ migrations
│  │  ├─ 0001_initial.py
│  │  └─ __init__.py
│  ├─ models.py
│  ├─ serializers.py
│  ├─ services
│  │  └─ olt_ssh.py
│  ├─ tests.py
│  ├─ urls.py
│  └─ views.py
├─ datacom
│  ├─ __init__.py
│  ├─ asgi.py
│  ├─ settings.py
│  ├─ urls.py
│  └─ wsgi.py
├─ db.sqlite3
├─ docker
│  ├─ django
│  │  ├─ Dockerfile
│  │  ├─ docker-compose.yml
│  │  ├─ entrypoint.sh
│  │  └─ nginx
│  │     └─ default.conf
│  └─ nginx
│     └─ nginx.conf
├─ manage.py
├─ requirements.txt
├─ runtime.txt
├─ staticfiles
│  ├─ admin
│  │  ├─ css
│  │  │  ├─ autocomplete.css
│  │  │  ├─ base.css
│  │  │  ├─ changelists.css
│  │  │  ├─ dark_mode.css
│  │  │  ├─ dashboard.css
│  │  │  ├─ forms.css
│  │  │  ├─ login.css
│  │  │  ├─ nav_sidebar.css
│  │  │  ├─ responsive.css
│  │  │  ├─ responsive_rtl.css
│  │  │  ├─ rtl.css
│  │  │  ├─ unusable_password_field.css
│  │  │  ├─ vendor
│  │  │  │  └─ select2
│  │  │  │     ├─ LICENSE-SELECT2.md
│  │  │  │     ├─ select2.css
│  │  │  │     └─ select2.min.css
│  │  │  └─ widgets.css
│  │  ├─ img
│  │  │  ├─ README.md
│  │  │  ├─ calendar-icons.svg
│  │  │  ├─ icon-addlink.svg
│  │  │  ├─ icon-alert-dark.svg
│  │  │  ├─ icon-alert.svg
│  │  │  ├─ icon-calendar.svg
│  │  │  ├─ icon-changelink.svg
│  │  │  ├─ icon-clock.svg
│  │  │  ├─ icon-debug-dark.svg
│  │  │  ├─ icon-debug.svg
│  │  │  ├─ icon-deletelink.svg
│  │  │  ├─ icon-hidelink.svg
│  │  │  ├─ icon-info-dark.svg
│  │  │  ├─ icon-info.svg
│  │  │  ├─ icon-no-dark.svg
│  │  │  ├─ icon-no.svg
│  │  │  ├─ icon-unknown-alt.svg
│  │  │  ├─ icon-unknown.svg
│  │  │  ├─ icon-viewlink.svg
│  │  │  ├─ icon-yes-dark.svg
│  │  │  ├─ icon-yes.svg
│  │  │  ├─ inline-delete.svg
│  │  │  ├─ search.svg
│  │  │  ├─ selector-icons.svg
│  │  │  ├─ sorting-icons.svg
│  │  │  ├─ tooltag-add.svg
│  │  │  └─ tooltag-arrowright.svg
│  │  └─ js
│  │     ├─ SelectBox.js
│  │     ├─ SelectFilter2.js
│  │     ├─ actions.js
│  │     ├─ admin
│  │     │  ├─ DateTimeShortcuts.js
│  │     │  └─ RelatedObjectLookups.js
│  │     ├─ autocomplete.js
│  │     ├─ calendar.js
│  │     ├─ cancel.js
│  │     ├─ change_form.js
│  │     ├─ core.js
│  │     ├─ filters.js
│  │     ├─ inlines.js
│  │     ├─ jquery.init.js
│  │     ├─ nav_sidebar.js
│  │     ├─ popup_response.js
│  │     ├─ prepopulate.js
│  │     ├─ prepopulate_init.js
│  │     ├─ theme.js
│  │     ├─ urlify.js
│  │     └─ vendor
│  │        ├─ jquery
│  │        │  ├─ LICENSE.txt
│  │        │  ├─ jquery.js
│  │        │  └─ jquery.min.js
│  │        ├─ select2
│  │        │  ├─ LICENSE.md
│  │        │  ├─ i18n
│  │        │  │  ├─ af.js
│  │        │  │  ├─ ar.js
│  │        │  │  ├─ az.js
│  │        │  │  ├─ bg.js
│  │        │  │  ├─ bn.js
│  │        │  │  ├─ bs.js
│  │        │  │  ├─ ca.js
│  │        │  │  ├─ cs.js
│  │        │  │  ├─ da.js
│  │        │  │  ├─ de.js
│  │        │  │  ├─ dsb.js
│  │        │  │  ├─ el.js
│  │        │  │  ├─ en.js
│  │        │  │  ├─ es.js
│  │        │  │  ├─ et.js
│  │        │  │  ├─ eu.js
│  │        │  │  ├─ fa.js
│  │        │  │  ├─ fi.js
│  │        │  │  ├─ fr.js
│  │        │  │  ├─ gl.js
│  │        │  │  ├─ he.js
│  │        │  │  ├─ hi.js
│  │        │  │  ├─ hr.js
│  │        │  │  ├─ hsb.js
│  │        │  │  ├─ hu.js
│  │        │  │  ├─ hy.js
│  │        │  │  ├─ id.js
│  │        │  │  ├─ is.js
│  │        │  │  ├─ it.js
│  │        │  │  ├─ ja.js
│  │        │  │  ├─ ka.js
│  │        │  │  ├─ km.js
│  │        │  │  ├─ ko.js
│  │        │  │  ├─ lt.js
│  │        │  │  ├─ lv.js
│  │        │  │  ├─ mk.js
│  │        │  │  ├─ ms.js
│  │        │  │  ├─ nb.js
│  │        │  │  ├─ ne.js
│  │        │  │  ├─ nl.js
│  │        │  │  ├─ pl.js
│  │        │  │  ├─ ps.js
│  │        │  │  ├─ pt-BR.js
│  │        │  │  ├─ pt.js
│  │        │  │  ├─ ro.js
│  │        │  │  ├─ ru.js
│  │        │  │  ├─ sk.js
│  │        │  │  ├─ sl.js
│  │        │  │  ├─ sq.js
│  │        │  │  ├─ sr-Cyrl.js
│  │        │  │  ├─ sr.js
│  │        │  │  ├─ sv.js
│  │        │  │  ├─ th.js
│  │        │  │  ├─ tk.js
│  │        │  │  ├─ tr.js
│  │        │  │  ├─ uk.js
│  │        │  │  ├─ vi.js
│  │        │  │  ├─ zh-CN.js
│  │        │  │  └─ zh-TW.js
│  │        │  ├─ select2.full.js
│  │        │  └─ select2.full.min.js
│  │        └─ xregexp
│  │           ├─ LICENSE.txt
│  │           ├─ xregexp.js
│  │           └─ xregexp.min.js
│  ├─ css
│  │  └─ noc.css
│  ├─ rest_framework
│  │  ├─ css
│  │  │  ├─ bootstrap-theme.min.css
│  │  │  ├─ bootstrap-theme.min.css.map
│  │  │  ├─ bootstrap-tweaks.css
│  │  │  ├─ bootstrap.min.css
│  │  │  ├─ bootstrap.min.css.map
│  │  │  ├─ default.css
│  │  │  ├─ font-awesome-4.0.3.css
│  │  │  └─ prettify.css
│  │  ├─ fonts
│  │  │  ├─ fontawesome-webfont.eot
│  │  │  ├─ fontawesome-webfont.svg
│  │  │  ├─ fontawesome-webfont.ttf
│  │  │  ├─ fontawesome-webfont.woff
│  │  │  ├─ glyphicons-halflings-regular.eot
│  │  │  ├─ glyphicons-halflings-regular.svg
│  │  │  ├─ glyphicons-halflings-regular.ttf
│  │  │  ├─ glyphicons-halflings-regular.woff
│  │  │  └─ glyphicons-halflings-regular.woff2
│  │  ├─ img
│  │  │  ├─ glyphicons-halflings-white.png
│  │  │  ├─ glyphicons-halflings.png
│  │  │  └─ grid.png
│  │  └─ js
│  │     ├─ ajax-form.js
│  │     ├─ bootstrap.min.js
│  │     ├─ csrf.js
│  │     ├─ default.js
│  │     ├─ jquery-3.7.1.min.js
│  │     ├─ load-ajax-form.js
│  │     └─ prettify-min.js
│  └─ script
│     ├─ api.js
│     └─ noc.js
└─ web
   ├─ __init__.py
   ├─ admin.py
   ├─ apps.py
   ├─ migrations
   │  └─ __init__.py
   ├─ models.py
   ├─ static
   │  ├─ css
   │  │  └─ noc.css
   │  └─ script
   │     └─ noc.js
   ├─ templates
   │  ├─ activate.html
   │  ├─ dashboard.html
   │  ├─ delete.html
   │  ├─ discovered.html
   │  ├─ onus.html
   │  ├─ partials
   │  │  └─ sidebar.html
   │  └─ terminal.html
   ├─ tests.py
   ├─ urls.py
   └─ views.py
```
Datacom
├─ README.md
├─ core
│  ├─ __init__.py
│  ├─ admin.py
│  ├─ apps.py
│  ├─ config
│  │  └─ olts.py
│  ├─ migrations
│  │  ├─ 0001_initial.py
│  │  └─ __init__.py
│  ├─ models.py
│  ├─ serializers.py
│  ├─ services
│  │  └─ olt_ssh.py
│  ├─ tests.py
│  ├─ urls.py
│  └─ views.py
├─ datacom
│  ├─ __init__.py
│  ├─ asgi.py
│  ├─ settings.py
│  ├─ urls.py
│  └─ wsgi.py
├─ db.sqlite3
├─ docker
│  ├─ django
│  │  ├─ Dockerfile
│  │  ├─ docker-compose.yml
│  │  ├─ entrypoint.sh
│  │  └─ nginx
│  └─ nginx
│     └─ nginx.conf
├─ manage.py
├─ requirements.txt
├─ runtime.txt
└─ web
   ├─ __init__.py
   ├─ admin.py
   ├─ apps.py
   ├─ migrations
   │  └─ __init__.py
   ├─ models.py
   ├─ static
   │  ├─ css
   │  │  └─ noc.css
   │  └─ script
   │     ├─ api.js
   │     └─ noc.js
   ├─ templates
   │  ├─ activate.html
   │  ├─ dashboard.html
   │  ├─ delete.html
   │  ├─ discovered.html
   │  ├─ onus.html
   │  ├─ partials
   │  │  └─ sidebar.html
   │  └─ terminal.html
   ├─ tests.py
   ├─ urls.py
   └─ views.py

```
```
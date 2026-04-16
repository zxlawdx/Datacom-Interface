#!/bin/bash
set -e

echo "Ajustando permissões..."
# O comando abaixo garante que o usuário atual tenha posse da pasta de estáticos
# (Se o chown falhar por falta de sudo, faremos o ajuste no Dockerfile)

echo "Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

echo "Aplicando migrações..."
python manage.py migrate --noinput

echo "Iniciando Gunicorn..."
exec python -m gunicorn --bind 0.0.0.0:8000 datacom.wsgi:application

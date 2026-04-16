FROM python:3.12-slim-bullseye

WORKDIR /app

# 1. Instala dependências do sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential netcat-openbsd && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Adicione isso para garantir que o Gunicorn seja encontrado
ENV PATH="/home/django/.local/bin:${PATH}"


# 3. Copia TODO o projeto da raiz para /app
COPY . .

# 4. Ajusta o caminho do entrypoint (estava dentro de docker/django/)
# ... (após o COPY . .)

# 4. Ajusta o caminho do entrypoint e CRIA as pastas de volumes
RUN adduser --disabled-password --gecos '' django && \
    mkdir -p /app/staticfiles /app/mediafiles && \
    chmod +x /app/docker/django/entrypoint.sh && \
    chown -R django:django /app

USER django
# ...


# 5. Aponta para o caminho correto onde o arquivo foi parar
ENTRYPOINT ["/app/docker/django/entrypoint.sh"]

# 6. Ajuste o comando do Gunicorn (seu projeto chama 'datacom', não 'meu_projeto')
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "datacom.wsgi:application"]

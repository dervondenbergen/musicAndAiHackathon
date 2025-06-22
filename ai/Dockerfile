FROM python:3.13.2 AS builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1
WORKDIR /app

RUN python -m venv .venv
COPY requirements.txt ./
RUN .venv/bin/pip install -r requirements.txt

FROM python:3.13.2-slim
WORKDIR /app

# Install curl, tar and unzip for downloading model and sounds
RUN apt-get update && apt-get install -y curl tar unzip && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/.venv .venv/
COPY . .

# Copy download script
COPY download-model.sh /app/download-model.sh
RUN chmod +x /app/download-model.sh

# Run download script and then start the server
CMD ["/bin/sh", "-c", "./download-model.sh && /app/.venv/bin/uvicorn fastAPI:app --host 0.0.0.0 --port ${PORT:-8000}"]

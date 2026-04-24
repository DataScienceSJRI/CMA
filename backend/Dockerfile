# ── Stage 1: build dependencies ───────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build tools needed for some Python packages (e.g. cryptography)
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip \
 && pip install --no-cache-dir --prefix=/install -r requirements.txt


# ── Stage 2: lean runtime image ───────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Copy only the installed packages from the builder stage
COPY --from=builder /install /usr/local

# Copy application source (no venv, no tests, no __pycache__)
COPY . .

# Supabase requires libssl at runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
        libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Non-root user for least-privilege execution
RUN adduser --disabled-password --gecos "" appuser \
 && chown -R appuser /app
USER appuser

EXPOSE 8000

# Use multiple workers in production.
# $WEB_CONCURRENCY lets the host platform (Railway, Render, etc.) override this.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port 8000 --workers ${WEB_CONCURRENCY:-2}"]

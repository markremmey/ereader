###############################################################################
# 1) Builder stage – install all deps and build your app
###############################################################################
# Use one of uv’s prebuilt images with Python & uv already installed
FROM ghcr.io/astral-sh/uv:python3.13-alpine AS builder

# Set working dir
WORKDIR /app

# 1a) Install Alpine build-time dependencies
#     - build-base: gcc, make, musl-dev
#     - postgresql-dev: pg_config + libpq headers
#     - libxml2-dev & libxslt-dev: headers for lxml
#     - libffi-dev: headers for cffi-based packages (greenlet, etc.)
RUN apk add --no-cache \
      build-base \
      postgresql-dev \
      libxml2-dev \
      libxslt-dev \
      libffi-dev

# 1a) Copy only the manifest files
COPY pyproject.toml uv.lock ./

# 1b) Install dependencies (no project code yet)
#     Cache uv's own cache to speed up rebuilds
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --no-install-project --locked

# 1c) Copy in the rest of your source
COPY . .

# 1d) Install your project into the environment
RUN uv sync --locked

###############################################################################
# 2) Runtime stage – slim image with only runtime files
###############################################################################
FROM python:3.13-alpine AS runtime

WORKDIR /app

# Copy the virtualenv (and all installed deps) from builder
COPY --from=builder /app/.venv /app/.venv

# Copy in your app code
COPY --from=builder /app /app

# Prepend the venv bin to PATH so uv and uvicorn are on PATH
ENV PATH="/app/.venv/bin:$PATH"

# Expose port (adjust if needed)
EXPOSE 8000

# Default command to launch your FastAPI/uvicorn app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Lyceum AI Reader

Lyceum AI Reader is an AI-enabled ereader for EPUB files. It combines a web-based reading experience with an AI chat assistant so readers can ask questions, summarize passages, or get contextual help while reading.

## What is in this repo

- `frontend/`: Vite + React app for the reader UI and chat experience.
- `backend/`: FastAPI service that serves APIs, streams chat responses, and integrates with storage, auth, and payments.
- `docker-compose.dev.yml`: Development stack (frontend, backend, redis) with hot reload.
- `docker-compose.prod.yml`: Production stack (frontend via nginx, backend, redis).

## Local development (Docker Compose)

1) Create the required environment files:
- `backend/.env.dev`
- `frontend/.env.local`

Typical values include (names based on backend usage):
- `AZURE_OPENAI_API_KEY`, `ENDPOINT_URL`, `DEPLOYMENT_NAME`
- `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_CONTAINER_NAME`, `AZURE_STORAGE_ACCOUNT_NAME`, `AZURE_STORAGE_ACCOUNT_KEY`
- `AZURE_SQL_CONNECTION_STRING`
- `REDIS_URL`
- `SECRET_KEY`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
- `FRONTEND_URL`

2) Start the dev stack:

```bash
docker compose -f docker-compose.dev.yml up --build
```

3) Open the app:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Redis: `localhost:6379`

Stop the stack with `Ctrl+C` or:

```bash
docker compose -f docker-compose.dev.yml down --volumes --remove-orphans
```

## Production (Docker Compose)

1) Create the required environment files:
- `backend/.env.prod`
- `frontend/.env`

2) Ensure nginx config and TLS certs are in place:
- `frontend/nginx/nginx.conf`
- `frontend/nginx/certs/`

3) Build and run:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

4) Open the app:
- Frontend: `http://localhost` (or your server domain)
- Backend API: `http://localhost:8000`

To stop:

```bash
docker compose -f docker-compose.prod.yml down --volumes --remove-orphans
```

## Handy shortcut

You can also use `deploy.sh` as a wrapper around Docker Compose:

```bash
./deploy.sh --dev up --build
./deploy.sh --prod up -d --build
```

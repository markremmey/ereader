#!/usr/bin/env bash
set -euo pipefail

# Default to prod
compose_file="docker-compose.prod.yml"

# Check for --prod or --dev as the first argument
if [[ "${1:-}" == "--dev" ]]; then
    compose_file="docker-compose.dev.yml"
    shift
elif [[ "${1:-}" == "--prod" ]]; then
    compose_file="docker-compose.prod.yml"
    shift
fi

if [ $# -ne 1 ]; then
  echo "Usage: $0 <service-name>"
  exit 1
fi

SERVICE=$1
DEBUG_NAME="debug-${SERVICE}"


docker compose -f "$compose_file" run -d \
	--name "$DEBUG_NAME" \
	--entrypoint sh \
	"$SERVICE" \
	-c "echo 'Paused'; sleep infinity"


# Wait for it to fully start
echo "Waiting for ${DEBUG_NAME} to enter running state…"
until docker ps --format '{{.Names}}' | grep -q "^${DEBUG_NAME}\$"; do
  sleep 0.2
done

echo "Container ${DEBUG_NAME} is up. Opening shell…"
docker exec -it "${DEBUG_NAME}" sh
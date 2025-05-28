#!/usr/bin/env bash
set -euo pipefail

this_dir=$(cd "$(dirname "$0")" && pwd)

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

# Run docker compose with the correct docker-compose.yml file
# Builds the image using the `build:` stanza if it does not already exist
docker_compose () {
	docker compose -f "$compose_file" "$@"
}

do_teardown () {
	docker_compose down --volumes --remove-orphans
}

trap do_teardown SIGINT

docker_compose "$@"
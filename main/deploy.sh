#!/usr/bin/env bash

set -o errexit

# Set default values and parse command-line arguments
REGION="us-east1"
ALLOW_UNAUTHENTICATED=true
IMAGE_NAME=""
SERVICE_NAME=""
ENV_VARS=()

# Load environment variables from .env.prod
if [[ -f .env.prod ]]; then
  # Read .env.prod and create an array of "KEY=VALUE" strings
  # Use mapfile to read all lines into an array, handling the last line correctly
  mapfile -t ENV_LINES < .env.prod

  for line in "${ENV_LINES[@]}"; do
    if [[ ! "$line" =~ ^# ]] && [[ -n "$line" ]]; then # Skip comments and empty lines
      ENV_VARS+=("--set-env-vars" "$line")
    fi
  done
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --region)
      REGION="$2"
      shift 2
      ;;
    --allow-unauthenticated)
      ALLOW_UNAUTHENTICATED="$2"
      shift 2
      ;;
    --image)
      IMAGE_NAME="$2"
      shift 2
      ;;
    --service-name)
      SERVICE_NAME="$2"
      shift 2
      ;;
    --set-env-vars)
      ENV_VARS+=("--set-env-vars" "$2")
      shift 2
      ;;
    *)
      echo "Unknown parameter passed: $1"
      exit 1
  esac
done

# Authenticate Docker
yes Y | gcloud auth configure-docker us-central1-docker.pkg.dev

# Build and push the Docker image
docker build -t "$IMAGE_NAME" .
docker push "$IMAGE_NAME"

# Construct the gcloud run deploy command
DEPLOY_COMMAND=(
  "gcloud"
  "run"
  "deploy"
  "$SERVICE_NAME"
  "--image"
  "$IMAGE_NAME"
  "--platform"
  "managed"
  "--region"
  "$REGION"
)

# Add --allow-unauthenticated if specified
if [[ "$ALLOW_UNAUTHENTICATED" == "true" ]]; then
  DEPLOY_COMMAND+=("--allow-unauthenticated")
fi

# Add environment variables from .env.prod and command line
if [[ ${#ENV_VARS[@]} -gt 0 ]]; then
  DEPLOY_COMMAND+=("${ENV_VARS[@]}")
fi

# Execute the deploy command
echo "Deploying service with command: ${DEPLOY_COMMAND[*]}"
"${DEPLOY_COMMAND[@]}"

echo "Service deployed"

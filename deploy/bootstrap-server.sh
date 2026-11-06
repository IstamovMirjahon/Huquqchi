#!/usr/bin/env bash
set -euo pipefail

deploy_dir="${1:-/home/deploy/huquqchi}"
mkdir -p "$deploy_dir"
chmod 700 "$deploy_dir"
cd "$deploy_dir"

if [[ ! -f .env ]]; then
  umask 077
  postgres_password="$(openssl rand -hex 32)"
  jwt_key="$(openssl rand -hex 48)"
  otp_code="$(od -An -N4 -tu4 /dev/urandom | awk '{printf "%06d", $1 % 1000000}')"

  printf '%s\n' \
    'POSTGRES_DB=huquqchi' \
    'POSTGRES_USER=huquqchi' \
    "POSTGRES_PASSWORD=$postgres_password" \
    'JWT_ISSUER=huquqchi' \
    'JWT_AUDIENCE=huquqchi-mobile' \
    "JWT_KEY=$jwt_key" \
    "OTP_CODE=$otp_code" \
    'API_PORT=3500' \
    'HUQUQCHI_IMAGE=ghcr.io/istamovmirjahon/huquqchi:latest' \
    > .env
  chmod 600 .env
  echo 'Production .env yaratildi.'
else
  chmod 600 .env
  echo 'Mavjud production .env saqlandi.'
fi

#!/usr/bin/env bash
# Atomic deploy script for Vite static build
# Usage:
#   ./scripts/deploy_atomic.sh        # build and deploy to default path
#   BASE_DIR=/var/www/html/cukong/fe-v2 ./scripts/deploy_atomic.sh
#   ./scripts/deploy_atomic.sh --rollback  # rollback to previous release

set -euo pipefail
ROOT_DIR=${BASE_DIR:-$(cd "$(dirname "$0")/.." && pwd)}
RELEASES_DIR="$ROOT_DIR/releases"
CURRENT_LINK="$ROOT_DIR/current"
DIST_DIR="$ROOT_DIR/dist"

usage() {
  cat <<EOF
Usage: $0 [--rollback] [--reload-nginx]

Options:
  --rollback       Rollback to previous release (if exists)
  --reload-nginx   Run 'sudo systemctl reload nginx' after switching
  --help           Show this help
EOF
}

reload_nginx=false
rollback=false
for arg in "$@"; do
  case "$arg" in
    --reload-nginx) reload_nginx=true ;;
    --rollback) rollback=true ;;
    --help) usage; exit 0 ;;
    *) echo "Unknown arg: $arg"; usage; exit 2 ;;
  esac
done

mkdir -p "$RELEASES_DIR"

if [ "$rollback" = true ]; then
  # find the last two releases
  releases=("$(ls -1dt "$RELEASES_DIR"/* 2>/dev/null || true)")
  mapfile -t rels < <(ls -1dt "$RELEASES_DIR"/* 2>/dev/null || true)
  if [ "${#rels[@]}" -lt 2 ]; then
    echo "No previous release to rollback to"
    exit 1
  fi
  echo "Rolling back to: ${rels[1]}"
  ln -sfn "${rels[1]}" "$CURRENT_LINK"
  echo "Rollback complete. current -> ${rels[1]}"
  if [ "$reload_nginx" = true ]; then
    echo "Reloading nginx..."
    sudo systemctl reload nginx
  fi
  exit 0
fi

# Build step
echo "Building project (npm run build) in $ROOT_DIR..."
pushd "$ROOT_DIR" >/dev/null
if [ ! -f package.json ]; then
  echo "package.json not found in $ROOT_DIR" >&2
  exit 1
fi
npm ci --silent
npm run build --silent
popd >/dev/null

if [ ! -d "$DIST_DIR" ]; then
  echo "Build output directory $DIST_DIR not found" >&2
  exit 1
fi

TS=$(date +%Y%m%d-%H%M%S)
NEW_REL="$RELEASES_DIR/$TS"
mkdir -p "$NEW_REL"
echo "Copying files to $NEW_REL..."
cp -a "$DIST_DIR"/. "$NEW_REL/"

echo "Updating symlink: $CURRENT_LINK -> $NEW_REL"
ln -sfn "$NEW_REL" "$CURRENT_LINK"
echo "Deployed: $NEW_REL"

if [ "$reload_nginx" = true ]; then
  echo "Reloading nginx..."
  sudo systemctl reload nginx
fi

echo "Done."

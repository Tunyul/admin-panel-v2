Atomic deploy (zero-downtime) for Vite static site

Overview
--------
This repository includes a small script `scripts/deploy_atomic.sh` that builds the Vite app, copies the generated `dist` into a timestamped release folder under `releases/`, then atomically updates the `current` symlink to point to the newest release. An Nginx server block can serve files from the `current` path so swapping is instant for visitors.

Quick usage (on Ubuntu local / WHL):

1. Build & deploy

```bash
# from repo root (or adjust BASE_DIR)
./scripts/deploy_atomic.sh --reload-nginx
```

2. Rollback to previous release

```bash
./scripts/deploy_atomic.sh --rollback --reload-nginx
```

Notes
-----
- The script uses `npm ci` + `npm run build`. Make sure Node and npm are installed.
- By default the script assumes repo root is `/var/www/html/cukong/fe-v2` (it detects root relative to `scripts/`). To override, set `BASE_DIR` env var.
- The script copies `dist/*` into `releases/<timestamp>/` and then updates `current` symlink. Keep at least 2 releases to enable rollback.
- For development/demo, run `npx vite preview --port 5173` or serve `current` with Nginx.

Cache headers recommendation
----------------------------
Serve `index.html` with no-cache and hashed assets with long cache lifetime. See sample Nginx below.

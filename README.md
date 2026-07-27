# Personal Cloud — Phase 2 (Advanced File Management)

A lightweight, self-hosted personal cloud built to run comfortably on a
Raspberry Pi Zero 2 W. In v2 we have file explorer: nested folders, rename/move/
copy, favorites, trash (soft delete), search, sort/filter, and inline
previews for images, PDFs, text/code, audio, and video.


## Stack

| Layer    | Technology                                                   |
|----------|---------------------------------------------------------------|
| Backend  | Python 3.12+, FastAPI, SQLAlchemy 2.0, SQLite, JWT, bcrypt, Uvicorn |
| Frontend | React, Vite, Material UI, React Router, Axios                 |

## Architecture

```
API Routes → Services → Storage Service → Database
                                        ↘  Filesystem
```

Routes stay thin (validation + calling a service). Business logic lives
in `app/services/`. The **only** code allowed to touch the filesystem is
`app/storage/storage_service.py`.

**Folders are virtual.** Creating/renaming/moving a folder never touches
disk — `Folder` rows only exist in SQLite, and a file's `folder_id` is
just metadata. Files themselves always live flat inside
`storage/<user_id>/uploads/<random-name>`, so moving a file between
folders is an O(1) database update, not a filesystem move. This keeps
folder operations instant and avoids path-length/permission edge cases
on the Pi.

```
backend/
  app/
    api/          # FastAPI routers (auth, files, folders, search, trash, preview, storage, dashboard)
    core/         # config, security (JWT/bcrypt), auth dependencies
    database/     # SQLAlchemy engine/session, table init + lightweight migrations
    models/       # User, File, Folder ORM models
    schemas/      # Pydantic request/response models
    services/     # business logic (auth_service, file_service, folder_service)
    storage/      # StorageService — the only filesystem access point
    utils/        # filename sanitization, path-traversal guards, file-type/category/preview lookups
    main.py
  storage/        # per-user uploads live here: storage/<user_id>/uploads/
  requirements.txt

frontend/
  src/
    components/   # FileCard, FolderCard, Breadcrumbs, SearchBar, SortFilterBar,
                   # UploadButton, FilePreviewModal, CreateFolderDialog, RenameDialog,
                   # MoveDialog, ConfirmDialog, TopBar, ProtectedRoute
    pages/        # LoginPage, RegisterPage, DashboardPage (home summary),
                   # DrivePage (My Drive explorer), TrashPage
    layouts/      # AuthLayout
    services/     # api.js, authService.js, fileService.js, folderService.js,
                   # trashService.js, searchService.js, dashboardService.js
    hooks/        # useAuth.jsx (auth context)
    utils/        # formatBytes.js, fileIcons.js, previewKind.js
    App.jsx, main.jsx, theme.js
```

## Data model

**users** — id (UUID), username, email, password_hash, created_at

**folders** — id (UUID), user_id, parent_id (nullable, self-referential),
folder_name, created_at

**files** — id (UUID), user_id, folder_id (nullable — null means the root
of My Drive), filename, stored_filename, file_size, mime_type,
storage_path, uploaded_at, updated_at, last_opened, is_favorite,
is_deleted, deleted_at

Only metadata lives in SQLite; file bytes live on disk. Real filesystem
paths are never returned by the API — the frontend only ever sees file
IDs and virtual folder IDs/names (breadcrumbs).

**Trash**: deleting a file sets `is_deleted=true` / `deleted_at=now()`.
The file stays on disk (and still counts toward storage usage) until
it's permanently deleted from Trash or Trash is emptied. Deleting a
folder is only allowed when it has no subfolders and no (non-trashed)
files — this keeps deletion unambiguous without needing recursive trash
semantics for folders in this phase.

**Schema migration**: this project doesn't use Alembic yet — deliberately,
to stay simple. `database/init_db.py` calls `create_all()` for fresh
databases and then applies small additive `ALTER TABLE` statements for
the columns Phase 2 added to `files`, so an existing Phase 1 database
upgrades automatically and losslessly the next time the server starts.

## API endpoints

```
POST   /register
POST   /login
GET    /me

POST   /files/upload            (accepts optional folder_id form field)
GET    /files                   (?folder_id=&sort=&order=&filter=&favorite=)
GET    /files/recent
GET    /files/{id}/download
PATCH  /files/{id}/rename
PATCH  /files/{id}/move
POST   /files/{id}/copy
PATCH  /files/{id}/favorite
DELETE /files/{id}               (soft delete -> moves to Trash)

POST   /folders
GET    /folders/{id}             (use "root" for the top of My Drive; returns
                                   folder, breadcrumbs, subfolders, and files)
PATCH  /folders/{id}             (rename and/or move in one call)
DELETE /folders/{id}             (only if empty)

GET    /search?q=&extension=&mime_type=&category=&sort=&order=

GET    /trash
POST   /trash/{id}/restore
DELETE /trash/{id}               (permanent)
DELETE /trash/empty

GET    /preview/{id}             (inline image/pdf/audio/video stream, or
                                   plain text for code/text files; also
                                   accepts ?token= for <img>/<video>/<audio>
                                   src attributes, which can't send headers)

GET    /storage/usage
GET    /dashboard/summary        (totals + recent + favorites)
```

Interactive API docs are auto-generated by FastAPI at `/docs` once the
backend is running.

## Security

- Passwords hashed with bcrypt, never stored or logged in plaintext.
- JWT bearer tokens for authentication; every file/storage route
  requires a valid token.
- Every file lookup is scoped to `File.user_id == current_user.id` —
  users can never read, download, or delete another user's files
  (a 404, not a 403, is returned to avoid confirming a file's existence).
- Uploaded filenames are never used to build filesystem paths. A random
  UUID-based name is generated for disk storage; the original name is
  kept only as a display label in the database, sanitized to strip
  directory separators and unsafe characters.
- All resolved storage paths are checked to confirm they stay inside
  the user's own upload directory (path-traversal protection).
- Uploads are streamed to disk in 1 MB chunks and rejected once they
  exceed `MAX_UPLOAD_SIZE_MB` (default 100 MB), so a single request
  can't exhaust the Pi's memory or disk.
- The preview endpoint accepts the JWT as a `?token=` query parameter in
  addition to the `Authorization` header, since browsers don't let
  `<img>`/`<video>`/`<audio>` elements send custom headers. This is
  scoped to that one read-only endpoint only — every other route still
  requires the header.
- Text previews are capped at 512 KB read from disk, so previewing a
  huge file renamed to `.txt` can't exhaust memory.

## Local development

### Prerequisites

- Python 3.12+
- Node.js 18+ and npm

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Open .env and set SECRET_KEY to a random value, e.g.:
#   python3 -c "import secrets; print(secrets.token_hex(32))"

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is now running at `http://localhost:8000` (docs at
`http://localhost:8000/docs`). Tables are created automatically on
first startup — no separate migration step is needed for phase 1.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api/*`
requests to `http://localhost:8000`, so no CORS setup is needed locally.

Register an account, log in, and you should land on the dashboard.

## Configuration reference (backend `.env`)

| Variable                      | Default                     | Notes                                  |
|--------------------------------|------------------------------|-----------------------------------------|
| `SECRET_KEY`                   | *(insecure placeholder)*     | **Must** be changed for any real deployment |
| `ACCESS_TOKEN_EXPIRE_MINUTES`  | `1440` (24h)                 | JWT lifetime                            |
| `DATABASE_URL`                 | `sqlite:///./storage/cloud.db` | SQLite file location                 |
| `STORAGE_ROOT`                 | `./storage`                  | Root directory for uploaded files       |
| `MAX_UPLOAD_SIZE_MB`           | `500`                        | Per-file upload size limit              |

---


# Raspberry Pi Zero 2 W deployment guide

These steps assume Raspberry Pi OS Lite (64-bit recommended) with SSH
access already configured, and that the Pi has internet access.

## 1. System packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-venv python3-pip git nginx
```

## 2. Get the code onto the Pi

```bash
cd /home
sudo mkdir personal-cloud && sudo chown $USER:$USER personal-cloud
cd personal-cloud
# copy the backend/ and frontend/ folders here (scp, git clone, or rsync)
```

If you're using external USB storage for your files, mount it first and
point `STORAGE_ROOT` at it in step 3 (e.g. `/mnt/usbstorage/personal-cloud`),
since a microSD card wears out faster under heavy write load.

## 3. Backend setup

```bash
cd /home/personal-cloud/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
nano .env
```

In `.env`, at minimum:
- Set `SECRET_KEY` to a real random value .
- If using external storage, set `STORAGE_ROOT=/mnt/usbstorage/personal-cloud`.
- Add your Pi's LAN hostname/IP to `cors_origins` in `app/core/config.py` if you'll access the dashboard from another device (e.g. `http://raspberrypi.local`).

Quick check it runs:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000
# Ctrl+C once you see "Application startup complete."
```

## 4. Run the backend as a systemd service

Create `/etc/systemd/system/personal-cloud-api.service`:

```ini
[Unit]
Description=Personal Cloud API
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/personal-cloud/backend
Environment="PATH=/home/personal-cloud/backend/.venv/bin"
ExecStart=/home/personal-cloud/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 1
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

`--workers 1` keeps memory usage predictable on 512 MB of RAM — a
single Uvicorn worker is plenty for personal/family use.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now personal-cloud-api
sudo systemctl status personal-cloud-api
```

## 5. Build the frontend and serve it with nginx

Building React on the Pi Zero 2 W itself is slow and memory-heavy.
**Build on your laptop/desktop and copy the output over** instead:

On your development machine:

```bash
cd frontend
echo "VITE_API_BASE_URL=/api" > .env
npm install
npm run build
scp -r dist/* pi@<pi-ip-or-hostname>:/home/personal-cloud/frontend-dist/
```

(Create the destination folder on the Pi first: `mkdir -p /home/personal-cloud/frontend-dist`.)

Configure nginx to serve the built frontend and reverse-proxy `/api` to
the backend. Create `/etc/nginx/sites-available/personal-cloud`:

```nginx
server {
    listen 80;
    server_name _;

    client_max_body_size 100M;   # match MAX_UPLOAD_SIZE_MB

    root /home/personal-cloud/frontend-dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300s;      # allow large/slow uploads
        proxy_request_buffering off;  # stream uploads instead of buffering
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/personal-cloud /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## 6 (a). Try it on your devices

From any device on the same network, visit `http://<pi-ip-or-hostname>/`.
Register an account, log in, and upload a file.

### or

## 6 (b). Secure Remote Access with Tailscale

To access your personal cloud securely outside your home network without exposing open ports to the internet, use Tailscale.


A. Install Tailscale on the Raspberry Pi
Run the automated installation script:
```bash
curl -fsSL https://tailscale.com/install.sh | sh
```
  B. Authenticate and Connect
  Start Tailscale and log in:

```bash
  sudo tailscale up
```

C. Access Your Personal Cloud
 1. Install Tailscale on your phone, laptop, or remote client devices.
 2. Find your Pi’s Tailscale IP address or MagicDNS hostname by running:

  ```bash
  tailscale ip -4
  # or check your hostname:
  tailscale status
  ```
3. Open your remote device's web browser and go to:
  ```bash
  http://<your-pi-tailscale-ip>/
# or using MagicDNS:
http://<your-pi-hostname>.<your-tailnet-name>.ts.net/
```




## Raspberry Pi performance notes

- **SQLite only** — no separate database server to run, and it's fast
  enough for single-family/personal use.
- **Streamed uploads/downloads** — the backend never loads a whole file
  into memory (`aiofiles`, 1 MB chunks; FastAPI's `StreamingResponse`
  for downloads), so upload/download size isn't bounded by RAM.
- **Single Uvicorn worker** — sufficient for a handful of concurrent
  users on a Pi Zero 2 W; increasing workers multiplies memory use.
- **External USB storage recommended** for the `storage/` directory if
  you'll store more than a few GB, both for capacity and to reduce
  microSD wear.
- Consider adding a swap file (`sudo dphys-swapfile swapon`) if you see
  out-of-memory issues under load, though normal single-user usage
  shouldn't need it.

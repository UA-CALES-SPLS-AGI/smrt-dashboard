# SMRT Link Instrument Dashboard — Deployment Guide

## Overview

This is a **static web application** that monitors PacBio SMRT Link sequencing instruments
via the SMRT Link REST API. It's designed to be hosted on **Apache HTTPD** alongside your
SMRT Link installation.

**Architecture:**
- Static HTML/JS/CSS served by Apache HTTPD
- Browser makes API calls directly to SMRT Link (via Apache reverse proxy)
- All settings stored in browser localStorage — no database required
- No server-side code — purely client-side rendering

---

## Prerequisites

- **Node.js** 18+ and **yarn** (for building only)
- **Apache HTTPD** with `mod_proxy` and `mod_proxy_http` enabled
- **SMRT Link** running and accessible at `http://localhost:9091` (or another host:port)

---

## Step 1: Build the Static Site

```bash
# Clone or copy this project directory
cd nextjs_space

# Install dependencies
yarn install

# Build for static export
NEXT_OUTPUT_MODE=export yarn build

# The static files are now in the 'out/' directory
ls out/
```

> **Note:** The `NEXT_OUTPUT_MODE=export` environment variable tells Next.js to
> generate a fully static site. The output goes to the `out/` directory.

---

## Step 2: Deploy to Apache HTTPD

### 2a. Copy the static files

```bash
# Copy the built files to your Apache document root (or a subdirectory)
sudo cp -r out/* /var/www/html/smrt-dashboard/

# Or if you want it at the root:
sudo cp -r out/* /var/www/html/
```

### 2b. Configure Apache

Add the following to your Apache configuration. This can go in:
- `/etc/httpd/conf/httpd.conf` (main config)
- `/etc/httpd/conf.d/smrt-dashboard.conf` (dedicated config file)
- A `<VirtualHost>` block

```apache
# ============================================================
# SMRT Link Instrument Dashboard — Apache Configuration
# ============================================================

# Enable required modules (if not already enabled)
# LoadModule proxy_module modules/mod_proxy.so
# LoadModule proxy_http_module modules/mod_proxy_http.so
# LoadModule rewrite_module modules/mod_rewrite.so

# --- Option A: Dashboard at a subdirectory (e.g., /smrt-dashboard/) ---
Alias /smrt-dashboard /var/www/html/smrt-dashboard
<Directory /var/www/html/smrt-dashboard>
    Options -Indexes +FollowSymLinks
    AllowOverride None
    Require all granted

    # Handle client-side routing (SPA fallback)
    RewriteEngine On
    RewriteBase /smrt-dashboard/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /smrt-dashboard/index.html [L]
</Directory>

# --- Option B: Dashboard at the root (/) ---
# <Directory /var/www/html>
#     Options -Indexes +FollowSymLinks
#     AllowOverride None
#     Require all granted
#     RewriteEngine On
#     RewriteCond %{REQUEST_FILENAME} !-f
#     RewriteCond %{REQUEST_FILENAME} !-d
#     RewriteRule . /index.html [L]
# </Directory>

# --- Reverse Proxy for SMRT Link API ---
# This maps /smrtlink-api/* to http://localhost:9091/*
# (avoids CORS issues — browser calls same-origin path)
ProxyPreserveHost Off
ProxyPass        /smrtlink-api/ http://localhost:9091/
ProxyPassReverse /smrtlink-api/ http://localhost:9091/

# Optional: Increase timeout for long API calls
ProxyTimeout 30

# Optional: If SMRT Link is on a different host/port, change above:
# ProxyPass        /smrtlink-api/ http://smrtlink-server.example.com:9091/
# ProxyPassReverse /smrtlink-api/ http://smrtlink-server.example.com:9091/
```

### 2c. Enable required Apache modules

```bash
# CentOS 8 / RHEL 8
sudo dnf install mod_proxy_html   # if not already installed

# Ensure modules are loaded
sudo httpd -M | grep proxy
# Should show: proxy_module, proxy_http_module

# Ensure rewrite module is loaded
sudo httpd -M | grep rewrite
# Should show: rewrite_module
```

### 2d. Restart Apache

```bash
sudo systemctl restart httpd

# Check for errors
sudo systemctl status httpd
sudo tail -f /var/log/httpd/error_log
```

---

## Step 3: Configure the Dashboard

1. Open the dashboard in your browser: `http://your-server/smrt-dashboard/`
2. Navigate to **Settings** (gear icon in sidebar)
3. Configure:
   - **API Base Path**: `/smrtlink-api` (default — matches the ProxyPass above)
   - **Auto-detect Instrument**: ON (default) — auto-discovers instrument ID from API
   - Or set **Instrument ID** and **Serial** manually if auto-detect doesn't work
4. Adjust **Polling Intervals** as desired
5. Click **Save Settings**

---

## Configuration Variables Explained

| Setting | Description | Example |
|---------|-------------|--------|
| **API Base Path** | The reverse proxy path that maps to SMRT Link API | `/smrtlink-api` |
| **Instrument ID** | Integer ID for ICS endpoints (`/ics/{id}/...`) | `1` |
| **Serial Number** | String serial for connection endpoints | `84046` |
| **Auto-detect** | Auto-discover instrument from `/smrt-link/instrument-config/summary` | `true` |

### How Instrument ID / Serial Work

- **Instrument ID** (integer): Obtained from `/smrt-link/instrument-config/summary` → `id` field.
  Used in all `/ics/{instrumentId}/...` endpoints.
- **Serial Number** (string): Obtained from `/smrt-link/instrument-config/connections` → `serial` field.
  Used in `/smrt-link/instrument-config/connections/{serial}` endpoint.
- With **Auto-detect ON**, the dashboard queries the summary endpoint and uses the first instrument found.

---

## API Endpoints Used (All GET, Read-Only)

### System
| Endpoint | Description |
|----------|-------------|
| `GET /status` | SMRT Link system status, version, uptime |
| `GET /smrt-link/alarms` | System-level alarm statuses |
| `GET /smrt-link/disk-space` | Server disk space usage (jobs root, tmp, root) |
| `GET /smrt-link/disk-space/{resourceId}` | Specific resource disk space |

### ICS (Instrument Control System) — requires `{instrumentId}` (integer)
| Endpoint | Description |
|----------|-------------|
| `GET /ics/{id}/state` | Overall state, run state, door state, flags |
| `GET /ics/{id}/alarms` | Active instrument alarms |
| `GET /ics/{id}/configuration` | Serial, name, ICS version |
| `GET /ics/{id}/configuration/timezone` | Timezone info with coordinates |
| `GET /ics/{id}/configuration/transferscheme/test` | Transfer test results |
| `GET /ics/{id}/runs/{runId}` | Specific run details (if run ID known) |

### Instrument Config
| Endpoint | Description |
|----------|-------------|
| `GET /smrt-link/instrument-config/summary` | Registered instruments list |
| `GET /smrt-link/instrument-config/connections` | All instrument connections |
| `GET /smrt-link/instrument-config/connections/{id}` | Specific connection detail |
| `GET /smrt-link/instrument-config/file-transfer` | File transfer locations |
| `GET /smrt-link/instrument-config/file-transfer/{locationId}` | Specific transfer location |

### Instrument States
| Endpoint | Description |
|----------|-------------|
| `GET /smrt-link/instruments` | All instrument state records |

---

## Troubleshooting

### "Fetch failed" or network errors
- Check Apache reverse proxy is configured correctly
- Test: `curl http://localhost/smrtlink-api/status`
- Check Apache error log: `sudo tail -f /var/log/httpd/error_log`

### "Request timed out"
- SMRT Link API may be slow — increase `ProxyTimeout` in Apache config
- Increase timeout in Settings → Polling Intervals

### Auto-detect not finding instruments
- Check `/smrt-link/instrument-config/summary` returns data:
  `curl http://localhost:9091/smrt-link/instrument-config/summary`
- If empty, manually set Instrument ID in Settings

### SELinux blocking reverse proxy (CentOS/RHEL)
```bash
sudo setsebool -P httpd_can_network_connect 1
```

---

## Development

```bash
# Run in development mode
yarn dev

# The dev server runs at http://localhost:3000
# You'll still need the SMRT Link API accessible
# For dev, you can set a different API base path in Settings
# or use a direct URL like http://your-smrtlink-host:9091
```

---

## GitHub Preparation

When sharing on GitHub, include these files:
- `nextjs_space/` — the source code
- `DEPLOY.md` — this file (also in `public/`)
- `.gitignore` — exclude `node_modules/`, `.next/`, `out/`

Suggested `.gitignore`:
```
node_modules/
.next/
out/
.build/
*.log
.env*
```

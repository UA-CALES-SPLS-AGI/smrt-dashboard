![brand](https://github.com/UA-CALES-SPLS-AGI/smrt-dashboard/blob/main/public/og-image.png)

# SMRT Link Instrument Dashboard

A real-time monitoring dashboard for **PacBio Revio** sequencing instruments, built as a static Next.js app that talks directly to the SMRT Link REST API from the browser.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38bdf8) ![License](https://img.shields.io/badge/License-MIT-green)

<!-- ![Dashboard Screenshot](docs/screenshot.png) -->

## Features

- **Multi-instrument monitoring** — track all Revio instruments registered in SMRT Link from a single page
- **Instrument detail view** — deep-dive into any instrument with tabbed panels for status, alarms, configuration, connections, storage, and run history
- **Real-time polling** — configurable auto-refresh interval (default 30 s)
- **Alarm monitoring** — active alarm count with severity badges; full alarm table with metric/severity/timestamp
- **Storage monitoring** — disk usage bars for all SMRT Link file-system mount points, color-coded by usage threshold
- **Run history** — filterable table of completed/failed/aborted runs with context, movie length, and timestamps
- **ICS state timestamps** — shows age of each Instrument Control Software sub-state (inventory, diagnostics, alarms, configuration, run requirements, loaded run)
- **Connection health** — real-time status of ICS, chemistry, and DIM socket connections
- **Dark / light theme** — system-aware with manual toggle, persisted in localStorage
- **Fully static export** — no server, no database; all settings stored in localStorage. Deploy anywhere you can serve HTML.
- **Apache-ready** — ships with a sample Apache HTTPD reverse-proxy config

## Screenshot

![Screenshot](https://github.com/user-attachments/assets/df1e70d2-0b84-473f-b382-288d79704503)

## Architecture

```
┌──────────────┐         ┌──────────────────┐        ┌───────────────┐
│   Browser    │──GET───▶│  Apache HTTPD    │─proxy─▶│  SMRT Link    │
│  (static JS) │◀──JSON──│  /smrtlink-api/  │◀───────│  :9091        │
└──────────────┘         └──────────────────┘        └───────────────┘
        ▲
        │  serves static files
        │  /smrt-dashboard/
        ▼
   out/ (Next.js export)
```

The dashboard is a **fully client-side** Next.js static export. The browser fetches JSON from the SMRT Link API through an Apache reverse-proxy (to handle CORS and HTTPS). There is no application server or database.

## SMRT Link API Endpoints Used

| Endpoint | Purpose |
|---|---|
| `GET /smrt-link/instruments` | List all registered instruments |
| `GET /smrt-link/instruments/{id}` | Instrument detail + ICS state |
| `GET /smrt-link/instruments/{id}/alarms` | Active alarms |
| `GET /smrt-link/instruments/{id}/configuration` | Chemistry / hardware config |
| `GET /smrt-link/instruments/{id}/connections` | ICS, chemistry, DIM connections |
| `GET /smrt-link/instrument-history?instrumentId={id}` | Run history |
| `GET /smrt-link/disk-space` | File-system mount point usage |

Tested against **SMRT Link v13.0.0**. The API requires no authentication.

## Prerequisites

- **Node.js** ≥ 18 (tested with 18.x and 20.x)
- **SMRT Link** ≥ 13.0 accessible on the network
- **Apache HTTPD** (or any reverse proxy) to front the SMRT Link API with CORS headers

## Quick Start

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/smrt-link-dashboard.git
cd smrt-link-dashboard

# Install
npm install          # or: yarn install

# Dev server (talks to SMRT Link via proxy — see "Development" below)
npm run dev

# Production static build
NEXT_OUTPUT_MODE=export NEXT_BASE_PATH=/smrt-dashboard \
  npx next build
# Output lands in out/
```

> **CentOS 8 / nmh conflict:** If `/usr/bin/next` resolves to the `nmh` mail tool instead of Next.js, use the explicit path:
> ```bash
> NEXT_OUTPUT_MODE=export NEXT_BASE_PATH=/smrt-dashboard \
>   ./node_modules/.bin/next build
> ```

## Configuration

All runtime settings are configured **in the browser** via the Settings page (`/settings`):

| Setting | Default | Description |
|---|---|---|
| SMRT Link API Base URL | `/smrtlink-api` | Proxy path (or full URL) to SMRT Link API |
| Polling Interval | `30` s | How often to refresh instrument data |
| Max History Items | `100` | Run-history records to fetch per instrument |

Settings are stored in `localStorage` and survive browser restarts.

### Build-Time Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_OUTPUT_MODE` | Yes | Must be `export` for static build |
| `NEXT_BASE_PATH` | If subpath | e.g. `/smrt-dashboard` when not served at root |

These are read by `next.config.js` at build time:

```js
// next.config.js (relevant excerpt)
output: process.env.NEXT_OUTPUT_MODE,   // "export"
basePath: process.env.NEXT_BASE_PATH,   // "/smrt-dashboard"
```

> **Important:** You must add a `basePath` line to `next.config.js` if deploying under a subpath. See the config file for details.

## Deployment

See **[DEPLOY.md](public/DEPLOY.md)** for full Apache HTTPD deployment instructions, including:

- Apache virtual-host configuration with reverse proxy to SMRT Link
- HTTPS / TLS setup
- CORS headers
- SELinux `httpd_can_network_connect` boolean
- `systemctl` commands

A ready-to-use Apache config fragment is at **[public/apache-smrt-dashboard.conf](public/apache-smrt-dashboard.conf)**.

### TL;DR Deployment

```bash
# 1. Build
NEXT_OUTPUT_MODE=export NEXT_BASE_PATH=/smrt-dashboard \
  npx next build

# 2. Copy static files
sudo mkdir -p /var/www/html/smrt-dashboard
sudo cp -r out/* /var/www/html/smrt-dashboard/

# 3. Drop in the Apache config (edit server name + certs)
sudo cp public/apache-smrt-dashboard.conf /etc/httpd/conf.d/
sudo systemctl restart httpd
```

## Development

For local development you need a proxy to the SMRT Link API. The easiest approach:

```bash
# Option A: SSH tunnel to your SMRT Link server
ssh -L 9091:localhost:9091 youruser@smrtlink-host

# Then set the API base URL in Settings to http://localhost:9091
npm run dev
```

Or configure a local proxy in `next.config.js`:

```js
async rewrites() {
  return [
    {
      source: '/smrtlink-api/:path*',
      destination: 'http://your-smrtlink-host:9091/:path*',
    },
  ];
},
```

## Project Structure

```
├── app/
│   ├── globals.css              # Tailwind + theme variables
│   ├── layout.tsx               # Root layout (ThemeProvider, fonts)
│   └── (dashboard)/
│       ├── layout.tsx            # App shell (sidebar + header)
│       ├── page.tsx              # Dashboard home — instrument grid
│       ├── status/page.tsx       # Instrument overview table
│       ├── alarms/page.tsx       # Alarm monitor
│       ├── configuration/page.tsx
│       ├── connections/page.tsx
│       ├── storage/page.tsx
│       ├── history/page.tsx
│       ├── settings/page.tsx
│       └── instruments/[id]/page.tsx  # Detail view
├── components/
│   ├── dashboard/               # 15 domain-specific panels
│   │   ├── dashboard-client.tsx  # Main grid with polling
│   │   ├── instrument-state-panel.tsx
│   │   ├── alarms-panel.tsx
│   │   ├── config-panel.tsx
│   │   ├── connections-panel.tsx
│   │   ├── storage-panel.tsx
│   │   ├── history-chart.tsx
│   │   └── ...                   # metric-card, status-badge, etc.
│   ├── layouts/
│   │   └── app-shell.tsx         # Sidebar navigation + mobile menu
│   ├── ui/                       # shadcn/ui primitives
│   ├── theme-provider.tsx
│   ├── theme-toggle.tsx
│   └── chunk-load-error-handler.tsx
├── lib/
│   ├── smrt-api.ts              # SMRT Link API client (fetch wrappers)
│   ├── settings-store.ts        # localStorage settings manager
│   ├── history-store.ts         # Run-history data helpers
│   └── utils.ts                 # cn() and misc utilities
├── hooks/
│   ├── use-polling.ts           # Generic interval-polling hook
│   ├── use-settings.ts          # React hook for settings-store
│   └── use-toast.ts             # Toast notification hook
├── public/
│   ├── favicon.svg
│   ├── og-image.png
│   ├── DEPLOY.md                # Full deployment guide
│   └── apache-smrt-dashboard.conf
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
├── components.json              # shadcn/ui config
└── package.json
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (static export) |
| Language | TypeScript 5.2 |
| Styling | Tailwind CSS 3.3 + CSS variables for theming |
| UI primitives | shadcn/ui (Radix UI) |
| Charts | Recharts |
| Icons | Lucide React |
| State | React hooks + localStorage (no server state) |

## Contributing

Pull requests welcome. For major changes, please open an issue first.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT — see [LICENSE](LICENSE) for details.

## Acknowledgments

- [PacBio](https://www.pacb.com/) for the SMRT Link API
- [shadcn/ui](https://ui.shadcn.com/) for the component library
- Built with [Next.js](https://nextjs.org/) and [Tailwind CSS](https://tailwindcss.com/)

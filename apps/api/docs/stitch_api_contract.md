# Stitch Proxy API Contract

This document describes the server-side proxy endpoints used to integrate Stitch (vendor) without exposing the API key to the browser.

Base prefix: `/api/v1/stitch`

Endpoints

- `POST /api/v1/stitch/request`
  - Purpose: Proxy arbitrary requests to the Stitch base URL (keeps API key server-side).
  - Request JSON body:
    - `path` (string, optional): path appended to the configured `STITCH_URL` (e.g. `v1/requests`).
    - `method` (string, optional): HTTP method, default `POST`.
    - `headers` (object, optional): additional headers to include.
    - `json` (any, optional): JSON body to forward.
    - `text` (string, optional): raw text body to forward.
  - Response: JSON with either `{ status: number, json: <object> }` when upstream is JSON, or `{ status: number, text: <string> }` otherwise.
  - Security: Server injects the configured `STITCH_HEADER_NAME: STITCH_API_KEY` header.

- `GET /api/v1/stitch/widget`
  - Purpose: Fetch and return raw content (HTML/binary) from Stitch base or an absolute `url` query param.
  - Query params:
    - `path` (string, optional): appended to base `STITCH_URL`.
    - `url` (string, optional): absolute URL to fetch (validated against allowed hosts).
    - `raw` (boolean, optional): if supported, indicates return as-is.
  - Response: returns the upstream content with original `Content-Type`.
  - Notes: restricted to allowed hosts to avoid open proxy.

- `GET /api/v1/stitch/inspect?url=<absolute>`
  - Purpose: Debug helper — performs a GET and returns HTTP status and selected headers (e.g. `x-frame-options`, `content-security-policy`, `content-type`).
  - Response: `{ status: <code>, headers: { ... } }`.

- `GET /api/v1/stitch/launch?url=<absolute>`
  - Purpose: Redirect the user's browser to the vendor URL (uses user's cookies/session). Avoids iframe restrictions.
  - Response: `302` redirect to the provided vendor URL (after host validation).

Configuration (server-side)

- `STITCH_URL` — Base vendor URL (e.g. `https://stitch.withgoogle.com/...`)
- `STITCH_API_KEY` — Server-side API key (must NOT be exposed to client)
- `STITCH_HEADER_NAME` — Header name to set with API key (e.g. `x-api-key`)

Security notes

- The proxy validates absolute URLs and only allows requests to `STITCH_URL` host and known allowed vendor domains to prevent open-proxy abuse.
- Keep `STITCH_API_KEY` in server environment only.

Usage examples (frontend)

- Launch vendor in user's browser (preferred): `window.open('/api/v1/stitch/launch?url=' + encodeURIComponent(vendorUrl))`
- Inspect vendor headers: `fetch('/api/v1/stitch/inspect?url=' + encodeURIComponent(vendorUrl)).then(r => r.json())`
- Send Stitch API request: `fetch('/api/v1/stitch/request', { method: 'POST', body: JSON.stringify({ path: 'v1/requests', json: {...} }) })`

Limitations

- Some vendor pages may return `X-Frame-Options` or CSP that prevent embedding; prefer `launch` redirect flow for interactive UI.
- If an upstream endpoint requires browser session cookies, server-side fetch will not include the user's cookies. Use `launch` to let the browser handle that flow.


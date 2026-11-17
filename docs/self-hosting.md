# Self-Hosting & Deployment

Undercover consists of two deployable workspaces:

- **`apps/server`**: Cloudflare Worker with PartyServer Durable Objects (`Room` class backed by SQLite) and Cloudflare Rate Limiting.
- **`apps/web`**: Static Astro 7 + React 19 web client (deployed to Vercel or any static host that supports `/r/:code` -> `/play` rewrites).

---

## 1. Local Development Setup

Copy the example environment files in both workspaces:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/server/.dev.vars.example apps/server/.dev.vars
```

Both example files come pre-populated with `localhost` URLs and Cloudflare's official always-pass Turnstile test keys:

- `apps/web/.env`:
  ```env
  PUBLIC_WS_HOST=localhost:8787
  PUBLIC_SITE_URL=http://localhost:4321
  PUBLIC_TURNSTILE_SITEKEY=1x00000000000000000000AA
  ```
- `apps/server/.dev.vars`:
  ```env
  ALLOWED_ORIGINS=http://localhost:4321
  TURNSTILE_SECRET=1x0000000000000000000000000000000AA
  ```

Start both development servers from the repository root:

```bash
bun run dev
```

---

## 2. Deploying the Game Server (`apps/server`) to Cloudflare Workers

### Prerequisites

- A Cloudflare account with **Workers Paid** or **Durable Objects** enabled (SQLite-backed Durable Objects are configured in [`apps/server/wrangler.jsonc`](../apps/server/wrangler.jsonc)).
- A [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) widget created for your frontend domain (yields a **Site Key** and a **Secret Key**).

### Step-by-Step Deployment

1. Authenticate Wrangler:
   ```bash
   bunx wrangler login
   ```
2. Set the Turnstile secret key on the Worker:
   ```bash
   cd apps/server
   bunx wrangler secret put TURNSTILE_SECRET
   ```
3. Configure `ALLOWED_ORIGINS` (comma-separated list of allowed web client origins, with no trailing slashes):
   - Either set it in the Cloudflare dashboard under **Workers & Pages -> undercover-server -> Settings -> Variables and Secrets**:
     ```text
     ALLOWED_ORIGINS=https://your-web-domain.example.com
     ```
   - Or pass it via Wrangler / `wrangler.jsonc` before deploying.
4. Configure your Worker domain:
   - **`workers.dev` subdomain**: Works out of the box (`undercover-server.<your-subdomain>.workers.dev`).
   - **Custom domain**: In the Cloudflare dashboard, open **Workers & Pages -> undercover-server -> Settings -> Domains & Routes** and add your custom domain (for example, `ws.aarab.me`), or uncomment the `routes` block in `apps/server/wrangler.jsonc`:
     ```jsonc
     "routes": [{ "pattern": "ws.aarab.me", "custom_domain": true }]
     ```
5. Deploy the Worker and Durable Object:
   ```bash
   cd apps/server
   bunx wrangler deploy
   ```

### Optional: Automated Deployment via GitHub Actions

[`.github/workflows/deploy-server.yml`](../.github/workflows/deploy-server.yml) runs `wrangler deploy` manually via `workflow_dispatch`. To use it, add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to your repository's GitHub Actions secrets.

---

## 3. Deploying the Web Client (`apps/web`) to Vercel

1. Import the repository into Vercel.
2. Configure the project build settings:
   - **Root Directory**: `apps/web`
   - **Framework Preset**: `Astro`
   - **Build Command**: `bun run build` (or `astro check && astro build`)
   - **Output Directory**: `dist`
3. Set the environment variables in the Vercel project dashboard:

| Variable                   | Required | Description                                                                 | Production Example (`aarab.me`)        |
| :------------------------- | :------: | :-------------------------------------------------------------------------- | :------------------------------------- |
| `PUBLIC_WS_HOST`           |   Yes    | Hostname of the deployed Cloudflare Worker (no `https://` or `wss://`).     | `ws.aarab.me`                          |
| `PUBLIC_SITE_URL`          |   Yes    | Canonical public URL of the web app (used for OpenGraph images & sitemaps). | `https://undercover.aarab.me`          |
| `PUBLIC_TURNSTILE_SITEKEY` |   Yes    | Cloudflare Turnstile widget site key.                                       | `<production-turnstile-site-key>`      |
| `PUBLIC_PRIVACY_URL`       |    No    | Optional Privacy Policy URL shown in the footer.                            | `https://www.aarab.me/privacy`         |
| `PUBLIC_TERMS_URL`         |    No    | Optional Terms of Service URL shown in the footer.                          | `https://www.aarab.me/terms`           |
| `PUBLIC_AUTHOR_URL`        |    No    | Optional author link in the footer (defaults to GitHub profile).            | `https://aarab.me`                     |

4. Deploy. [`apps/web/vercel.json`](../apps/web/vercel.json) automatically rewrites `/r/:code` to `/play` for shareable room invite links and sets security headers (`Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).

> [!TIP]
> By default, `apps/web/vercel.json` allows `connect-src 'self' https: wss: ws://localhost:8787 http://localhost:8787 https://challenges.cloudflare.com;` so self-hosters do not have to edit `vercel.json` before deploying. If you want to lock `connect-src` down to your specific Worker domain, replace `https: wss:` in `apps/web/vercel.json` with `wss://ws.aarab.me https://ws.aarab.me` (using your own domain).

---

## 4. Reference Production Configuration (`undercover.aarab.me`)

For the official deployment hosted at `https://undercover.aarab.me` and `wss://ws.aarab.me`:

- **Cloudflare Worker (`undercover-server`)**:
  - Custom Domain Route: `ws.aarab.me`
  - Variable `ALLOWED_ORIGINS`: `https://undercover.aarab.me,http://localhost:4321`
  - Secret `TURNSTILE_SECRET`: `<production-turnstile-secret>`
- **Vercel (`apps/web`)**:
  - `PUBLIC_WS_HOST`: `ws.aarab.me`
  - `PUBLIC_SITE_URL`: `https://undercover.aarab.me`
  - `PUBLIC_TURNSTILE_SITEKEY`: `<production-turnstile-sitekey>`
  - `PUBLIC_PRIVACY_URL`: `https://www.aarab.me/privacy`
  - `PUBLIC_TERMS_URL`: `https://www.aarab.me/terms`
  - `PUBLIC_AUTHOR_URL`: `https://aarab.me`

---

## 5. Troubleshooting

### CORS errors when creating or checking a room (`POST /rooms` or `GET /rooms/:code`)

- **Cause**: The web client's `Origin` header is not listed in the server's `ALLOWED_ORIGINS` variable, or `ALLOWED_ORIGINS` includes a trailing slash.
- **Fix**: Ensure `ALLOWED_ORIGINS` on the Cloudflare Worker contains the exact origin of your web client (e.g. `https://undercover.aarab.me` with `https://` and no trailing `/`). Multiple origins must be comma-separated with no spaces.

### WebSocket connection immediately closes or stays on "Connecting..."

- **Cause 1**: `PUBLIC_WS_HOST` includes a protocol prefix or path (e.g. `wss://ws.example.com/`), or points to the wrong host.
- **Fix 1**: Set `PUBLIC_WS_HOST` to the bare hostname (`ws.example.com` in production, `localhost:8787` locally).
- **Cause 2**: The Worker's WebSocket upgrade check rejected the browser's `Origin` header because `ALLOWED_ORIGINS` does not include the web client origin.
- **Fix 2**: Add the web client origin to `ALLOWED_ORIGINS` in the Cloudflare Worker settings.
- **Cause 3**: Content Security Policy (`connect-src`) in `apps/web/vercel.json` is blocking connections to your Worker domain.
- **Fix 3**: Verify `connect-src` in `apps/web/vercel.json` permits `wss:` and `https:` (or explicitly lists your Worker's `wss://` and `https://` origin).

### Turnstile verification fails on room creation (`403` / bot check error)

- **Cause**: Mismatched `PUBLIC_TURNSTILE_SITEKEY` (web) and `TURNSTILE_SECRET` (server), or your domain is not added to the Turnstile widget's allowed hostnames in Cloudflare.
- **Fix**: For local development, use Cloudflare's always-pass test key (`1x00000000000000000000AA`) and test secret (`1x0000000000000000000000000000000AA`). For production, verify that the Turnstile widget in the Cloudflare dashboard lists your frontend hostname and that `TURNSTILE_SECRET` was uploaded via `bunx wrangler secret put TURNSTILE_SECRET`.

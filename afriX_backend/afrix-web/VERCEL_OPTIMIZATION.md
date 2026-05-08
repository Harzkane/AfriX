# Vercel optimization audit – afrix-web

This project is **already in good shape** for Vercel. The main causes of high usage (e.g. 60GB) are avoided by design. Below is what was checked and what was added.

---

## What usually causes high Vercel usage

1. **Serverless function invocations** – e.g. many `app/api/*` or `getServerSideProps` runs  
2. **Bandwidth** – large or uncached assets, big HTML/JS  
3. **Image optimization** – lots of `next/image` requests with no caching  
4. **Aggressive revalidation** – very short `revalidate` causing constant rebuilds  
5. **Polling / refetch** – `refetchInterval` or timers hitting APIs from many clients  
6. **Middleware on every request** – including static files  

---

## Your project – good by default

| Area | Status | Notes |
|------|--------|--------|
| **API routes** | None | No `app/api/` → no serverless invocations from this app |
| **Server-side data** | None | No `getServerSideProps` / `getStaticProps`; data is client-side via axios to your backend |
| **Polling / refetch** | None | No `refetchInterval` or `setInterval`; data fetched once on mount in hooks |
| **Revalidation** | N/A | No server `fetch()` with `revalidate` in the app |
| **Middleware** | Optimized | Matcher excludes `_next/static`, `_next/image`, favicon, and static images → fewer runs |
| **Images** | Minimal | No `next/image`; one avatar reference was removed to avoid a 404 request |

So the app is mostly **static/SPA-style**: Vercel serves the Next.js app and static assets; the browser talks to your backend. That keeps Vercel usage predictable and low.

---

## Changes made

### 1. `vercel.json` (new)

- **Long-term cache for build output**  
  `/_next/static/*` → `Cache-Control: public, max-age=31536000, immutable`  
  So JS/CSS chunks are cached by the CDN and not re-downloaded every time.

- **Cache for static assets**  
  Images and fonts in `public/` (and similar extensions) → `max-age=86400` with `stale-while-revalidate=604800`  
  Reduces repeat bandwidth and requests.

### 2. `next.config.ts`

- **`reactStrictMode: true`** – better dev experience and avoids some classes of bugs.  
- **`poweredByHeader: false`** – removes `X-Powered-By: Next.js` (minor, no impact on usage).

### 3. Header avatar

- Removed the broken `AvatarImage src="/placeholder-user.jpg"` (file was missing).  
- Avatar now uses only `AvatarFallback` (“AD”), so no 404 request on every load.

---

## Optional improvements (if you want to go further)

1. **Chart components (recharts)**  
   Recharts is a large dependency. You can lazy-load chart components so they’re not in the initial JS bundle on every page, e.g.:

   ```tsx
   const SalesChart = dynamic(() => import("@/components/charts/sales-chart").then(m => ({ default: m.SalesChart })), { ssr: false });
   ```

   Use the same pattern for other chart components on the dashboard. This reduces **initial JS size and bandwidth**, not serverless usage.

2. **Environment variable**  
   Ensure `NEXT_PUBLIC_API_URL` is set in Vercel to your production API URL so the client always hits the right backend.

3. **Build**  
   Run `npm run build` locally (with network so Google Fonts can load). On Vercel, the build will have network access and fonts will work.

---

## Summary

- The app is **already Vercel-friendly**: no API routes, no server-side data fetching on Vercel, no polling, and middleware is scoped to non-static routes.  
- **Cache headers** and the **avatar fix** were added to keep bandwidth and unnecessary requests low.  
- You can add **lazy-loaded charts** later if you want to reduce initial JS size further.

With this setup, you should not see the kind of extreme usage (e.g. 60GB) that can happen with many serverless invocations, aggressive revalidation, or uncached assets.

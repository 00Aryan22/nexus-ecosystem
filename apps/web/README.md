This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

Stitch integration

The Stitch integration page (`/stitch`) contains a `StitchProxy` test UI which can:

- Inspect vendor headers via `/api/v1/stitch/inspect`
- Attempt to fetch vendor widget HTML via `/api/v1/stitch/widget` (may return 404 if vendor endpoint is not accessible server-side)
- Open the vendor site in the user's browser session via `/api/v1/stitch/launch?url=...` (preferred for interactive use)

Notes:
- The Stitch API key must remain server-side in environment variables: `STITCH_URL`, `STITCH_API_KEY`, `STITCH_HEADER_NAME`.
- Many vendor pages block embedding; use the "Open vendor site" button to run interactive flows in your browser where cookies and authentication are available.

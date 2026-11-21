# Mechi Photo Studio & Flex Print

Next.js 14 App Router website for Mechi Photo Studio And Flex Print.

## Local development

```bash
npm install
npm run dev
```

Create a `.env.local` file for the WhatsApp button:

```text
WHATSAPP_NUMBER=
```

Use the international number without `+` or spaces. The button is hidden when this value is absent.

## Tests and build

```bash
npm test
npm run build
npm run start
```

## Vercel deployment

Set `WHATSAPP_NUMBER` in the Vercel project environment settings. No filesystem writes or database state are used. Next.js route handlers serve the tools, sizes and environment-dependent WhatsApp configuration, and static CSS/JS are emitted by the normal Next.js build.

No `vercel.json` override is required.

## Adding a tool

1. Add an entry to `data/tools.config.ts` with `slug`, `title`, `description`, `icon`, `path`, and `status`.
2. Add an App Router page at `app/tools/<slug>/page.tsx`.
3. Keep any tool-specific business logic client-side unless server behavior is genuinely needed.

Use status `coming-soon` until the page is ready. It is rendered as a disabled card.

## Editing print sizes and prices

Edit `data/print-sizes.config.ts` for preset labels and real inch dimensions. Flex presets are stored internally in inches.

The visualizer intentionally does not display prices. `data/print-prices.config.ts` may remain available for future pricing work, but it is not exposed by the print-sizes API or rendered in the tool.

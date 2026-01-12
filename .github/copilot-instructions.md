# Copilot / AI Agent Instructions for kondate-ai

Purpose: concise, actionable guide so an AI coding agent can be immediately productive in this repository.

1) Big picture
- This is a Next.js (App Router) TypeScript app (see [package.json](package.json#L1-L80)).
- UI lives under the `app/` directory; top-level pages and layout are in [app/layout.tsx](app/layout.tsx#L1-L200) and [app/page.tsx](app/page.tsx#L1-L200).
- The project exposes a server API route at [app/api/vision/route.ts](app/api/vision/route.ts#L1-L200) that accepts an image file (FormData) and calls the OpenAI SDK to produce a textual list of ingredients.

2) Key integration points and data flow
- Client: `app/page.tsx` is a client component (starts with "use client") that builds a `FormData` with the image and POSTs to `/api/vision`.
- Server: `app/api/vision/route.ts` reads `req.formData()`, converts the image to base64, and calls `OpenAI` client using `process.env.OPENAI_API_KEY`.
- OpenAI call: uses `client.chat.completions.create` with `model: "gpt-4o-mini"` and a message array that includes a `type: "image_url"` item containing a `data:...base64` URL. Keep this pattern when modifying the multimodal request.

3) Developer workflows (how to run & build)
- Install deps and run dev server locally:

  npm install
  npm run dev

- Build and start for production:

  npm run build
  npm start

- Lint: `npm run lint` runs `eslint` (no custom config in repo root beyond `eslint-config-next`).

4) Environment variables
- The server route expects `OPENAI_API_KEY` in the environment. Locally add it to `.env.local` (not committed).

5) Project-specific conventions and important notes for edits
- App Router & client/server split: files under `app/` are App Router components. If you see "use client" the file runs in the browser and cannot access server-only APIs — move code to an API route or server component if you need server capabilities.
- Image handling: the client sends raw `File` objects via `FormData`; the server encodes them to base64 and supplies them inline to OpenAI. If you change that flow (e.g., uploading to storage), update both client (`app/page.tsx`) and server (`app/api/vision/route.ts`).
- OpenAI usage: the SDK usage and model name are explicit in `route.ts`. When updating prompts or model params, preserve the `messages` array shape used today to avoid runtime errors.
- TypeScript: `tsconfig.json` enables `strict` and Next's plugin — keep types when modifying components and API routes.

6) Files to look at for examples
- UI client: [app/page.tsx](app/page.tsx#L1-L200) — image selection, preview, POST to `/api/vision`.
- API: [app/api/vision/route.ts](app/api/vision/route.ts#L1-L200) — multipart parse, base64, OpenAI call and JSON result.
- Layout & fonts: [app/layout.tsx](app/layout.tsx#L1-L200).
- Scripts & deps: [package.json](package.json#L1-L80).

7) Safe edits checklist for PRs
- Run `npm run dev` and verify the client can upload an image and receive a response from `/api/vision`.
- If changing OpenAI parameters, test with a small image and check server logs for errors. The route logs errors to console on exception.

8) What this file is NOT
- This is not a style guide. It documents only concrete, discoverable patterns and workflows in the repo.

If any section is unclear or you want me to expand examples (e.g., show exact diff to change prompt or switch to external image hosting), tell me which area to iterate on.

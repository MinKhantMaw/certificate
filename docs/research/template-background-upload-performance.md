# Template Background Upload Performance Research

## Scope

This report traces the code path used when a user selects a certificate-template background image. The repository has no existing Markdown notes directory, so this report is stored in `docs/research/`.

## Confirmed Flow

1. The template page lazy-loads the editor only after the create or edit form opens. This affects the first opening of the editor, but not an already-open background upload. Source: [CertificateTemplates.tsx](../../src/pages/CertificateTemplates.tsx#L15-L19), [CertificateTemplates.tsx](../../src/pages/CertificateTemplates.tsx#L133-L162).
2. Selecting **Background** invokes `uploadFile`. The client sends the original `File` directly to `/api/templates/upload` and only updates `layout.background` after `fetch` resolves and the JSON response is parsed. Therefore, the canvas cannot show the selected image until the complete upload request has finished. Source: [TemplateBuilder.tsx](../../src/components/TemplateBuilder.tsx#L126-L144), [TemplateBuilder.tsx](../../src/components/TemplateBuilder.tsx#L214-L221).
3. The upload endpoint accepts images up to 10 MiB, collects the whole request in an in-memory `Buffer[]`, concatenates those buffers, then writes the result to the local `storage/templates/assets` directory before replying. The request is not streamed straight to storage. Source: [upload.ts](../../api/templates/upload.ts#L19-L43).
4. After the server responds, the editor creates a new `HTMLImageElement` for the returned asset URL and waits for its `load` event before rendering the image in Konva. The background is sized to the full certificate canvas. Source: [TemplateBuilder.tsx](../../src/components/TemplateBuilder.tsx#L33-L45), [TemplateBuilder.tsx](../../src/components/TemplateBuilder.tsx#L323-L353).
5. The asset endpoint reads the complete asset into a `Buffer` per request and sends it with one-year immutable browser caching. This helps later loads of the same URL, not the first editor preview after upload. Source: [[assetId].ts](../../api/templates/assets/[assetId].ts#L18-L30).

## Likely Causes Of The Perceived Delay

- **Network transfer time:** The original, potentially 10 MiB image is posted before the UI can set the background URL. Source: [TemplateBuilder.tsx](../../src/components/TemplateBuilder.tsx#L132-L143), [upload.ts](../../api/templates/upload.ts#L19-L43).
- **Server-side buffering and disk work:** The handler retains all chunks, copies them through `Buffer.concat`, creates a directory if needed, and writes the complete file before returning. Source: [upload.ts](../../api/templates/upload.ts#L28-L43).
- **A second transfer plus image decode:** The editor receives only a URL from the upload response, then loads that URL as a separate image request before Konva can draw it. Source: [upload.ts](../../api/templates/upload.ts#L42-L43), [TemplateBuilder.tsx](../../src/components/TemplateBuilder.tsx#L33-L45), [TemplateBuilder.tsx](../../src/components/TemplateBuilder.tsx#L323-L353).
- **No progress or pending state:** The background control always has the same label and remains enabled. Failed upload responses simply return, with no visible error. Source: [TemplateBuilder.tsx](../../src/components/TemplateBuilder.tsx#L126-L144), [TemplateBuilder.tsx](../../src/components/TemplateBuilder.tsx#L212-L221).
- **No image normalization:** The client uploads the selected file unchanged, and the server stores its original bytes. No code in the upload flow resizes, compresses, or produces a preview-sized derivative. Source: [TemplateBuilder.tsx](../../src/components/TemplateBuilder.tsx#L126-L144), [upload.ts](../../api/templates/upload.ts#L19-L43).

## Recommended Changes

1. Show a selected-file preview immediately with `URL.createObjectURL(file)`, while the upload continues in the background. Replace it with the returned persistent URL after success and revoke the object URL. This removes upload transfer time from the first visible preview.
2. Add upload state to the background control: disabled selection while one upload is active, a clear pending indicator, and an error message for rejected or failed requests. This will make latency visible rather than looking like an ignored click.
3. Enforce lower file-size and pixel-dimension limits before upload, then create a compressed or resized background derivative sized for the canvas. The editor canvas is at most 1123 by 794 for the built-in page sizes. Source: [TemplateBuilder.tsx](../../src/components/TemplateBuilder.tsx#L20-L26).
4. For production, store assets in object storage or another durable upload service that supports direct or streamed uploads. The current API writes beneath `process.cwd()`; Vite wires this handler into the local development server, while `vercel.json` rewrites every route to `index.html`. These files do not establish a durable production asset-storage path. Source: [upload.ts](../../api/templates/upload.ts#L15-L15), [vite.config.ts](../../vite.config.ts#L6-L35), [vercel.json](../../vercel.json#L1-L8).

## Fast Validation

Throttle the network in browser developer tools and upload two images with materially different file sizes. In the current implementation, the time from file selection to first rendered canvas background should increase with the time required to POST the original file, then fetch and decode it from the returned asset URL. This validates the flow described above; it does not measure production storage latency.
# Third-Party Licenses & Commercial Use Notes

This document lists the libraries, fonts, and AI models used in **AlHaj Cut Studio**, verified against installed package metadata in `node_modules/` and upstream model cards.

---

## 1. Runtime & UI Libraries (Bundled in Root Static Site)

| Package | Version | License | Commercial Use Notes |
|---|---|---|---|
| `react` / `react-dom` | `19.3.1` | **MIT** | Permitted for commercial & private use with attribution |
| `lucide-react` | `0.546.0` | **ISC** | Permitted for commercial & private use with attribution |
| `jszip` | `3.10.2` | **MIT OR GPL-3.0-or-later** | Dual-licensed; MIT option permits commercial use with attribution |
| `@huggingface/transformers` | `3.8.1` | **Apache-2.0** | Permitted for commercial & private use with attribution & NOTICE |
| `onnxruntime-web` | `1.21.0` | **MIT** | Permitted for commercial & private use with attribution |
| `@gradio/client` | `2.8.0` | **ISC** | Permitted for commercial & private use with attribution |
| `@imgly/background-removal` | `1.7.0` | **GNU AGPL-3.0** (`LICENSE.md`) | **Copyleft restriction:** Public/network deployment or distribution with `@imgly/background-removal` requires AGPL-3.0 compliance (releasing source code under AGPL-3.0) or obtaining a commercial license from IMG.LY GmbH. Notice its bundled `ThirdPartyLicenses.json` lists MIT for ISNet model code, `onnxruntime-web`, `lodash-es`, `ndarray`, and `zod`. |

---

## 2. Bundled Typography (`@fontsource/*`)

| Font Package | Version | License |
|---|---|---|
| `@fontsource/cairo` | `5.3.0` | **SIL Open Font License 1.1 (OFL-1.1)** |
| `@fontsource/tajawal` | `5.3.0` | **SIL Open Font License 1.1 (OFL-1.1)** |
| `@fontsource/readex-pro` | `5.3.0` | **SIL Open Font License 1.1 (OFL-1.1)** |
| `@fontsource/anton` | `5.3.0` | **SIL Open Font License 1.1 (OFL-1.1)** |
| `@fontsource/plus-jakarta-sans` | `5.3.0` | **SIL Open Font License 1.1 (OFL-1.1)** |
| `@fontsource/playfair-display` | `5.3.0` | **SIL Open Font License 1.1 (OFL-1.1)** |

---

## 3. AI Model Weights (Downloaded On-Demand on First Use)

| Model | Engine | Upstream Source | License & Commercial Caveats |
|---|---|---|---|
| `briaai/RMBG-1.4` | `rmbg-local` | Hugging Face (`briaai/RMBG-1.4`) | **Non-Commercial (`bria-rmbg-1.4` / CC-BY-NC-4.0 style restriction):** Free for non-commercial, research, and personal use. Commercial deployment requires purchasing a commercial license from BRIA AI. |
| `Xenova/modnet` | `rmbg-local` (fallback) | Hugging Face (`Xenova/modnet`) / MODNet | **Apache-2.0** — Permissive commercial use allowed. |
| `isnet_fp16` (ISNet) | `imgly-local` | `staticimgly.com/@imgly/background-removal-data/1.7.0/dist/` | Used via `@imgly/background-removal` (AGPL-3.0 wrapper; DIS/ISNet code under MIT). Commercial SaaS without AGPL-3.0 disclosure requires an IMG.LY commercial license. |
| `not-lain/background-removal` | `notlain-cloud` | Hugging Face ZeroGPU Space | Hosted third-party Space (running RMBG-1.4 / BiRefNet variants); subject to Hugging Face Spaces Terms of Service and non-commercial upstream model terms. |

---

## 4. Build-Only Tooling (Isolated inside `_dev/`, Not Uploaded)

| Package | Version | License |
|---|---|---|
| `vite` | `8.4.0` | **MIT** |
| `@vitejs/plugin-react` | `6.3.0` | **MIT** |
| `tailwindcss` / `@tailwindcss/vite` | `4.3.5` | **MIT** |
| `esbuild` | `0.28.2` | **MIT** |
| `typescript` | `7.0.2` | **Apache-2.0** |

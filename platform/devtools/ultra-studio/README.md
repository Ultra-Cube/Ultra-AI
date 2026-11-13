# Ultra Studio — Code-OSS / Open VS Code dev surface (G-2.2 Option 2)

Readiness artifacts for the Devin-like development experience. **No Microsoft
binaries, branding, telemetry, or Marketplace endpoints are used.**

## Contents

- `product.json` — clean `product.json` overrides merged over upstream
  `vscode`'s at build time (VSCodium-style approach):
  - `extensionsGallery` → **Open VSX** (`open-vsx.org`) only
  - telemetry disabled (`enableTelemetry: false`, empty `telemetryEndpoint`)
  - no update/Microsoft endpoints, own data folder `.ultra-studio`
- Sidecar manifest `openvscode-server` in
  `platform/services/engine-supervisor/src/manifests.ts` — the web-IDE server
  the desktop shell embeds, supervised like any other engine (port 8443,
  override via `ULTRA_STUDIO_PORT`).

## Build path (when the Code-OSS toolchain is vendored)

1. Build `microsoft/vscode` from MIT source (or reuse an Open VS Code build).
2. Apply `product.json` overrides before `gulp vscode-web` / desktop build.
3. Ship the resulting `openvscode-server` + workbench as an engine sidecar.
4. Extensions come exclusively from Open VSX; never point at
   `marketplace.visualstudio.com`.

## Licensing

See `docs/v2/legal-licensing.md`: Code-OSS source is MIT; Microsoft build
artifacts are not redistributed. Open VSX terms permit use outside Microsoft
products.

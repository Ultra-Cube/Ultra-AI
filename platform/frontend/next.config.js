// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗ ██╗      ███████╗ ██████╗   █████╗                             ║
// ║ ██║   ██║ ██║      ╚══██╔══╝ ██╔══██╗ ██╔══██╗                           ║
// ║ ██║   ██║ ██║         ██║    ██████╔╝ ███████║                           ║
// ║ ╚██╗ ██╔╝ ██║         ██║    ██╔══██║ ██╔══██║                           ║
// ║  ╚████╔╝ ███████╗    ██║    ██║  ██║ ██║  ██║                            ║
// ║   ╚═══╝  ╚══════╝    ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝                            ║
// ║                                                                          ║
// ║ Project   : Ultra AI — Proprietary AI Platform                           ║
// ║ Developer : Ultra Cube Tech — ucubetech.com                              ║
// ║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
// ║ GitHub Org: github.com/Ultra-Cube                                        ║
// ║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

const WEBUI_ORIGIN =
  process.env.OPEN_WEBUI_ORIGIN ?? 'http://localhost:8080';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return {
      beforeFiles: [
        // Open WebUI same-origin surface. The SPA shell is served under
        // /webui/*; its absolute asset/API/socket paths are claimed at the
        // origin root because nothing else uses these namespaces
        // (Next uses /_next, the :4000 backend has no /api/v1 routes).
        // WebUI SPA deep links work via its own history fallback.
        { source: '/webui', destination: `${WEBUI_ORIGIN}/` },
        { source: '/webui/:path*', destination: `${WEBUI_ORIGIN}/:path*` },
        { source: '/_app/:path*', destination: `${WEBUI_ORIGIN}/_app/:path*` },
        { source: '/static/:path*', destination: `${WEBUI_ORIGIN}/static/:path*` },
        { source: '/api/v1/:path*', destination: `${WEBUI_ORIGIN}/api/v1/:path*` },
        { source: '/oauth/:path*', destination: `${WEBUI_ORIGIN}/oauth/:path*` },
        { source: '/ws/:path*', destination: `${WEBUI_ORIGIN}/ws/:path*` },
        { source: '/manifest.json', destination: `${WEBUI_ORIGIN}/manifest.json` },
        { source: '/favicon.ico', destination: `${WEBUI_ORIGIN}/favicon.ico` },
      ],
      fallback: [
        {
          source: '/api/:path*',
          destination: 'http://127.0.0.1:4000/:path*',
        },
      ],
    };
  },
};

module.exports = nextConfig;

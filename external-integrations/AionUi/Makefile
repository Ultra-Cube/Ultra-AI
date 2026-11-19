# ╔══════════════════════════════════════════════════════════════════════════╗
# ║                                                                          ║
# ║ ██╗   ██╗██╗      █████╗ ██████╗                                         ║
# ║ ██║   ██║██║     ██╔══██╗██╔══██╗                                        ║
# ║ ██║   ██║██║     ███████║██████╔╝                                        ║
# ║ ╚██╗ ██╔╝██║     ██╔══██║██╔══██╗                                        ║
# ║  ╚████╔╝ ███████╗██║  ██║██████╔╝                                        ║
# ║   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝                                         ║
# ║                                                                          ║
# ║ Project   : Ultra AI — Proprietary AI Platform                           ║
# ║ Developer : Ultra Cube Tech — ucubetech.com                              ║
# ║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
# ║ GitHub Org: github.com/Ultra-Cube                                        ║
# ║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
# ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
# ║ [UCUBETECH-COPYRIGHT]                                                    ║
# ║                                                                          ║
# ╚══════════════════════════════════════════════════════════════════════════╝


cat-config:
	@base64 -D -i ~/.aionui-config-dev/aionui-config.txt | python3 -c 'import sys, urllib.parse; print(urllib.parse.unquote(sys.stdin.read()))' | pbcopy

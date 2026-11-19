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
# ║ GitHub    : github.com/Ultra-Cube                                        ║
# ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
# ║ [UCUBETECH-COPYRIGHT]                                                    ║
# ║                                                                          ║
# ╚══════════════════════════════════════════════════════════════════════════╝


cat-config:
	@base64 -D -i ~/.aionui-config-dev/aionui-config.txt | python3 -c 'import sys, urllib.parse; print(urllib.parse.unquote(sys.stdin.read()))' | pbcopy

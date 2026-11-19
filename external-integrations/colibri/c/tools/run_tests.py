#!/usr/bin/env python3
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

"""Run C test binaries, exiting non-zero on the first failure.

Used by `make test-c` so the test runner works from any shell (cmd.exe,
PowerShell, Git Bash, MSYS2) without a POSIX `for` loop. Each test binary
is a positional argument.
"""
import os
import subprocess
import sys

failed = []
for binary in sys.argv[1:]:
    rc = subprocess.call([os.path.normpath(binary)])
    if rc != 0:
        failed.append(binary)
if failed:
    for f in failed:
        print(f"FAILED: {f}", file=sys.stderr)
    sys.exit(1)

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║                                                                          ║
# ║ ██╗   ██╗ ██╗      ███████╗ ██████╗   █████╗                             ║
# ║ ██║   ██║ ██║      ╚══██╔══╝ ██╔══██╗ ██╔══██╗                           ║
# ║ ██║   ██║ ██║         ██║    ██████╔╝ ███████║                           ║
# ║ ╚██╗ ██╔╝ ██║         ██║    ██╔══██║ ██╔══██║                           ║
# ║  ╚████╔╝ ███████╗    ██║    ██║  ██║ ██║  ██║                            ║
# ║   ╚═══╝  ╚══════╝    ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝                            ║
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

FROM debian:stable-slim 

# We install the necessary packages to download and compile the code
RUN apt-get update && \
	apt-get install -y locales git build-essential python3 python3-pip && \
	rm -rf /var/lib/apt/lists/* && \
	mkdir /app

# Let's clone the repository
WORKDIR /app
RUN git clone https://github.com/JustVugg/colibri.git .
WORKDIR /app/c
# It's time to compile
RUN ./setup.sh && ./coli build


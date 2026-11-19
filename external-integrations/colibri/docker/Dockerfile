# [UCUBETECH-COPYRIGHT]
# Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
# Developed by Ultra Zone Team — ultra-zone.ucubetech.com
# GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

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


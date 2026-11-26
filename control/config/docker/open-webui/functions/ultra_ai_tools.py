"""
title: Ultra AI Platform
author: Ultra Cube Tech
version: 1.0.0
description: Exposes the Ultra AI control plane (agent teams, model families, apps, engines, Hermes, n8n) as chat tools inside Open WebUI.
requirements: requests
"""

import json
import os

import requests
from pydantic import BaseModel

__manifest__ = {
    "name": "Ultra AI Platform",
    "description": (
        "Exposes the Ultra AI control plane (agent teams, model families, "
        "apps, engines, Hermes, n8n) as chat tools inside Open WebUI."
    ),
    "version": "1.0.0",
    "author": "Ultra Cube Tech",
    "requirements": ["requests"],
}

CORE_API = os.environ.get("ULTRA_CORE_API", "http://host.docker.internal:4000")
TIMEOUT = 5


def _get(path: str):
    try:
        r = requests.get(f"{CORE_API}{path}", timeout=TIMEOUT)
        if r.status_code != 200:
            return {"error": f"core-api {path} -> HTTP {r.status_code}"}
        return r.json()
    except Exception as e:
        return {"error": f"core-api unreachable: {e}"}


class Tools:
    def __init__(self):
        pass

    def get_tools(self):
        return [
            {
                "type": "function",
                "function": {
                    "name": "ultra_agent_teams",
                    "description": (
                        "List Ultra AI agent teams (Dot, Muse, Grok Bot, SkillTree, AnyModelBot) "
                        "with their role, trigger, deliverable and engine."
                    ),
                    "parameters": {"type": "object", "properties": {}},
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "ultra_apps_status",
                    "description": (
                        "Live status of all Ultra AI platform apps/engines "
                        "(n8n, OpenClaw, OmniRoute, Hermes, Open WebUI, Ollama, ...)."
                    ),
                    "parameters": {"type": "object", "properties": {}},
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "ultra_model_families",
                    "description": (
                        "List Agent OS model families (LLM, LCM, LAM, MoE, VLM, SLM, MLM, SAM) "
                        "and registered models including DeepSeek harness and Kimi K2/K3."
                    ),
                    "parameters": {"type": "object", "properties": {}},
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "ultra_platform_overview",
                    "description": (
                        "High-level Ultra AI platform summary: health, services, engines, "
                        "work queue depth."
                    ),
                    "parameters": {"type": "object", "properties": {}},
                },
            },
        ]

    async def ultra_agent_teams(self, **kwargs):
        return json.dumps(_get("/hermes/teams"), ensure_ascii=False, indent=2)

    async def ultra_apps_status(self, **kwargs):
        return json.dumps(_get("/apps"), ensure_ascii=False, indent=2)

    async def ultra_model_families(self, **kwargs):
        return json.dumps(_get("/models"), ensure_ascii=False, indent=2)

    async def ultra_platform_overview(self, **kwargs):
        summary = {
            "health": _get("/health"),
            "services": _get("/services"),
            "engines": _get("/engines"),
            "work_pending": _get("/work/pending"),
        }
        return json.dumps(summary, ensure_ascii=False, indent=2)

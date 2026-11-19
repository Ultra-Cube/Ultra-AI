<!--[UCUBETECH-COPYRIGHT]
 Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
 Developed by Ultra Zone Team — ultra-zone.ucubetech.com
 GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved-->

# @ultra-ai/skill-registry

P1A-04 — skill registry for SKILL.md packs: recursive scan, name/version dedupe,
scope + platform + query filtering, pluggable signing/verification, and signed
pack manifests for import/export.

```ts
import { SkillRegistry } from "@ultra-ai/skill-registry";

const reg = new SkillRegistry({ roots: ["brain-stack/skills"], scopes: ["core"] });
reg.scan();
reg.list({ platform: "hermes", query: "eval" });
```

Signing is injected (`sign`/`verify` take caller-provided functions) so the
package stays zero-dep and crypto-agnostic — wire Ed25519 from the platform
key layer when available.

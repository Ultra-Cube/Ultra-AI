<!--
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║ ██╗   ██╗██╗      █████╗ ██████╗                                         ║
║ ██║   ██║██║     ██╔══██╗██╔══██╗                                        ║
║ ██║   ██║██║     ███████║██████╔╝                                        ║
║ ╚██╗ ██╔╝██║     ██╔══██║██╔══██╗                                        ║
║  ╚████╔╝ ███████╗██║  ██║██████╔╝                                        ║
║   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝                                         ║
║                                                                          ║
║ Project   : Ultra AI — Proprietary AI Platform                           ║
║ Developer : Ultra Cube Tech — ucubetech.com                              ║
║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
║ GitHub    : github.com/Ultra-Cube                                        ║
║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
║ [UCUBETECH-COPYRIGHT]                                                    ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
-->

# @ultra-ai/secrets-vault

Multi-provider secrets vault for the Ultra-AI platform (P1A-10).

Providers implement `SecretProvider` (`get`/`set`/`delete`/`list`). Built-ins:

- `EnvProvider` — read-only `process.env` lookups (optional prefix)
- `FileProvider` — flat `KEY=value` file, written with mode `0600`

`SecretsVault` walks providers in order on `get`, writes to the first writable
provider on `set`, unions `list()` for `listKeys()` (used by redaction sweeps),
and exposes `envFor(keys)` to build child-process env maps.

```ts
import { SecretsVault, EnvProvider, FileProvider } from '@ultra-ai/secrets-vault';

const vault = new SecretsVault({
  providers: [new FileProvider('/etc/ultra/secrets.env'), new EnvProvider('ULTRA_')],
});
const key = await vault.get('DEEPSEEK_API_KEY');
```

Additional backends (secret-tool, keychain, OS keyring) plug in by implementing
`SecretProvider` — no vault changes required.

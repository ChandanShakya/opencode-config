# opencode-config

My global [OpenCode](https://opencode.ai) configuration: MCP servers, plugins, skills, and commands.

## What's inside

- `opencode.jsonc` — MCP servers (`github` remote via `GITHUB_TOKEN`, `brave-devtools` local) and plugin list
- `cli.json` — TUI preferences
- `plugins/warp-rotate.js` — custom plugin: auto-rotates Cloudflare WARP IP when a provider rate-limits (max once per 10 min)
- `skills/`, `commands/`, `agents/` — installed skills and custom commands
- `AGENTS.md` — terse-response style rules (caveman)

## Use it

1. Clone to your OpenCode config dir (`~/.config/opencode`).
2. Set secrets as env vars (never in files): `GITHUB_TOKEN`.
3. Install the caveman plugin files: `git clone https://github.com/JuliusBrussee/caveman /tmp/caveman && node /tmp/caveman/installer/install.js --only opencode`.
4. Restart the OpenCode service: `opencode service restart`.

## Notes

- `service.json` and machine-local state are git-ignored on purpose.
- `memory/` is empty scaffolding; real memory files stay local.

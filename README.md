# opencode-config

My global [OpenCode](https://opencode.ai) configuration: MCP servers, plugins, skills, and commands.

Replicate this setup on a new machine with the steps below.

## Prerequisites

- OpenCode CLI installed and on `PATH` (`opencode --version` works).
- Node.js plus `npx` on `PATH` (required by local `brave-devtools` MCP via `npx -y brave-mcp@latest`).
- Brave browser binary at `/usr/bin/brave-origin`. If Brave lives elsewhere, edit `executablePath` in `opencode.jsonc` before starting OpenCode.
- `GITHUB_TOKEN` exported in the environment. The `github` MCP server reads it via `{env:GITHUB_TOKEN}`. Never paste the token into a file.
- Optional, only for WARP auto-rotation: `warp-cli` and `curl` on `PATH`. Without them, everything else still works and `plugins/warp-rotate.js` just fails its rotation silently.

## What's inside

- `opencode.jsonc` — MCP servers and plugin list:
  - `github`: remote `https://api.githubcopilot.com/mcp/`, header `Authorization: Bearer {env:GITHUB_TOKEN}`, `oauth: false`.
  - `brave-devtools`: local `npx -y brave-mcp@latest --executablePath /usr/bin/brave-origin`.
  - `cloudflare-api`: remote `https://mcp.cloudflare.com/mcp`.
  - Plugins: `@tarquinen/opencode-dcp`, `oh-my-opencode-slim`, `opencode-agent-memory`, `github:obra/superpowers`, `./plugins/caveman`.
  - `formatter: true`, `compaction.auto: true`.
- `cli.json` — TUI preferences: word-wrap diffs, auto sidebar, no scrollbar, hidden thinking, animations on.
- `dcp.jsonc` — schema pointer for `@tarquinen/opencode-dcp` dynamic context pruning.
- `package.json` + `package-lock.json` — tracked manifests; dependency is `@opencode-ai/plugin` `1.17.9`. `node_modules/` is git-ignored and rebuilt with `npm install`.
- `plugins/warp-rotate.js` — custom plugin: watches `session.error` events for rate-limit matches (`429`, `rate limit`, `too many requests`, `quota exceeded`, `tokens per minute`, `requests per minute`), then runs `warp-cli disconnect`, `warp-cli registration delete`, `warp-cli registration new`, `warp-cli connect` with `curl https://api.ipify.org` before/after checks. Cooldown: max once per 10 minutes. Failed prompt does NOT auto-retry; resend the prompt after rotation.
- `plugins/caveman/` — caveman voice plugin, installed by the caveman installer (see step 4).
- `skills/` — `cavecrew/`, `caveman/`, `caveman-commit/`, `caveman-compress/`, `caveman-help/`, `caveman-review/`, `caveman-stats/`, `genoffice/`, `megacave/`, `ultracave/`.
- `commands/` — `caveman.md`, `caveman-commit.md`, `caveman-compress.md`, `caveman-help.md`, `caveman-review.md`, `caveman-stats.md`, `megacave.md`, `ultracave.md`.
- `agents/` — `cavecrew-builder.md`, `cavecrew-investigator.md`, `cavecrew-reviewer.md`.
- `AGENTS.md` — terse-response style rules (caveman).

## Install

Run on the new machine:

1. Clone to the OpenCode config dir:

```sh
git clone https://github.com/ChandanShakya/opencode-config ~/.config/opencode
cd ~/.config/opencode
```

2. Export secrets (never inside repo):

```sh
export GITHUB_TOKEN="$(cat ~/.local/share/opencode/.github-token)"
```

If no token file exists yet, create one at `~/.local/share/opencode/.github-token` with mode `600` and paste the token once, then run the export above. Never store token inside `~/.config/opencode`. The token must stay out of `opencode.jsonc`, shell history, and git.

3. Rebuild dependencies:

```sh
cd ~/.config/opencode
npm install
```

This recreates git-ignored `node_modules/` from `package.json` and `package-lock.json`.

4. Install the caveman plugin files:

```sh
git clone https://github.com/JuliusBrussee/caveman /tmp/caveman
node /tmp/caveman/installer/install.js --only opencode
```

This populates `plugins/caveman/`, `skills/caveman*/`, `skills/ultracave/`, `skills/megacave/`, `commands/`, and `AGENTS.md` content tracked in this repo.

5. Fix the Brave path if needed:

```sh
ls -l /usr/bin/brave-origin
```

If that path does not exist, find the real binary with `which brave brave-browser brave-browser-stable`, then edit the `executablePath` value under `mcp.servers.brave-devtools.command` in `~/.config/opencode/opencode.jsonc`.

6. Restart the OpenCode service:

```sh
opencode service restart
```

7. Verify MCP servers and plugins:

```sh
opencode mcp list
opencode plugin list
```

Expect `github`, `brave-devtools`, `cloudflare-api` in the MCP list and `@tarquinen/opencode-dcp`, `oh-my-opencode-slim`, `opencode-agent-memory`, `superpowers`, `caveman`, `warp-rotate` in the plugin list. Then run a smoke prompt in `opencode` and confirm no MCP auth error appears.

## What NOT to copy

These are machine-local state or secrets and are git-ignored on purpose. Never commit them, never copy them between machines by hand:

- `service.json` — local service registration.
- `.caveman-active` — local caveman active flag.
- `.caveman-mode-log.jsonl` — local mode log.
- `.caveman-opencode-ownership.json` — local ownership record.
- `.ponytail-active` — local ponytail flag.
- `.omo/` — local oh-my-opencode state.
- `.codegraph` — local symlink.
- `memory/` and `.opencode/memory/` — empty scaffolding here; real memory files stay local.
- `node_modules/` — rebuilt via `npm install`.
- `.env`, `.env.*`, `*.key`, `*.pem`, `*.p12`, `*.pfx`, `secrets/`, `opencode.jsonc.bak` — secrets and backups, never published.

## Security note

`GITHUB_TOKEN` is the only secret this config needs. Keep it as an env var only. Do not write it into `opencode.jsonc`, `service.json`, shell rc files in plaintext without need, or any tracked file. If a token ever lands in a file by accident, rotate it on GitHub immediately, delete the file or scrub the line, and check `git status` before the next commit.

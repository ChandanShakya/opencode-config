// Auto-rotate Cloudflare WARP IP when a provider rate-limits a session.
// opencode 2.x plugin API: default export { id, setup(ctx) }.
// Cooldown: max once per 10 minutes. The failed prompt does NOT auto-retry:
// after rotation, resend your prompt.
import { execFile } from 'node:child_process';

const COOLDOWN_MS = 10 * 60 * 1000;
const RATE_LIMIT_RE = /429|rate.?limit|too many requests|quota exceeded|tokens per minute|requests per minute/i;

function run(cmd, args) {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout: 30000 }, (err, stdout) => {
      resolve(err ? '' : String(stdout || '').trim());
    });
  });
}

export default {
  id: 'warp-rotate',
  async setup(ctx) {
    let lastRun = 0;
    let running = false;
    const controller = new AbortController();

    const log = (level, message) => {
      try {
        const p = ctx?.app?.log?.({ body: { service: 'warp-rotate', level, message } });
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch {}
    };

    async function rotate(reason) {
      const now = Date.now();
      if (running) return;
      if (now - lastRun < COOLDOWN_MS) {
        await log('info', `Skipping WARP rotation (cooldown). Trigger: ${reason}`);
        return;
      }
      running = true;
      try {
        await log('warn', `Rate limit detected (${reason}). Rotating WARP IP...`);
        const oldIp = await run('curl', ['-4', '-fsS', '--max-time', '10', 'https://api.ipify.org']);
        await run('warp-cli', ['disconnect']);
        await run('warp-cli', ['registration', 'delete']);
        await run('warp-cli', ['registration', 'new']);
        await run('warp-cli', ['connect']);
        await new Promise((r) => setTimeout(r, 8000));
        const newIp = await run('curl', ['-4', '-fsS', '--max-time', '10', 'https://api.ipify.org']);
        lastRun = Date.now();
        if (newIp && newIp !== oldIp) {
          await log('info', `WARP IP rotated: ${oldIp} -> ${newIp}. Resend your prompt.`);
        } else {
          await log('error', `WARP rotation did not change IP (still ${newIp || oldIp}). Run wr manually.`);
        }
      } catch (err) {
        await log('error', `WARP rotation failed: ${err && err.message ? err.message : err}`);
      } finally {
        running = false;
      }
    }

    (async () => {
      for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
        if (!event || event.type !== 'session.error') continue;
        let m = null;
        try {
          m = JSON.stringify(event).match(RATE_LIMIT_RE);
        } catch {}
        if (m) await rotate(m[0]);
      }
    })().catch(() => {});

    return () => controller.abort();
  },
};

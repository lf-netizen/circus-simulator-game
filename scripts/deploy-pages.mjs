import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const git = (args, cwd = root) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
if (!existsSync(join(dist, 'index.html'))) throw new Error('Build the game before deploying. Run pnpm run deploy.');
const remote = git(['remote', 'get-url', 'origin']);
const authorName = git(['config', 'user.name']);
const authorEmail = git(['config', 'user.email']);
const source = git(['rev-parse', '--short', 'HEAD']);
const lookup = spawnSync('git', ['ls-remote', '--exit-code', '--heads', 'origin', 'gh-pages'], { cwd: root, encoding: 'utf8' });
if (![0, 2].includes(lookup.status)) throw new Error(lookup.stderr || 'Cannot reach origin.');
const staging = mkdtempSync(join(tmpdir(), 'grand-tour-pages-'));
try {
  if (lookup.status === 0) {
    git(['clone', '--single-branch', '--branch', 'gh-pages', remote, staging]);
  } else {
    git(['init', '-b', 'gh-pages'], staging);
    git(['remote', 'add', 'origin', remote], staging);
  }
  git(['config', 'user.name', authorName], staging);
  git(['config', 'user.email', authorEmail], staging);
  // Replace only the generated deployment tree, keeping its Git history.
  for (const entry of readdirSync(staging)) {
    if (entry !== '.git') rmSync(join(staging, entry), { recursive: true, force: true });
  }
  cpSync(dist, staging, { recursive: true });
  writeFileSync(join(staging, '.nojekyll'), '');
  git(['add', '--all'], staging);
  if (!git(['status', '--porcelain'], staging)) {
    console.log('The gh-pages branch already contains this build.');
  } else {
    console.log(git(['commit', '-m', `Deploy The Grand Tour from ${source}`], staging));
    // Normal fast-forward push: never overwrite concurrent deployments.
    git(['push', 'origin', 'HEAD:gh-pages'], staging);
    console.log('Published the local build to origin/gh-pages.');
  }
  console.log('Site: https://lf-netizen.github.io/circus-simulator-game/');
} finally {
  rmSync(staging, { recursive: true, force: true });
}

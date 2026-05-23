const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch {
    return null;
  }
}

function listFilesRecursive(dir, base = dir) {
  const files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...listFilesRecursive(fullPath, base));
      } else {
        files.push({
          absolute: fullPath,
          relative: path.relative(base, fullPath),
          size: entry.isFile() ? fs.statSync(fullPath).size : 0,
        });
      }
    }
  } catch {
    // ignore unreadable dirs
  }
  return files;
}

function parseBaseFromViteConfig(projectPath) {
  const candidates = [
    'vite.config.js',
    'vite.config.ts',
    'vite.config.mjs',
    'vite.config.cjs',
  ];
  for (const name of candidates) {
    const cfgPath = path.join(projectPath, name);
    if (fs.existsSync(cfgPath)) {
      try {
        const content = fs.readFileSync(cfgPath, 'utf-8');
        const match = content.match(/base\s*:\s*['"`]([^'"`]+)['"`]/);
        if (match) return match[1];
      } catch {
        // ignore
      }
    }
  }
  return null;
}

function resolveAssetPath(hrefOrSrc, basePath) {
  if (!hrefOrSrc) return null;
  if (hrefOrSrc.startsWith('http://') || hrefOrSrc.startsWith('https://') || hrefOrSrc.startsWith('//')) {
    return null; // external, skip
  }
  if (hrefOrSrc.startsWith('/')) {
    return hrefOrSrc;
  }
  return path.posix.join(basePath || '/', hrefOrSrc);
}

async function runBuild(projectPath) {
  return new Promise((resolve, reject) => {
    let cmd = 'npm';
    let args = ['run', 'build'];
    if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) {
      cmd = 'pnpm';
    } else if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) {
      cmd = 'yarn';
      args = ['build'];
    }

    const child = spawn(cmd, args, {
      cwd: projectPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => { stdout += d; });
    child.stderr.on('data', d => { stderr += d; });

    child.on('close', code => {
      if (code !== 0) {
        reject(new Error(`Build exited with code ${code}. stderr: ${stderr}`));
      } else {
        resolve({ stdout, stderr });
      }
    });

    child.on('error', err => reject(err));
  });
}

async function testBuild(projectPath) {
  const absPath = path.resolve(projectPath);
  const pkgPath = path.join(absPath, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    throw new Error(`package.json not found at ${absPath}`);
  }

  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  } catch (e) {
    throw new Error(`Failed to parse package.json: ${e.message}`);
  }

  if (!pkg.scripts?.build) {
    throw new Error('No "build" script found in package.json');
  }

  const results = {
    buildSuccess: false,
    distExists: false,
    distHasFiles: false,
    indexHtmlExists: false,
    hasScriptTag: false,
    hasLinkTag: false,
    assetPathsResolvable: false,
    basePath: null,
    jsSizeOk: false,
    cssSizeOk: false,
    errors: [],
    warnings: [],
  };

  try {
    await runBuild(absPath);
    results.buildSuccess = true;
  } catch (e) {
    results.errors.push(`Build failed: ${e.message}`);
    return results;
  }

  const distPath = path.join(absPath, 'dist');
  if (fs.existsSync(distPath)) {
    results.distExists = true;
  } else {
    results.errors.push('dist/ directory does not exist after build');
    return results;
  }

  const allFiles = listFilesRecursive(distPath);
  if (allFiles.length > 0) {
    results.distHasFiles = true;
  } else {
    results.errors.push('dist/ directory is empty');
    return results;
  }

  const indexHtmlPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    results.indexHtmlExists = true;
  } else {
    results.errors.push('dist/index.html does not exist');
    return results;
  }

  let html;
  try {
    html = fs.readFileSync(indexHtmlPath, 'utf-8');
  } catch (e) {
    results.errors.push(`Failed to read index.html: ${e.message}`);
    return results;
  }

  results.hasScriptTag = /<script[^>]*>/i.test(html);
  results.hasLinkTag = /<link[^>]*>/i.test(html);

  if (!results.hasScriptTag) {
    results.warnings.push('No <script> tag found in index.html');
  }
  if (!results.hasLinkTag) {
    results.warnings.push('No <link> tag found in index.html');
  }

  // Determine base path
  const viteBase = parseBaseFromViteConfig(absPath);
  let basePath = viteBase || '/';

  const baseTagMatch = html.match(/<base\s+href\s*=\s*["']([^"']+)["']\s*\/?>/i);
  if (baseTagMatch) {
    basePath = baseTagMatch[1];
    results.basePath = basePath;
  } else if (viteBase) {
    results.basePath = viteBase;
  } else {
    results.basePath = '/';
  }

  // Check asset paths
  const srcMatches = [...html.matchAll(/<script[^>]+src\s*=\s*["']([^"']+)["']/gi)];
  const hrefMatches = [...html.matchAll(/<link[^>]+href\s*=\s*["']([^"']+)["']/gi)];
  const assets = [];
  for (const m of srcMatches) assets.push(m[1]);
  for (const m of hrefMatches) assets.push(m[1]);

  const unresolved = [];
  for (const asset of assets) {
    const resolved = resolveAssetPath(asset, basePath);
    if (resolved === null) continue; // external
    const rel = resolved.startsWith('/') ? resolved.slice(1) : resolved;
    const assetPath = path.join(distPath, rel);
    if (!fs.existsSync(assetPath)) {
      unresolved.push(asset);
    }
  }

  if (unresolved.length === 0) {
    results.assetPathsResolvable = true;
  } else {
    results.errors.push(`Unresolved asset paths: ${unresolved.join(', ')}`);
  }

  // Check JS/CSS sizes
  const jsFiles = allFiles.filter(f => f.relative.endsWith('.js'));
  const cssFiles = allFiles.filter(f => f.relative.endsWith('.css'));

  const JS_LIMIT = 500 * 1024;
  const CSS_LIMIT = 100 * 1024;

  let jsTooLarge = false;
  for (const f of jsFiles) {
    if (f.size > JS_LIMIT) {
      jsTooLarge = true;
      results.warnings.push(`JS file too large: ${f.relative} (${(f.size / 1024).toFixed(1)}KB > 500KB)`);
    }
  }
  results.jsSizeOk = !jsTooLarge;

  let cssTooLarge = false;
  for (const f of cssFiles) {
    if (f.size > CSS_LIMIT) {
      cssTooLarge = true;
      results.warnings.push(`CSS file too large: ${f.relative} (${(f.size / 1024).toFixed(1)}KB > 100KB)`);
    }
  }
  results.cssSizeOk = !cssTooLarge;

  return results;
}

module.exports = { testBuild };

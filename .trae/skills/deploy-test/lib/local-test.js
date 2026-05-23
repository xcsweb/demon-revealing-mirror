const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchLocalhost(port, host = '127.0.0.1') {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://${host}:${port}/`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', err => reject(err));
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('HTTP request timeout'));
    });
  });
}

async function waitForServer(port, timeout, interval = 800) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetchLocalhost(port);
      if (res.statusCode >= 200 && res.statusCode < 400) {
        return res;
      }
    } catch {
      // ignore
    }
    await sleep(interval);
  }
  throw new Error(`Server did not become ready on port ${port} within ${timeout}ms`);
}

function findAvailablePort(preferred = 5173) {
  return new Promise((resolve, reject) => {
    const server = require('http').createServer();
    server.listen(preferred, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      // preferred port in use, let OS pick one
      const fallback = require('http').createServer();
      fallback.listen(0, '127.0.0.1', () => {
        const port = fallback.address().port;
        fallback.close(() => resolve(port));
      });
      fallback.on('error', err => reject(err));
    });
  });
}

async function testLocalDev(projectPath, timeout = 60000) {
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

  const devScript = pkg.scripts?.dev;
  if (!devScript) {
    throw new Error('No "dev" script found in package.json');
  }

  const port = await findAvailablePort(5173);
  const env = { ...process.env, PORT: String(port) };

  // Detect package manager
  let cmd = 'npm';
  let args = ['run', 'dev'];
  if (fs.existsSync(path.join(absPath, 'pnpm-lock.yaml'))) {
    cmd = 'pnpm';
  } else if (fs.existsSync(path.join(absPath, 'yarn.lock'))) {
    cmd = 'yarn';
    args = ['dev'];
  }

  const child = spawn(cmd, args, {
    cwd: absPath,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', d => { stdout += d; });
  child.stderr.on('data', d => { stderr += d; });

  const cleanup = () => {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      try {
        child.kill('SIGTERM');
      } catch {
        // ignore
      }
    }
  };

  const results = {
    serverStarted: false,
    http200: false,
    hasRootElement: false,
    noFatalError: false,
    port,
    errors: [],
  };

  try {
    const res = await waitForServer(port, timeout);
    results.serverStarted = true;

    if (res.statusCode === 200) {
      results.http200 = true;
    } else {
      results.errors.push(`Unexpected status code: ${res.statusCode}`);
    }

    const body = res.body || '';
    if (/<[^>]*id\s*=\s*["']root["'][^>]*>/i.test(body) || /<[^>]*id\s*=\s*root[^>]*>/i.test(body)) {
      results.hasRootElement = true;
    } else {
      results.errors.push('HTML body does not contain #root element');
    }

    const fatalPatterns = [/fatal error/i, /uncaught exception/i, /crash/i];
    const hasFatal = fatalPatterns.some(p => p.test(body));
    if (!hasFatal) {
      results.noFatalError = true;
    } else {
      results.errors.push('Fatal error indicators found in HTML response');
    }
  } catch (e) {
    results.errors.push(e.message);
  } finally {
    cleanup();
    await sleep(500);
  }

  return results;
}

module.exports = { testLocalDev };

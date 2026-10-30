#!/usr/bin/env node
import http from 'node:http';
import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const port = Number(process.env.PORT || 5177);
const requestedLocalAssetRoot = process.env.MAP_ASSET_MAP_ASSET_DIR || 'C:\\Users\\Public\\Pictures\\map_assets';
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.mjs': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml'
};

function resolveMaybeWindows(input, base = root) {
  const value = String(input || '').trim();
  if (/^[A-Za-z]:[\\/]/.test(value)) return path.normalize(value);
  if (path.isAbsolute(value)) return path.normalize(value);
  return path.resolve(base, value);
}

const localAssetRoot = resolveMaybeWindows(requestedLocalAssetRoot);

function sendText(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end(message);
}

function corsHeaders(type) {
  return {
    'Content-Type': type,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

async function existingFilePath(candidate) {
  try {
    const stat = await fs.stat(candidate);
    if (stat.isFile()) return candidate;
  } catch {}
  return null;
}

async function resolveLocalAsset(rel) {
  const cleanRel = String(rel || '').replace(/^\/+/, '').replace(/\\/g, '/');
  const parts = cleanRel.split('/').filter(Boolean);
  const candidates = [];
  const add = value => {
    const clean = String(value || '').replace(/^\/+/, '');
    if (!clean) return;
    const filePath = path.resolve(localAssetRoot, clean);
    const rootCheck = path.resolve(localAssetRoot).toLowerCase();
    if (filePath.toLowerCase().startsWith(rootCheck) && !candidates.includes(filePath)) candidates.push(filePath);
  };

  add(cleanRel);
  if (parts.length > 1) add(parts.slice(1).join('/'));
  if (parts.length) add(parts[parts.length - 1]);
  if (parts.length > 1) add(`${parts[0]}/${parts[0]}/${parts.slice(1).join('/')}`);

  for (const candidate of candidates) {
    const found = await existingFilePath(candidate);
    if (found) return found;
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders('text/plain; charset=utf-8'));
      res.end();
      return;
    }
    const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
    const rawPath = decodeURIComponent(url.pathname === '/' ? '/MapAssetPackager.html' : url.pathname);

    if (rawPath === '/map_asset-local-bridge-status') {
      let rootStatus = 'missing';
      try { rootStatus = (await fs.stat(localAssetRoot)).isDirectory() ? 'ok' : 'not-directory'; }
      catch {}
      res.writeHead(200, corsHeaders('application/json; charset=utf-8'));
      res.end(JSON.stringify({ ok: rootStatus === 'ok', localAssetRoot, rootStatus }));
      return;
    }

    if (rawPath.startsWith('/local-map-assets/')) {
      const rel = rawPath.slice('/local-map-assets/'.length).replace(/^\/+/, '');
      const filePath = await resolveLocalAsset(rel);
      if (!filePath) {
        sendText(res, 404, `Local image bridge could not find: ${rel}\nLooked under: ${localAssetRoot}`);
        return;
      }
      res.writeHead(200, corsHeaders(mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream'));
      if (req.method === 'HEAD') res.end();
      else createReadStream(filePath).pipe(res);
      return;
    }

    const filePath = path.resolve(root, `.${rawPath}`);
    if (!filePath.startsWith(root)) throw new Error('Out of bounds project path');
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) throw new Error('Project asset is not a file');
    res.writeHead(200, corsHeaders(mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream'));
    if (req.method === 'HEAD') res.end();
    else createReadStream(filePath).pipe(res);
  } catch (err) {
    sendText(res, 404, 'MapAssetPackager cannot find that file. Launch from the MapAssetPackager folder and keep real images at C:\\Users\\Public\\Pictures\\map_assets, or set MAP_ASSET_MAP_ASSET_DIR.');
  }
});

server.listen(port, '127.0.0.1', async () => {
  let rootStatus = 'not checked';
  try { rootStatus = (await fs.stat(localAssetRoot)).isDirectory() ? 'FOUND' : 'NOT A FOLDER'; }
  catch { rootStatus = 'MISSING'; }
  console.log(`MapAssetPackager is previewing at http://127.0.0.1:${port}/`);
  console.log(`Local map_assets image bridge: http://127.0.0.1:${port}/local-map-assets/`);
  console.log(`Serving real images from: ${localAssetRoot}`);
  console.log(`Real image folder status: ${rootStatus}`);
  console.log('Keep this window open while building ZIP packages.');
});

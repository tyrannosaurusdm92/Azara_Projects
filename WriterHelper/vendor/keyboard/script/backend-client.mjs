/* Thin, public endpoint-only browser adapter. NO Google Apps Script source here.
   Uses the tested Apps Script postMessage bridge to avoid CORS/redirect issues. */
export const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbz0S3rzrRqrUnAaX8aCnMZQ5UUHDQNk5K0WBoie0086lb2SzuDcL8ZtipPXieXTIwrIMA/exec';
const BRIDGE_APP = 'SAVANSKI_BRIDGE_V1';
const RPC_ACTIONS = new Set(['health','getCatalog','register','getProfile','saveProfile']);
let frame, hostOrigin, readyPromise, nextId = 1;
const pending = new Map();

function isGoogleBridgeOrigin(origin) {
  try {
    const u = new URL(origin);
    return u.protocol === 'https:' && (u.hostname === 'script.google.com' ||
      u.hostname === 'script.googleusercontent.com' ||
      u.hostname.endsWith('.script.googleusercontent.com') ||
      u.hostname.endsWith('-script.googleusercontent.com'));
  } catch { return false; }
}

function onBridgeMessage(event) {
  if (event.source !== frame?.contentWindow || !isGoogleBridgeOrigin(event.origin)) return;
  const msg = event.data;
  if (!msg || msg.app !== BRIDGE_APP) return;
  if (msg.kind === 'ready' && !hostOrigin) {
    hostOrigin = event.origin;
    if (frame._ready) frame._ready();
    return;
  }
  if (msg.kind !== 'response' || event.origin !== hostOrigin || !Number.isSafeInteger(msg.id)) return;
  const reply = pending.get(msg.id);
  if (!reply) return;
  pending.delete(msg.id);
  clearTimeout(reply.timeout);
  reply.resolve(msg.result);
}

function ensureBridge() {
  if (readyPromise) return readyPromise;
  readyPromise = new Promise((resolve,reject) => {
    const timeout = setTimeout(() => {
      readyPromise = null;
      window.removeEventListener('message',onBridgeMessage);
      frame?.remove();
      hostOrigin = null;
      reject(new Error('Cloud bridge did not respond. Use the GitHub Pages HTTPS address or localhost:8000.'));
    },25000);
    frame = document.createElement('iframe');
    frame.src = `${BACKEND_URL}?bridge=1`;
    frame.title = 'Savanski optional cloud preferences bridge';
    frame.setAttribute('aria-hidden','true');
    frame.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;border:0;left:-10px;bottom:0;';
    frame._ready = () => {clearTimeout(timeout);resolve();};
    window.addEventListener('message',onBridgeMessage);
    document.body.append(frame);
  });
  return readyPromise;
}

export async function cloudAction(action, options = {}) {
  if (!RPC_ACTIONS.has(action)) throw Error('Unsupported cloud action');
  await ensureBridge();
  const id = nextId++;
  return new Promise((resolve,reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error('Cloud request timed out. Check the connection and try again.'));
    },30000);
    pending.set(id,{resolve,reject,timeout});
    frame.contentWindow.postMessage({
      app:BRIDGE_APP,kind:'request',id,action,
      payload:options.payload || {},
      profileId:options.profileId || '',
      accessKey:options.accessKey || ''
    },hostOrigin);
  });
}

import { cloudAction } from './backend-client.mjs';

// Credentials belong to the installation, never to the GitHub repository.
const DEVICE_STORAGE_KEY = 'savanski-v1-private-cloud-identity';
const $ = id => document.getElementById(id);
let busy = false;

function readIdentity() {
  try {
    const data = JSON.parse(localStorage.getItem(DEVICE_STORAGE_KEY) || 'null');
    if (data && typeof data.profileId === 'string' && typeof data.accessKey === 'string') return data;
  } catch { /* Storage unavailable or malformed: start unregistered. */ }
  return null;
}

function saveIdentity(credentials) {
  try { localStorage.setItem(DEVICE_STORAGE_KEY,JSON.stringify(credentials)); }
  catch { throw Error('Local storage is disabled. The new profile cannot be recovered on reload.'); }
}

let identity = readIdentity();
function status(message) { $('cloudStatus').textContent = message; }
function renderButtons() {
  $('cloudConnect').disabled = busy || !!identity;
  $('cloudLoad').disabled = busy || !identity;
  $('cloudSave').disabled = busy || !identity;
  $('cloudDisconnect').disabled = busy || !identity;
  $('cloudConnect').textContent = identity ? 'Profile saved on this device' : 'Create / connect profile';
}

async function guarded(callback) {
  if (busy) return;
  busy = true;
  renderButtons();
  try { await callback(); }
  catch(error) { status(`Cloud settings: ${error.message || 'request failed'}`); }
  finally { busy = false; renderButtons(); }
}

$('cloudConnect').addEventListener('click',() => guarded(async () => {
  if (identity) {status('This device already has a separate anonymous profile.');return;}
  status('Creating an anonymous profile…');
  const result = await cloudAction('register');
  if (!result?.ok || !result.profileId || !result.accessKey)
    throw Error(result?.error || 'Registration failed');
  saveIdentity({profileId:result.profileId,accessKey:result.accessKey});
  identity = readIdentity();
  status('Profile created. Use “Save keyboard settings” to back up your design. No pairing or account required.');
}));

$('cloudSave').addEventListener('click',() => guarded(async () => {
  if (!identity) return;
  status('Reading the current cloud revision…');
  const current = await cloudAction('getProfile',identity);
  if (!current?.ok) throw Error(current?.error || 'Could not retrieve profile');
  const profile = window.SavanskiUI.syncIntoProfile(current.profile);
  const result = await cloudAction('saveProfile',{
    ...identity,payload:{expectedRevision:current.revision,profile}
  });
  if (!result?.ok) throw Error(result?.error || 'Could not save settings');
  status('Keyboard appearance and layout settings saved to your private profile. No typed text was uploaded.');
}));

$('cloudLoad').addEventListener('click',() => guarded(async () => {
  if (!identity) return;
  status('Loading your saved settings…');
  const current = await cloudAction('getProfile',identity);
  if (!current?.ok) throw Error(current?.error || 'Could not retrieve profile');
  window.SavanskiUI.applySyncedProfile(current.profile);
  status('Cloud keyboard appearance and layout settings applied.');
}));

$('cloudDisconnect').addEventListener('click',() => {
  if (!identity) return;
  if (!window.confirm('Forget this device’s profile access? Without the saved access key you cannot reopen that anonymous cloud profile from this browser. The remote data will not be deleted.'))return;
  localStorage.removeItem(DEVICE_STORAGE_KEY);
  identity=null;
  renderButtons();
  status('This device has been disconnected; local keyboard settings remain unchanged.');
});

renderButtons();
if (identity) status('An anonymous profile is configured for this device. Load or save settings when you choose.');

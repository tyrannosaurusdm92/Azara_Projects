/* Explicit install UI. Installation of this PWA does not register an OS IME. */
const button = document.getElementById('downloadApp');
const overlay = document.getElementById('installOverlay');
const instructions = document.getElementById('installInstructions');
let deferredPrompt = null;
let previouslyFocused = null;

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredPrompt = event;
  if (button) button.textContent = '⬇ Download App';
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  if (button) button.textContent = '✓ App Installed';
});

function isInstalled() {
  return window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
}

function showInstructions(message) {
  previouslyFocused = document.activeElement;
  instructions.textContent = message;
  overlay.hidden = false;
  document.getElementById('closeInstall').focus();
}

function fallbackInstructions() {
  if (isInstalled()) return 'Savanski is already running as an installed web app. Open it from your home screen or desktop app list.';
  const agent = navigator.userAgent;
  if (/iPad|iPhone|iPod/i.test(agent) || (/Macintosh/i.test(agent) && navigator.maxTouchPoints > 1)) {
    return 'On iPhone or iPad: open this HTTPS page in Safari, tap Share, then Add to Home Screen, and confirm Add. The standalone web app will then be available on your Home Screen.';
  }
  if (/Android/i.test(agent)) {
    return 'On Android: use Chrome or another install-capable browser, open its menu (⋮), then choose Install app or Add to Home Screen. If offered, confirm Install.';
  }
  if (/Windows|Macintosh|Linux/i.test(agent)) {
    return 'On desktop: open this HTTPS page in Chrome or Edge and choose Install Savanski Keyboard from the address bar or browser menu (Install page as app). Safari on macOS may offer File → Add to Dock. Some browsers do not provide PWA installation.';
  }
  return 'Use your browser menu and choose Install app or Add to Home Screen, if available. Installation generally requires HTTPS.';
}

button?.addEventListener('click', async () => {
  if (deferredPrompt && !isInstalled()) {
    const prompt = deferredPrompt;
    deferredPrompt = null;
    try {
      await prompt.prompt();
      const result = await prompt.userChoice;
      if (result.outcome !== 'accepted') showInstructions(fallbackInstructions());
    } catch { showInstructions(fallbackInstructions()); }
  } else showInstructions(fallbackInstructions());
});
document.getElementById('installKeyboard')?.addEventListener('click', () => button?.click());
document.getElementById('closeInstall')?.addEventListener('click', () => {
  overlay.hidden = true;
  previouslyFocused?.focus?.();
});
overlay?.addEventListener('click', event => {
  if (event.target === overlay) document.getElementById('closeInstall').click();
});
document.addEventListener('keydown', event => {
  if (!overlay.hidden && event.key === 'Escape') document.getElementById('closeInstall').click();
});

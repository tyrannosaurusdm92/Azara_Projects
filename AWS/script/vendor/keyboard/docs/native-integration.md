# Floating keyboard host bridge (Windows first)

The Windows desktop source ZIP includes a .NET 8 Windows Forms floating window,
WebView2 local-resource mapping, tray controls and native input output bridge.
The shared `script/native-bridge.mjs` detects the WebView2 messaging API and exposes:

```javascript
SavanskiNativeBridge.commitText(text, modifiers);
SavanskiNativeBridge.performKey(symbol, modifiers);
SavanskiNativeBridge.deleteBackward(modifiers);
SavanskiNativeBridge.screenshot();
SavanskiNativeBridge.show();
SavanskiNativeBridge.hide();
SavanskiNativeBridge.pin(true);
SavanskiNativeBridge.resize(940, 410);
SavanskiNativeBridge.moveDelta(10, -5);
SavanskiNativeBridge.pause(true);
SavanskiNativeBridge.exit();
```

The native web view maps `https://savanski.local/` to a **local folder** next to
the compiled program. The bridge transmits user-tapped character strings to the
local host process, not to an internet server. The host uses `SendInput` with
paired keydown/keyup events and `KEYEVENTF_UNICODE` for Unicode (including
UTF-16 surrogate-pair code units). `WS_EX_NOACTIVATE` and `MA_NOACTIVATE`
request focus preservation. Windows UIPI can block sending into an elevated
application. No privilege escalation or global keyboard hook is provided.

User-initiated Print Screen captures locally into Pictures/Savanski Screenshots.
An app running without native privileges cannot perform unrestricted screenshots.

The host source/CI workflow has **not been compiled or tested on Windows** here;
see its README for build instructions and unverified behavior.

macOS and Linux floating hosts are not included in this release. If developed
later, macOS accessibility authorization and X11/Wayland-specific restrictions
must be respected. Android and iOS native default keyboard integrations are
deliberately outside this floating keyboard scope.

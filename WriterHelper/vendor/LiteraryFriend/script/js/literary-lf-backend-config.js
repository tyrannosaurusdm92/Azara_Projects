(function (global) {
  'use strict';
  const LF = global.LiteraryFriend = global.LiteraryFriend || {};
  LF.backend = Object.freeze({
    endpoint: 'https://script.google.com/macros/s/AKfycbyvpUn2_fADmOAOMqh1pHatTlegwZKYloWRPSSrM1kBkSwP2l5LzADQ7jKMr7TCJJP2/exec',
    library: 'https://script.google.com/macros/library/d/1uq9wTJuIWNphZvGN_QGR3CGlBSWIRMhdD2i-PwcmHCJWTLOVoGKa_PyC/2',
    apiVersion: '2026-08-09-v1',
    maxUploadBytes: 20 * 1024 * 1024,
    maxBatchFiles: 24,
    requestTimeoutMs: 120000,
    healthTimeoutMs: 20000,
    tokenStorageKey: 'literaryfriend.session.token.v2',
    activeProjectKey: 'literaryfriend.active.project.v2',
    localStoreName: 'literaryfriend.local.v2',
    clientConfigPath: '?action=client.config',
    healthPath: '?action=health'
  });
})(window);

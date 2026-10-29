import {backend} from './backend-client.js'; import {SessionVault} from './literary-core-session-vault.js'; import {store} from '../core/state-store.js';
function acceptCredential(result){if(result?.token)SessionVault.set(result.token);if(result?.user)store.set({user:result.user},'auth');return result;}
export const AuthService={
 async register(data){return acceptCredential(await backend.call('auth.register',data,{token:''}));},
 async login(data){return acceptCredential(await backend.call('auth.login',data,{token:''}));},
 async google(idToken,extra={}){return acceptCredential(await backend.call('auth.google',{idToken,...extra},{token:''}));},
 async verify2fa(challengeId,code){return acceptCredential(await backend.call('auth.2fa.verify',{challengeId,code},{token:''}));},
 resend2fa(challengeId){return backend.call('auth.2fa.resend',{challengeId},{token:''});},
 requestReset(login){return backend.call('auth.password.reset.request',{login},{token:''});},
 async completeReset(data){return acceptCredential(await backend.call('auth.password.reset.complete',data,{token:''}));},
 async recoveryCodeLogin(data){return acceptCredential(await backend.call('auth.recovery.code.login',data,{token:''}));},
 async me(){const r=await backend.call('auth.me');store.set({user:r.user},'auth');return r;},
 async logout(){try{if(SessionVault.has())await backend.call('auth.logout');}finally{SessionVault.clear();store.reset();}},
 sessions(){return backend.call('auth.sessions.list');}, revokeSession(sessionId){return backend.call('auth.sessions.revoke',{sessionId});}, revokeOthers(){return backend.call('auth.sessions.revoke.others');},
 recoveryContacts(){return backend.call('auth.recovery.contacts.list');}, addRecoveryContact(data){return backend.call('auth.recovery.contacts.add',data);}, removeRecoveryContact(contactId){return backend.call('auth.recovery.contacts.remove',{contactId});}, sendRecoveryContactCode(contactId){return backend.call('auth.recovery.contacts.sendcode',{contactId});}, verifyRecoveryContact(data){return backend.call('auth.contact.code.verify',data,{token:''});},
 generateRecoveryCodes(){return backend.call('auth.recovery.codes.generate');}, twoFactorStatus(){return backend.call('auth.2fa.status');}, enableTwoFactor(data){return backend.call('auth.2fa.enable',data);}, disableTwoFactor(data){return backend.call('auth.2fa.disable',data);},
 changePassword(data){return backend.call('auth.password.change',data);}, linkGoogle(idToken){return backend.call('auth.google.link',{idToken});},
 driveLinkStart(data={}){return backend.call('drive.link.start',data);}, driveLinkStatus(){return backend.call('drive.link.status');}, driveLinkSetRoot(rootFolderId){return backend.call('drive.link.setroot',{rootFolderId});}, driveLinkRevoke(){return backend.call('drive.link.revoke',{});}
};

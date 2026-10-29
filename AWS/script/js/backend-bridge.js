/* Public endpoint and AWS_RPC iframe adapter. Backend source and secrets stay server-side. */
(()=>{'use strict';
 const ENDPOINT='https://script.google.com/macros/s/AKfycbyvpUn2_fADmOAOMqh1pHatTlegwZKYloWRPSSrM1kBkSwP2l5LzADQ7jKMr7TCJJP2/exec';
 const $=id=>document.getElementById(id),set=text=>{const s=$('bridge-status');if(s)s.textContent=text};
 const authKey='writerhelper-aws-session-v1',mapKey='literaryfriend-bridge-note-map-v1';
 let frame=null,remoteOrigin='',isReady=false,token='',pending=new Map(),counter=0,challenge='',sessionUser='';
 try{token=sessionStorage.getItem(authKey)||''}catch{}
 const noteMap=()=>{try{return JSON.parse(localStorage.getItem(mapKey)||'{}')}catch{return {}}};
 const saveMap=m=>{try{localStorage.setItem(mapKey,JSON.stringify(m))}catch{}};
 function connect(){if(frame)return;frame=document.createElement('iframe');frame.src=ENDPOINT+'?action=bridge';frame.title='Aza’raan Writing Studio account connection';frame.hidden=true;frame.referrerPolicy='strict-origin-when-cross-origin';frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms');document.body.append(frame)}
 function incoming(event){if(event.source!==frame?.contentWindow)return;let host;try{host=new URL(event.origin).hostname}catch{return}
   if(!(host==='script.google.com'||host==='script.googleusercontent.com'||host.endsWith('.googleusercontent.com')))return;
   const data=event.data||{};
   if(data.type==='AWS_RPC_READY'){remoteOrigin=event.origin;isReady=true;set(token?'Connected bridge; validating session…':'Account bridge ready. Sign in to sync.');return}
   if(data.type!=='AWS_RPC_RESPONSE')return;const p=pending.get(data.id);if(!p)return;pending.delete(data.id);clearTimeout(p.t);
   const res=data.result||{ok:false,error:{message:'No response from server.'}};
   if(res.ok===false)p.reject(Error(res.error?.message||res.message||'Backend refused the request.'));
   else{if(['auth.login','auth.2fa.verify'].includes(p.action)&&res.token)signedIn(res);p.resolve(res)}
 }
 window.addEventListener('message',incoming);
 async function ready(timeout=13000){connect();if(isReady)return;await new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{if(isReady){clearInterval(timer);resolve()}else if(Date.now()-start>timeout){clearInterval(timer);reject(Error('Connection unavailable. The existing backend may not be deployed or may not authorize this website origin.'))}},100)})}
 async function request(action,data={}){
   if(action==='auth.login')data={...data,login:data.login||data.email||data.username||''};
   await ready();return new Promise((resolve,reject)=>{
   const id='wh_'+Date.now().toString(36)+'_'+(++counter);const t=setTimeout(()=>{pending.delete(id);reject(Error('Account request timed out.'))},60000);pending.set(id,{resolve,reject,t,action});frame.contentWindow.postMessage({type:'AWS_RPC_REQUEST',id,payload:{action,data,token,client:'writerhelper-web',version:'2026-10-27'}},remoteOrigin)
 })}
 window.WriterHelperBridge=Object.freeze({request,get signedIn(){return !!token},get user(){return sessionUser}});
 async function login(){const l=$('bridge-login')?.value.trim(),p=$('bridge-password')?.value;if(!l||!p){set('Enter your email/username and password.');return}try{set('Signing in securely…');const r=await request('auth.login',{login:l,password:p,platform:navigator.platform||'browser',deviceName:'Aza’raan Writing Studio web'});$('bridge-password').value='';if(r.twoFactorRequired){challenge=r.challengeToken||r.challenge?.challengeToken||'';set('Enter the two-factor code to finish sign-in.');return}signedIn(r)}catch(err){set(err.message)}}
 function signedIn(r){if(!r.token){set('Backend did not return a session token.');return}token=r.token;sessionUser=r.user?.username||r.user?.primaryEmail||'';try{sessionStorage.setItem(authKey,token)}catch{}set('Connected'+(sessionUser?' as '+sessionUser:'')+'. Cloud sync is available.');}
 async function verify(){if(!challenge){set('Sign in first to request a two-factor code.');return}const code=$('bridge-2fa')?.value.trim();if(!code){set('Enter the verification code.');return}try{const r=await request('auth.2fa.verify',{challengeToken:challenge,code});challenge='';$('bridge-2fa').value='';signedIn(r)}catch(e){set(e.message)}}
 async function logout(){try{if(token)await request('auth.logout',{})}catch{}token='';challenge='';sessionUser='';try{sessionStorage.removeItem(authKey)}catch{}set('Disconnected. Your browser documents remain saved locally.')}
 function serializeChunks(snapshot){const value=JSON.stringify(snapshot);const max=95000;const chunks=[];for(let i=0;i<value.length;i+=max)chunks.push(value.slice(i,i+max));return chunks}
 async function push(){if(!token){set('Sign in before cloud sync.');return}const app=window.LiteraryFriendApp;if(!app){set('Writing library has not loaded.');return}
   if(!confirm('Upload your local writing library as a new cloud snapshot? This does not delete previous cloud versions.'))return;
   try{const snapshot=app.getSnapshot(),parts=serializeChunks(snapshot),id='lf_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),map=noteMap();
     if(parts.length>150)throw Error('Your library is too large for a single upload. Export a local backup and split projects into smaller snapshots.');
     set(`Uploading 0 / ${parts.length} parts…`);
     for(let i=0;i<parts.length;i++){
       const r=await request('notes.save',{title:`LF-SNAPSHOT ${id} ${i+1}/${parts.length}`,content:parts[i],format:'json',source:'literary-friend-shell',metadata:{snapshotId:id,index:i,total:parts.length,createdAt:new Date().toISOString(),type:'luxury-shell-state'}});
       map[`${id}:${i}`]=r.note?.id||'';set(`Uploading ${i+1} / ${parts.length} parts…`);
     }
     saveMap(map);set(`Synced ${parts.length} part(s) successfully. Cloud restore can find this snapshot from another device.`)
   }catch(err){set('Upload failed: '+err.message+' Local documents were not changed.')}
 }
 async function pull(){if(!token){set('Sign in before restoring from cloud.');return}try{set('Finding saved cloud snapshots…');
   const list=await request('notes.list',{});const notes=(list.notes||[]).filter(n=>n.source==='literary-friend-shell'&&n.metadata?.type==='luxury-shell-state');
   const groups=new Map();for(const note of notes){const m=note.metadata;const g=groups.get(m.snapshotId)||[];g.push(note);groups.set(m.snapshotId,g)}
   const complete=[...groups.entries()].filter(([id,notes])=>{const total=notes[0]?.metadata?.total;return Number.isInteger(total)&&total>0&&notes.length===total&&new Set(notes.map(n=>n.metadata.index)).size===total}).sort((a,b)=>b[0].localeCompare(a[0]));
   if(!complete.length){set('No complete Literary Friend snapshot was found for this account.');return}
   const [id,records]=complete[0];if(!confirm(`Restore the latest complete cloud snapshot (${records.length} part(s))? This will replace the current local library. Export a local backup first if you need to keep both.`)){set('Restore cancelled.');return}
   records.sort((a,b)=>a.metadata.index-b.metadata.index);let json='';for(let i=0;i<records.length;i++){const r=await request('notes.get',{id:records[i].id});json+=r.note?.content||'';set(`Restoring ${i+1} / ${records.length} parts…`)}
   const snapshot=JSON.parse(json);await window.LiteraryFriendApp.replaceSnapshot(snapshot);set('Cloud snapshot restored and saved locally.')
   }catch(err){set('Restore failed: '+err.message+' Existing local work was left unchanged unless a restore completed.')}
 }
 window.addEventListener('literaryfriend:ready',()=>{if(token)request('auth.me',{}).then(r=>{sessionUser=r.user?.username||'';set('Connected'+(sessionUser?' as '+sessionUser:'')+'.')}).catch(()=>{token='';sessionStorage.removeItem(authKey);set('Local-only. Sign in to connect.')})});
 $('bridge-connect')?.addEventListener('click',login);$('bridge-verify')?.addEventListener('click',verify);$('bridge-push')?.addEventListener('click',push);$('bridge-pull')?.addEventListener('click',pull);$('bridge-signout')?.addEventListener('click',logout);
 window.LiteraryFriendCloud={request,login,push,pull,logout,get connected(){return!!token},endpoint:ENDPOINT};
})();

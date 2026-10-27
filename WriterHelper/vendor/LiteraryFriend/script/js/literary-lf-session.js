(function(global){
'use strict';
const LF=global.LiteraryFriend;
const KEY='literaryfriend.access.mode.v2';
const USER_KEY='literaryfriend.guest.user.v2';
const S={
  mode(){return localStorage.getItem(KEY)||'';},
  isGuest(){return this.mode()==='guest';},
  isAccount(){return this.mode()==='account';},
  enterGuest(profile={}){
    const user={id:'guest-local',username:'guest',displayName:profile.displayName||'Guest Writer',guest:true,localOnly:true};
    localStorage.setItem(KEY,'guest');localStorage.setItem(USER_KEY,JSON.stringify(user));
    sessionStorage.removeItem(LF.backend.tokenStorageKey);LF.services.api?.clearToken?.();
    LF.state.accessMode='guest';LF.events.emit('guest:entered',{user});return user;
  },
  markAccount(){localStorage.setItem(KEY,'account');localStorage.removeItem(USER_KEY);LF.state.accessMode='account';},
  guestUser(){try{return JSON.parse(localStorage.getItem(USER_KEY)||'null')||{id:'guest-local',username:'guest',displayName:'Guest Writer',guest:true,localOnly:true};}catch(_){return{id:'guest-local',username:'guest',displayName:'Guest Writer',guest:true,localOnly:true};}},
  clear(){localStorage.removeItem(KEY);localStorage.removeItem(USER_KEY);localStorage.removeItem(LF.backend.activeProjectKey);LF.state.accessMode='';}
};
LF.services.session=S;LF.register('session',S);
})(window);
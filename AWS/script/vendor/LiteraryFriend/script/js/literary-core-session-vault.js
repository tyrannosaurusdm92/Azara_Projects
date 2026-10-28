const KEY='literaryfriend.session.token';
export const SessionVault={
  get(){ return sessionStorage.getItem(KEY)||''; }, set(token){ token?sessionStorage.setItem(KEY,token):sessionStorage.removeItem(KEY); }, clear(){sessionStorage.removeItem(KEY);},
  has(){return Boolean(this.get());}
};

const KEY='literaryfriend.v1.guest';
export const GuestSession={
  active(){return localStorage.getItem(KEY)==='1';},
  enter(){localStorage.setItem(KEY,'1');sessionStorage.setItem(KEY,'1');},
  exit(){localStorage.removeItem(KEY);sessionStorage.removeItem(KEY);},
  label(){return this.active()?'Guest':'Account';}
};

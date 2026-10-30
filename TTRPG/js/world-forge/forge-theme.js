/* Theme runs after the attached Forge UI injects its original styles. */
(()=>{const css=`#belavados-worldforge-root{--bg:#07090a;--panel:#111720;--panel2:#17232c;--line:#35595a;--text:#f3e9db;--muted:#d4c6b6;--cyan:#8de0dc;--gold:#d7aa63;color:#f3e9db;background:radial-gradient(ellipse at top,#1a2932,#07090a 60%);font-family:Georgia,"Times New Roman",serif}
#belavados-worldforge-root .panel{background:#111720;border-color:rgba(141,224,220,.28)}
#belavados-worldforge-root input,#belavados-worldforge-root textarea,#belavados-worldforge-root select{background:#0c1017;color:#f3e9db;border-color:#35595a}
#belavados-worldforge-root button{border-color:#3d9fa0}#belavados-worldforge-root button:focus-visible{outline:2px solid #8de0dc;outline-offset:2px}
#belavados-worldforge-root :is(a,.muted){color:#d4c6b6}`;
const sheet=document.createElement('style');sheet.id='belavados-belavados-override';sheet.textContent=css;document.head.append(sheet);})();

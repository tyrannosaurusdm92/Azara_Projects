/* Helper compatibility layer. No AI generation and no AI backend routes are exposed. */
window.LiteraryFriendHelper=Object.freeze({
  name:'Helper',generative:false,providersEnabled:false,
  explain(){return 'Helper scans and organizes your writing locally. It never generates prose or contacts an AI service.'},
  audit(text){const writer=window.LF?.writer;return writer?.analyze?writer.analyze(text):null},
  continuity(docs){return window.LF?.writer?.continuityScan?.({documents:docs})||[]},
  async loadSpecializedChecks(){
    if(window.WriterToolsOutputValidator)return window.WriterToolsOutputValidator;
    const script=document.createElement('script');script.src='script/js/helper-core.js';
    await new Promise((ok,fail)=>{script.onload=ok;script.onerror=()=>fail(Error('Additional checks unavailable'));document.head.append(script)});
    return window.WriterToolsOutputValidator||null;
  },
  async generate(){throw Error('Text generation is disabled in Literary Friend.')},
  async provider(){throw Error('AI provider connections are not part of Literary Friend.')}
});

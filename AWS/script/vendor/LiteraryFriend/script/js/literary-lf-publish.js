(function (global) {
  'use strict';
  const LF=global.LiteraryFriend, U=LF.util, api=LF.services.api, projects=LF.services.projects;
  const publish={
    async project(options={}){return api.request('export.project',{projectId:projects.require(),portable:true,...options},{timeoutMs:300000});},
    async user(options={}){return api.request('export.user',{portable:true,...options},{timeoutMs:300000});},
    async backup(options={}){return api.request('backup.create',{projectId:options.projectId||projects.id?.()||'',...options},{timeoutMs:300000});},
    async htmlBook(bookId,editionId,options={}){return LF.get('books').exportHTML(bookId,editionId,{jsonPerChapter:true,accessible:true,...options});},
    downloadResult(result,fallback='literaryfriend-export.json'){
      if(result?.downloadUrl){global.open(result.downloadUrl,'_blank','noopener');return;}
      const name=U.safeFilename(result?.fileName||fallback), body=result?.content??result?.data??result;
      U.download(name,typeof body==='string'?body:JSON.stringify(body,null,2),name.endsWith('.html')?'text/html':'application/json');
    },
    interactiveMetadata(project,chapters,options={}){return {schema:'literaryfriend-interactive-book/v1',title:project.title||project.name||'',author:options.author||'',cover:options.cover||'',chapterOrder:(chapters||[]).map(c=>c.id),pageTheme:options.pageTheme||{},pageTurn:{enabled:options.pageTurn!==false,sound:Boolean(options.sound)},accessibility:{textSizing:true,contrastModes:true,reducedMotion:true,soundToggle:true,keyboardNavigation:true,readAloudState:true},generatedAt:U.now()};}
  };
  LF.register('publish',publish);
})(window);

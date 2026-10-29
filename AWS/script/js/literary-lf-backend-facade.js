(function(global){
'use strict';
const LF=global.LiteraryFriend,api=LF.services.api,projects=LF.services.projects;
const scoped=data=>({projectId:data?.projectId||projects.id()||'',...(data||{})});
const call=(action,data={},options={})=>api.request(action,data,options);
const facade={
  call,
  attachments:{
    list:async(filters={})=>(await call('attachments.list',scoped(filters))).attachments||[],
    upload:(data,options={})=>call('attachments.upload',scoped(data),{timeoutMs:180000,...options}),
    delete:id=>call('attachments.delete',scoped({id,attachmentId:id}))
  },
  revisions:{
    list:async(filters={})=>(await call('revisions.list',scoped(filters))).revisions||[],
    get:id=>call('revisions.get',{id,revisionId:id})
  },
  trash:{list:async(filters={})=>(await call('trash.list',scoped(filters))).items||[]},
  profile:{get:()=>call('profile.get',{}),update:patch=>call('profile.update',patch)},
  projects:{get:id=>call('projects.get',{projectId:id}),workspace:id=>call('projects.workspace',{projectId:id||projects.require()})},
  imports:{register:data=>call('imports.register',scoped(data)),list:async(filters={})=>(await call('imports.list',scoped(filters))).imports||[]},
  files:{indexList:async(filters={})=>(await call('files.index.list',scoped(filters))).files||[],indexGet:id=>call('files.index.get',scoped({id,fileId:id}))},
  bulk:{apply:(operations,options={})=>call('bulk.apply',scoped({operations,...options}),{timeoutMs:180000})},
  activity:{list:async(filters={})=>(await call('activity.list',scoped(filters))).activity||[]}
};
LF.services.backend=facade;LF.register('backendFacade',facade);
})(window);

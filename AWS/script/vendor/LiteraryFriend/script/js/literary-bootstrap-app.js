import {loadRuntime,loadBackendConfig} from './literary-core-config-loader.js';
import {configureBackend} from './services/backend-client.js';
import {store} from './core/state-store.js';
import {installPasswordToggles,installDialogClose} from './literary-core-a11y.js';
import {installKeyboardShortcuts} from './core/keyboard.js';
import {installNotifications} from './literary-core-notifications.js';
import {installCommandPalette} from './literary-core-command-palette.js';
import {installAppShellController} from './controllers/app-shell-controller.js';
import {installSearchController} from './literary-controllers-search-controller.js';
import {startApp} from './modular-app.js';
async function bootstrap(){
 const runtime=await loadRuntime(),config=await loadBackendConfig(runtime.backendConfigPath);store.set({runtime},'bootstrap');
 configureBackend(config,{guestRouting:true});
 installPasswordToggles();installDialogClose();installKeyboardShortcuts();installNotifications();installAppShellController();installSearchController();
 await installCommandPalette();await startApp();
}
bootstrap().catch(error=>{console.error(error);const status=document.querySelector('#app-status');if(status)status.textContent=`LiteraryFriend could not start: ${error.message}`;});

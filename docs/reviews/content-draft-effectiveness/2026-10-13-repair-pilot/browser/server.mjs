import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
const app='/home/ubuntu/.codex/worktrees/b4c3/pixel-perfect-view-757';
const root='/home/ubuntu/.codex/worktrees/b4c3/pixel-perfect-view-757/output/playwright/content-repair-pilot';
const server=await createServer({root,cacheDir:root+'/.vite-pilot',configFile:false,envDir:false,plugins:[react(),tailwind()],resolve:{alias:[{find:/^@tanstack\/react-start$/,replacement:root+'/stubs.ts'},{find:/^@\/lib\/pattern\.functions$/,replacement:root+'/stubs.ts'},{find:/^@\//,replacement:app+'/src/'}]},server:{host:'127.0.0.1',port:5212,strictPort:true,hmr:false,fs:{allow:[root,app]}}});
await server.listen();
console.log('Mocked content-pilot fixture at http://127.0.0.1:5212');

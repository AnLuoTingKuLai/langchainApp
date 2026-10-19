import fs from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';

const DYNAMIC_PROVIDER_IMPORT = 'return (await import(config.package))[config.className];';

// 只保留本项目安装的供应商。字面量 import() 才能被 Vite 预构建，并修好 CJS 默认导出。
const STATIC_PROVIDER_IMPORT = `if (config.package === '@langchain/google-genai') {
  return (await import('@langchain/google-genai'))[config.className];
}
throw new Error('未安装模型包: ' + config.package);`;

/**
 * initChatModel 用 import(变量) 加载供应商包。
 * 浏览器遇到裸包名会报 Failed to resolve module specifier。
 */
function langchainProviderImport (): Plugin {
  return {
    name: 'langchain-provider-import',
    enforce: 'pre',
    transform (code, id) {
      if (!id.includes('langchain/dist/chat_models/universal.js')) return null;
      if (!code.includes(DYNAMIC_PROVIDER_IMPORT)) return null;
      return code.replace(DYNAMIC_PROVIDER_IMPORT, STATIC_PROVIDER_IMPORT);
    }
  };
}

function langchainProviderEsbuildPlugin () {
  return {
    name: 'langchain-provider-import',
    setup (build: { onLoad: Function }) {
      build.onLoad({ filter: /langchain\/dist\/chat_models\/universal\.js$/ }, async (args: { path: string }) => {
        const source = await fs.readFile(args.path, 'utf8');
        return {
          contents: source.replace(DYNAMIC_PROVIDER_IMPORT, STATIC_PROVIDER_IMPORT),
          loader: 'js'
        };
      });
    }
  };
}

export default defineConfig({
  plugins: [vue(), langchainProviderImport()],
  optimizeDeps: {
    include: ['langchain/chat_models/universal', '@langchain/google-genai'],
    esbuildOptions: {
      plugins: [langchainProviderEsbuildPlugin()]
    }
  },
  // initChatModel 是异步的，main.ts 用了顶层 await；默认构建目标不含该语法
  build: {
    target: 'es2022'
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true
      }
    }
  },
  server: {
    port: 5173
  }
});

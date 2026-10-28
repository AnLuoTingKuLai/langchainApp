import fs from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';

const DYNAMIC_PROVIDER_IMPORT = 'return (await import(config.package))[config.className];';

// 只保留本项目安装的供应商。字面量 import() 才能被 Vite 预构建，并修好 CJS 默认导出。
const STATIC_PROVIDER_IMPORT = `if (config.package === '@langchain/deepseek') {
  return (await import('@langchain/deepseek'))[config.className];
}
if (config.package === '@langchain/google-genai') {
  return (await import('@langchain/google-genai'))[config.className];
}
throw new Error('未安装模型包: ' + config.package);`;

const NODE_ASYNC_HOOKS_SHIM = fileURLToPath(
  new URL('./src/shims/nodeAsyncHooks.ts', import.meta.url)
);

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

/**
 * 强制把 node:async_hooks 指到浏览器 shim。
 * 仅靠 resolve.alias 时，optimizeDeps 预构建偶发仍落到空 stub。
 */
function nodeAsyncHooksShim (): Plugin {
  return {
    name: 'node-async-hooks-shim',
    enforce: 'pre',
    resolveId (id) {
      if (id === 'node:async_hooks' || id === 'async_hooks') {
        return NODE_ASYNC_HOOKS_SHIM;
      }

      return null;
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
  plugins: [vue(), nodeAsyncHooksShim(), langchainProviderImport()],
  // 部分 langchain CJS 在浏览器里会读 process.env；浏览器无 Node process
  define: {
    'process.env': JSON.stringify({})
  },
  optimizeDeps: {
    include: [
      'langchain/chat_models/universal',
      '@langchain/deepseek',
      '@langchain/google-genai',
      // 浏览器必须用 /web，避免拉取 Node async_hooks
      '@langchain/langgraph/web',
      'langchain'
    ],
    esbuildOptions: {
      // 预构建阶段同样替换 async_hooks，避免 AsyncLocalStorage is not a constructor
      alias: {
        'node:async_hooks': NODE_ASYNC_HOOKS_SHIM,
        async_hooks: NODE_ASYNC_HOOKS_SHIM
      },
      plugins: [langchainProviderEsbuildPlugin()]
    }
  },
  // initChatModel 是异步的，main.ts 用了顶层 await；默认构建目标不含该语法
  build: {
    target: 'es2022'
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // langsmith/traceable 等会 new AsyncLocalStorage；浏览器无真正的 async_hooks
      'node:async_hooks': NODE_ASYNC_HOOKS_SHIM,
      async_hooks: NODE_ASYNC_HOOKS_SHIM
    },
    // 优先 langchain 的 browser 条件导出，避开 Node 侧实现
    conditions: ['browser', 'module', 'import', 'default']
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


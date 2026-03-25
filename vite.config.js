import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const gasUrl = env.VITE_API_URL || ''
  // Extract just the script path for the proxy target
  // e.g. https://script.google.com/macros/s/SCRIPT_ID/exec
  // → target: https://script.google.com, rewrite: /gas-proxy → /macros/s/SCRIPT_ID/exec
  let gasTarget = 'https://script.google.com'
  let gasRewritePath = ''
  if (gasUrl) {
    try {
      const u = new URL(gasUrl)
      gasTarget = u.origin
      gasRewritePath = u.pathname
    } catch {}
  }

  return {
    plugins: [vue()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        // DEV proxy: /gas-proxy/* → https://script.google.com/macros/s/.../exec/*
        // This strips CORS because the request comes from Node (server-side), not browser
        '/gas-proxy': {
          target: gasTarget,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/gas-proxy/, gasRewritePath || '/gas-proxy'),
          configure: (proxy) => {
            proxy.on('error', (err) => console.error('[proxy error]', err.message))
          },
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  }
})

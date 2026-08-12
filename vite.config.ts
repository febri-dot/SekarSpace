import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// Custom Vite plugin to physically write JSON database files on disk
function jsonDbPlugin() {
  return {
    name: 'json-db-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/save-json', (req: any, res: any, next: any) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk: any) => {
            body += chunk.toString()
          })
          req.on('end', () => {
            try {
              const { filename, data } = JSON.parse(body)
              if (!['users', 'rooms', 'complaints', 'payments'].includes(filename)) {
                res.statusCode = 400
                res.end(JSON.stringify({ success: false, error: 'Invalid filename' }))
                return
              }
              const targetDir = path.resolve(import.meta.dirname, 'src/data')
              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true })
              }
              const filePath = path.join(targetDir, `${filename}.json`)
              fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
              
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, message: `Successfully wrote to ${filename}.json` }))
            } catch (err: any) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: false, error: err.message }))
            }
          })
        } else {
          next()
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    jsonDbPlugin()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

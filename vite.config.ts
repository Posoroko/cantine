import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'

export default defineConfig({
    plugins: [
        vue()
    ],
    server: {
        host: 'dev.cantine.demande-a-tutu.com',
        port: 5173,
        https: {
            key: fs.readFileSync('.certs/dev.cantine.demande-a-tutu.com-key.pem'),
            cert: fs.readFileSync('.certs/dev.cantine.demande-a-tutu.com.pem')
        }
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    }
})

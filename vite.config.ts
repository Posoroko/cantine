import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'

const certKeyPath = '.certs/dev.cantine.demande-a-tutu.com-key.pem'
const certPath = '.certs/dev.cantine.demande-a-tutu.com.pem'
const hasCerts = fs.existsSync(certKeyPath) && fs.existsSync(certPath)

export default defineConfig({
    plugins: [
        vue()
    ],
    server: {
        host: 'dev.cantine.demande-a-tutu.com',
        port: 5173,
        ...(hasCerts && {
            https: {
                key: fs.readFileSync(certKeyPath),
                cert: fs.readFileSync(certPath)
            }
        })
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    }
})

// Servidor local para "Mi Sistema Personal".
// Sirve la carpeta /dist en http://localhost:4173 y abre el navegador.
// No necesita dependencias: usa solo módulos nativos de Node.
import http from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { exec } from 'node:child_process'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const DIST = resolve(__dirname, 'dist')
const PORT = 4173

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

async function send(res, filePath) {
  const data = await readFile(filePath)
  res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' })
  res.end(data)
}

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
    let filePath = join(DIST, urlPath)
    try {
      const s = await stat(filePath)
      if (s.isDirectory()) filePath = join(filePath, 'index.html')
      await send(res, filePath)
    } catch {
      // SPA fallback: cualquier ruta desconocida sirve index.html
      await send(res, join(DIST, 'index.html'))
    }
  } catch (e) {
    res.writeHead(500)
    res.end('Error: ' + e.message)
  }
})

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    // Ya está corriendo: solo abrimos el navegador.
    openBrowser()
    process.exit(0)
  } else {
    console.error(e)
  }
})

function openBrowser() {
  const url = `http://localhost:${PORT}/`
  const cmd =
    process.platform === 'win32' ? `start "" "${url}"` :
    process.platform === 'darwin' ? `open "${url}"` :
    `xdg-open "${url}"`
  exec(cmd)
}

server.listen(PORT, () => {
  console.log(`\n  Mi Sistema Personal está corriendo en http://localhost:${PORT}/`)
  console.log('  (Dejá esta ventana abierta mientras usás la app. Para cerrar: cerrá esta ventana.)\n')
  openBrowser()
})

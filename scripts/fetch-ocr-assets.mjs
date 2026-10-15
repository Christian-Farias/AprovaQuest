#!/usr/bin/env node
import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Readable } from 'node:stream'
import { finished } from 'node:stream/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PUBLIC_DIR = join(__dirname, '..', 'public', 'tesseract')

async function download(url, dest) {
  const res = await fetch(url)
  if (!res.ok || !res.body) {
    throw new Error(`Falha ao baixar ${url}: ${res.status} ${res.statusText}`)
  }
  await mkdir(dirname(dest), { recursive: true })
  const { createWriteStream } = await import('node:fs')
  const fileStream = createWriteStream(dest)
  await finished(Readable.fromWeb(res.body).pipe(fileStream))
}

async function main() {
  await mkdir(PUBLIC_DIR, { recursive: true })
  console.log('Baixando worker.min.js...')
  await download('https://cdn.jsdelivr.net/npm/tesseract.js@7/dist/worker.min.js', join(PUBLIC_DIR, 'worker.min.js'))
  console.log('Copiando tesseract-core.wasm.js do node_modules...')
  await copyFile(
    join(__dirname, '..', 'node_modules', 'tesseract.js-core', 'tesseract-core-lstm.wasm.js'),
    join(PUBLIC_DIR, 'tesseract-core.wasm.js'),
  )
  console.log('Baixando por.traineddata...')
  await download('https://github.com/tesseract-ocr/tessdata/raw/main/por.traineddata', join(PUBLIC_DIR, 'por.traineddata'))
  console.log('Baixando eng.traineddata...')
  await download('https://github.com/tesseract-ocr/tessdata/raw/main/eng.traineddata', join(PUBLIC_DIR, 'eng.traineddata'))
  console.log('Assets do Tesseract baixados em public/tesseract/')
}

main().catch((err) => {
  console.error('Erro ao baixar assets do Tesseract:', err)
  process.exit(1)
})

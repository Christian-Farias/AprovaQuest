import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const accent = '#2fae93'
const bg = '#0b1016'

// Conteúdo centralizado com margem de segurança para ícones "maskable".
function logoSvg(size, withBackground) {
  const background = withBackground
    ? `<rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${bg}"/>`
    : ''
  const fontSize = size * 0.34
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${background}
  <g transform="translate(${size / 2} ${size / 2})">
    <circle r="${size * 0.3}" fill="${accent}" opacity="0.14"/>
    <text x="0" y="${fontSize * 0.35}" text-anchor="middle"
      font-family="Trebuchet MS, Segoe UI, sans-serif" font-weight="700"
      font-size="${fontSize}" fill="${withBackground ? accent : accent}">AQ</text>
  </g>
</svg>`
}

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${bg}"/>
  <text x="32" y="43" text-anchor="middle" font-family="Trebuchet MS, Segoe UI, sans-serif"
    font-weight="700" font-size="26" fill="${accent}">AQ</text>
</svg>`

await mkdir('public/icons', { recursive: true })

const targets = [
  { file: 'public/icons/pwa-192x192.png', size: 192, bg: true },
  { file: 'public/icons/pwa-512x512.png', size: 512, bg: true },
  { file: 'public/icons/maskable-512x512.png', size: 512, bg: true },
  { file: 'public/apple-touch-icon.png', size: 180, bg: true },
]

for (const target of targets) {
  const svg = logoSvg(target.size, target.bg)
  await sharp(Buffer.from(svg)).png().toFile(target.file)
  console.log('gerado', target.file)
}

await writeFile('public/favicon.svg', faviconSvg)
console.log('gerado public/favicon.svg')

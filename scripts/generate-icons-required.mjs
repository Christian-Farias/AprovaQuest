import { writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const bg = '#0b0b0c'
const accent = '#5eead4'

function logoA(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${bg}"/>
  <text x="${size / 2}" y="${size / 2 + size * 0.35}" text-anchor="middle"
    font-family="Trebuchet MS, Segoe UI, sans-serif" font-weight="700"
    font-size="${size * 0.5}" fill="${accent}">A</text>
</svg>`
}

await sharp(Buffer.from(logoA(192))).png().toFile('public/icon-192.png')
await sharp(Buffer.from(logoA(512))).png().toFile('public/icon-512.png')
console.log('done')

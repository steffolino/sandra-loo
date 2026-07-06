import { rm } from 'node:fs/promises'

try {
  await rm('.output', { recursive: true, force: true })
} catch {
  // Ignore cleanup failures; Nuxt will still attempt a fresh build.
}

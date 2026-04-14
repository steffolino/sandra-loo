import { icons } from '@iconify-json/lucide/icons.json'

interface IconOptions {
  size?: number
  strokeWidth?: number
  stroke?: string
  fill?: string
}

export function iconMarkup(name: string, options: IconOptions = {}): string {
  const icon = icons[name as keyof typeof icons]
  if (!icon) return ''

  const size = options.size ?? 16
  const strokeWidth = options.strokeWidth ?? 2
  const stroke = options.stroke ?? 'currentColor'
  const fill = options.fill ?? 'none'

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icon.body}</svg>`
}

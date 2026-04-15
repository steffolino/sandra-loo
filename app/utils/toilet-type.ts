import type { ToiletType } from '../../shared/types/index'
import { iconMarkup } from './iconify'

export interface ToiletTypeMeta {
  label: string
  iconName: string
  background: string
  foreground: string
}

export function toiletTypeMeta(type: ToiletType): ToiletTypeMeta {
  switch (type) {
    case 'public':
      return { label: 'Public toilet', iconName: 'toilet', background: '#0f766e', foreground: '#ffffff' }
    case 'library':
      return { label: 'Library', iconName: 'book-open', background: '#92400e', foreground: '#ffffff' }
    case 'university':
      return { label: 'University', iconName: 'graduation-cap', background: '#1d4ed8', foreground: '#ffffff' }
    case 'civic':
      return { label: 'Civic building', iconName: 'landmark', background: '#0f766e', foreground: '#ffffff' }
    case 'culture':
      return { label: 'Culture venue', iconName: 'landmark', background: '#be185d', foreground: '#ffffff' }
    case 'transit':
      return { label: 'Transit hub', iconName: 'train-front', background: '#0369a1', foreground: '#ffffff' }
    case 'cafe':
      return { label: 'Cafe', iconName: 'coffee', background: '#b45309', foreground: '#ffffff' }
    case 'restaurant':
      return { label: 'Restaurant', iconName: 'utensils', background: '#7c3aed', foreground: '#ffffff' }
    case 'shopping_mall':
      return { label: 'Shopping centre', iconName: 'store', background: '#0f172a', foreground: '#ffffff' }
    case 'park':
      return { label: 'Park', iconName: 'tree-pine', background: '#15803d', foreground: '#ffffff' }
    case 'petrol_station':
      return { label: 'Petrol station', iconName: 'fuel', background: '#1d4ed8', foreground: '#ffffff' }
    default:
      return { label: 'Other place', iconName: 'building-2', background: '#374151', foreground: '#ffffff' }
  }
}

export function toiletTypeIconHtml(type: ToiletType, size = 14): string {
  return iconMarkup(toiletTypeMeta(type).iconName, {
    size,
    strokeWidth: 2.25,
    stroke: 'currentColor',
  })
}

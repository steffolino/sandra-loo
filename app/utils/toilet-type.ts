import type { ToiletType } from '../../shared/types/index'
import { iconMarkup } from './iconify'

export interface ToiletTypeMeta {
  label: string
  iconName: string
  background: string
  foreground: string
}

export function toiletTypeLabelKey(type: ToiletType): string {
  switch (type) {
    case 'public':
      return 'toilet_type.public'
    case 'library':
      return 'toilet_type.library'
    case 'university':
      return 'toilet_type.university'
    case 'civic':
      return 'toilet_type.civic'
    case 'culture':
      return 'toilet_type.culture'
    case 'transit':
      return 'toilet_type.transit'
    case 'cafe':
      return 'toilet_type.cafe'
    case 'restaurant':
      return 'toilet_type.restaurant'
    case 'shopping_mall':
      return 'toilet_type.shopping_mall'
    case 'park':
      return 'toilet_type.park'
    case 'petrol_station':
      return 'toilet_type.petrol_station'
    default:
      return 'toilet_type.other'
  }
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

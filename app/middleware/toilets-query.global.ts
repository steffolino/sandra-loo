export default defineNuxtRouteMiddleware((to) => {
  if (to.path !== '/') return

  const toiletQueryKeys = new Set([
    'city',
    'type',
    'is_free',
    'is_accessible',
    'reported',
    'min_rating',
    'radius',
    'sort',
    'lat',
    'lng',
  ])

  const hasToiletQuery = Object.keys(to.query).some(key => toiletQueryKeys.has(key))
  if (!hasToiletQuery) return

  return navigateTo({ path: '/toilets/', query: to.query }, { replace: true })
})

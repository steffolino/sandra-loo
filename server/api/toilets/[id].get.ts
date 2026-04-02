import { getToiletById, getReviewsForToilet, getReportsForToilet, getConfirmationsForToilet } from '../../utils/store'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing toilet id' })
  }

  const toilet = await getToiletById(id)
  if (!toilet) {
    throw createError({ statusCode: 404, message: 'Toilet not found' })
  }

  const reviews = getReviewsForToilet(id)
  const reports = getReportsForToilet(id)
  const confirmations = getConfirmationsForToilet(id)

  return {
    data: {
      ...toilet,
      reviews,
      reports,
      confirmations,
    },
  }
})

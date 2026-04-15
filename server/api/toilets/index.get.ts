import type { ToiletFilters } from '../../../shared/types/index'
import { getAllConfirmations, getAllReports, getAllReviews, getToilets } from '../../utils/store'
import { buildToiletList } from '../../utils/toilet-list'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)

    const filters: ToiletFilters = {
      city: query.city as string | undefined,
      is_accessible: query.is_accessible === 'true' ? true : query.is_accessible === 'false' ? false : undefined,
      is_free: query.is_free === 'true' ? true : query.is_free === 'false' ? false : undefined,
      type: query.type as ToiletFilters['type'],
      reported: query.reported === 'true' ? true : query.reported === 'false' ? false : undefined,
      min_rating: query.min_rating ? Number(query.min_rating) : undefined,
      sort: query.sort as ToiletFilters['sort'] | undefined,
      lat: query.lat ? Number(query.lat) : undefined,
      lng: query.lng ? Number(query.lng) : undefined,
      radius: query.radius ? Number(query.radius) : undefined,
      source_kind: query.source_kind as ToiletFilters['source_kind'],
    }

    const toilets = await getToilets()
    const list = buildToiletList(
      toilets,
      getAllReviews(),
      getAllReports(),
      getAllConfirmations(),
      filters,
    )

    return {
      data: list,
      meta: {
        total: list.length,
        hasData: list.length > 0,
      },
    }
  }
  catch (err) {
    // Log the error during prerender/build so we can inspect it without failing the whole build.
    // Return an empty dataset to allow prerender to continue.
    // eslint-disable-next-line no-console
    console.error('Error in GET /api/toilets during prerender/build:', err)
    return {
      data: [],
      meta: { total: 0, hasData: false },
    }
  }
})

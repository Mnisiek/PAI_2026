import { getActivityClient } from '../apollo clients/activityClient'
import { ACTIVITY_STATS } from '../graphql/activity.queries'
import type { ActivityStats } from '../types/activity'

interface ActivityStatsResponse {
  activityModule: ActivityStats
}

/** ISO-8601 instants; both optional (backend falls back to its default window). */
export interface ActivityStatsRange {
  from?: string | null
  to?: string | null
}

export const analyticsService = {
  // Reads dashboard aggregates from the real backend (ClickHouse-backed).
  async getActivityStats(range?: ActivityStatsRange): Promise<ActivityStats> {
    const { data } = await getActivityClient().query<ActivityStatsResponse>({
      query: ACTIVITY_STATS,
      variables: { from: range?.from ?? null, to: range?.to ?? null },
      fetchPolicy: 'no-cache',
    })

    if (!data) {
      throw new Error('Activity stats query returned no data.')
    }

    return data.activityModule
  },
}

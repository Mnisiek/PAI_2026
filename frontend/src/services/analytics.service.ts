import { activityClient } from './activityClient'
import { ACTIVITY_STATS } from '../graphql/activity.queries'
import type { ActivityStats } from '../types/activity'

interface ActivityStatsResponse {
  activityModule: ActivityStats
}

export const analyticsService = {
  // Reads dashboard aggregates from the real backend (ClickHouse-backed).
  async getActivityStats(): Promise<ActivityStats> {
    const { data } = await activityClient.query<ActivityStatsResponse>({
      query: ACTIVITY_STATS,
      fetchPolicy: 'no-cache',
    })

    if (!data) {
      throw new Error('Activity stats query returned no data.')
    }

    return data.activityModule
  },
}

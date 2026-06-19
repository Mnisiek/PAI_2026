import { gql } from '@apollo/client/core'
import recordActivityEvent from './activity/recordActivityEvent.graphql?raw'
import getActivityStats from './activity/getActivityStats.graphql?raw'

export const RECORD_ACTIVITY_EVENT = gql(recordActivityEvent)
export const ACTIVITY_STATS = gql(getActivityStats)

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors. OpenCRVS and the OpenCRVS
 * graphic logo are (registered/a) trademark(s) of Plan International.
 */
import {
  ListTable,
  ColumnContentAlignment
} from '@opencrvs/components/lib/interface'
import { constantsMessages } from '@client/i18n/messages'
import * as React from 'react'
import { injectIntl, WrappedComponentProps } from 'react-intl'
import { connect } from 'react-redux'
import { IOfflineData } from '@client/offline/reducer'
import { IStoreState } from '@client/store'
import { getOfflineData } from '@client/offline/selectors'
import { GQLRegistrationTimeFrameMetrics } from '@opencrvs/gateway/src/graphql/schema'
import { Event } from '@client/forms'
import {
  getValueWithPercentageString,
  getLocationFromPartOfLocationId
} from './utils'
import { IFooterFColumn } from '@opencrvs/components/lib/interface/GridTable/types'
import { get } from 'lodash'

interface IStateProps {
  offlineResources: IOfflineData
}

type FullProps = {
  data: GQLRegistrationTimeFrameMetrics
  eventType: Event
  loading: boolean
} & IStateProps &
  WrappedComponentProps

class TimeFrameComponent extends React.Component<FullProps> {
  getContent = () => {
    return (
      (this.props.data.details &&
        this.props.data.details.map(timeFrame => ({
          location: getLocationFromPartOfLocationId(
            timeFrame.locationId,
            this.props.offlineResources
          ).name,
          regWithin45d: getValueWithPercentageString(
            timeFrame.regWithin45d,
            timeFrame.total
          ),
          regWithin45dTo1yr: getValueWithPercentageString(
            timeFrame.regWithin45dTo1yr,
            timeFrame.total
          ),
          regWithin1yrTo5yr: getValueWithPercentageString(
            timeFrame.regWithin1yrTo5yr,
            timeFrame.total
          ),
          regOver5yr: getValueWithPercentageString(
            timeFrame.regOver5yr,
            timeFrame.total
          ),
          total: String(timeFrame.total)
        }))) ||
      []
    )
  }

  getFooterColumns(): IFooterFColumn[] {
    const {
      regWithin45d = 0,
      regWithin45dTo1yr = 0,
      regWithin1yrTo5yr = 0,
      regOver5yr = 0
    } = this.props.data.total || {}
    const total = get(this.props.data, 'total.total') || '0'
    return [
      {
        width: 25
      },
      {
        label: getValueWithPercentageString(regWithin45d, total),
        width: 15
      },
      {
        label: getValueWithPercentageString(regWithin45dTo1yr, total),
        width: 15
      },
      {
        label: getValueWithPercentageString(regWithin1yrTo5yr, total),
        width: 15
      },
      {
        label: getValueWithPercentageString(regOver5yr, total),
        width: 15
      },
      {
        label: total,
        width: 15
      }
    ]
  }

  render() {
    const { intl, loading, eventType } = this.props

    return (
      <ListTable
        id="timeFrames"
        tableTitle={intl.formatMessage(constantsMessages.timeFramesTitle, {
          event: eventType
        })}
        isLoading={loading}
        fixedWidth={1074}
        content={this.getContent()}
        hideBoxShadow={true}
        columns={[
          {
            label: intl.formatMessage(constantsMessages.location),
            width: 25,
            key: 'location',
            isSortable: false
          },
          {
            label: intl.formatMessage(constantsMessages.within45Days),
            width: 15,
            key: 'regWithin45d',
            isSortable: false
          },
          {
            label: intl.formatMessage(constantsMessages.within45DaysTo1Year),
            width: 15,
            key: 'regWithin45dTo1yr',
            isSortable: false
          },
          {
            label: intl.formatMessage(constantsMessages.within1YearTo5Years),
            width: 15,
            key: 'regWithin1yrTo5yr',
            isSortable: false
          },
          {
            label: intl.formatMessage(constantsMessages.over5Years),
            width: 15,
            key: 'regOver5yr',
            isSortable: false
          },
          {
            label: intl.formatMessage(constantsMessages.total),
            width: 15,
            key: 'total',
            alignment: ColumnContentAlignment.RIGHT,
            isSortable: false
          }
        ]}
        footerColumns={this.getFooterColumns()}
        noResultText={intl.formatMessage(constantsMessages.noResults)}
      />
    )
  }
}

export const TimeFrameReports = connect((store: IStoreState) => {
  return {
    offlineResources: getOfflineData(store)
  }
}, {})(injectIntl(TimeFrameComponent))

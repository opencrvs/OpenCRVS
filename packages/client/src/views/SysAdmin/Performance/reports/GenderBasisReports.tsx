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
import {
  getValueWithPercentageString,
  getLocationFromPartOfLocationId
} from './utils'
import { GQLRegistrationGenderBasisMetrics } from '@opencrvs/gateway/src/graphql/schema'
import { Event } from '@client/forms'
import { IFooterFColumn } from '@opencrvs/components/lib/interface/GridTable/types'
import { get } from 'lodash'

interface IStateProps {
  offlineResources: IOfflineData
}

type FullProps = {
  genderBasisMetrics: GQLRegistrationGenderBasisMetrics
  loading: boolean
  eventType: Event
} & IStateProps &
  WrappedComponentProps

class GenderBasisComponent extends React.Component<FullProps> {
  getContent() {
    return (
      (this.props.genderBasisMetrics.details &&
        this.props.genderBasisMetrics.details.map(content => {
          return {
            location: getLocationFromPartOfLocationId(
              content.location,
              this.props.offlineResources
            ).name,
            femaleOver18: getValueWithPercentageString(
              content.femaleOver18,
              content.total
            ),
            maleOver18: getValueWithPercentageString(
              content.maleOver18,
              content.total
            ),
            maleUnder18: getValueWithPercentageString(
              content.maleUnder18,
              content.total
            ),
            femaleUnder18: getValueWithPercentageString(
              content.femaleUnder18,
              content.total
            ),
            total: String(content.total)
          }
        })) ||
      []
    )
  }

  getFooterColumns(): IFooterFColumn[] {
    const {
      maleUnder18 = 0,
      femaleUnder18 = 0,
      maleOver18 = 0,
      femaleOver18 = 0
    } = this.props.genderBasisMetrics.total || {}
    const total = get(this.props.genderBasisMetrics, 'total.total') || '0'
    return [
      {
        width: 25
      },
      {
        label: getValueWithPercentageString(maleUnder18, total),
        width: 15
      },
      {
        label: getValueWithPercentageString(femaleUnder18, total),
        width: 15
      },
      {
        label: getValueWithPercentageString(maleOver18, total),
        width: 15
      },
      {
        label: getValueWithPercentageString(femaleOver18, total),
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
        id="genderBasisMetrics"
        tableTitle={intl.formatMessage(constantsMessages.registrationTitle, {
          event: eventType
        })}
        fixedWidth={1074}
        isLoading={loading}
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
            label: intl.formatMessage(constantsMessages.maleUnder18),
            width: 15,
            key: 'maleUnder18',
            isSortable: false
          },
          {
            label: intl.formatMessage(constantsMessages.femaleUnder18),
            width: 15,
            key: 'femaleUnder18',
            isSortable: false
          },
          {
            label: intl.formatMessage(constantsMessages.maleOver18),
            width: 15,
            key: 'maleOver18',
            isSortable: false
          },
          {
            label: intl.formatMessage(constantsMessages.femaleOver18),
            width: 15,
            key: 'femaleOver18',
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

export const GenderBasisReports = connect((store: IStoreState) => {
  return {
    offlineResources: getOfflineData(store)
  }
}, {})(injectIntl(GenderBasisComponent))

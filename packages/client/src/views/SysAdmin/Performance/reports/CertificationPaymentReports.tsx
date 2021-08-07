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
import { GQLCertificationPaymentMetrics } from '@opencrvs/gateway/src/graphql/schema'
import { Event } from '@client/forms'
import { getLocationFromPartOfLocationId } from '@client/views/SysAdmin/Performance/reports/utils'
import { IFooterFColumn } from '@opencrvs/components/lib/interface/GridTable/types'
import { get } from 'lodash'

interface IStateProps {
  offlineResources: IOfflineData
}

type FullProps = {
  data: GQLCertificationPaymentMetrics
  eventType: Event
  loading: boolean
} & IStateProps &
  WrappedComponentProps

class CertificationPaymentReportComponent extends React.Component<FullProps> {
  getContent = () => {
    return (
      (this.props.data.details &&
        this.props.data.details.map(payment => ({
          location: getLocationFromPartOfLocationId(
            payment.locationId,
            this.props.offlineResources
          ).name,
          total: String(payment.total)
        }))) ||
      []
    )
  }

  getFooterColumns(): IFooterFColumn[] {
    const total = get(this.props.data, 'total.total') || '0'
    return [
      {
        width: 85
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
        id="payments"
        fixedWidth={1074}
        tableTitle={intl.formatMessage(
          constantsMessages.certificationPaymentTitle,
          {
            event: eventType
          }
        )}
        isLoading={loading}
        content={this.getContent()}
        hideBoxShadow={true}
        columns={[
          {
            label: intl.formatMessage(constantsMessages.location),
            width: 85,
            key: 'location',
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

export const CertificationPaymentReports = connect((store: IStoreState) => {
  return {
    offlineResources: getOfflineData(store)
  }
}, {})(injectIntl(CertificationPaymentReportComponent))

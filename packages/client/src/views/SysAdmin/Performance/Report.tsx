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
import { Query } from '@client/components/Query'
import { Event } from '@client/forms'
import { goBack } from '@client/navigation'
import { IOfflineData } from '@client/offline/reducer'
import { getOfflineData } from '@client/offline/selectors'
import { IStoreState } from '@client/store'
import styled from '@client/styledComponents'
import { PERFORMANCE_METRICS } from '@client/views/SysAdmin/Performance/metricsQuery'
import {
  CertificationPaymentReports,
  Estimated45DayRegistrationReports,
  GenderBasisReports,
  TimeFrameReports
} from '@client/views/SysAdmin/Performance/reports'
import {
  SysAdminContentWrapper,
  SysAdminPageVariant
} from '@client/views/SysAdmin/SysAdminContentWrapper'
import { ISearchLocation } from '@opencrvs/components/lib/interface'
import {
  GQLCertificationPaymentMetrics,
  GQLRegistration45DayEstimatedMetrics,
  GQLRegistrationGenderBasisMetrics,
  GQLRegistrationMetrics,
  GQLRegistrationTimeFrameMetrics
} from '@opencrvs/gateway/src/graphql/schema'
import { ApolloError } from 'apollo-client'
import { get, isEmpty } from 'lodash'
import moment from 'moment'
import React, { useState } from 'react'
import { injectIntl, WrappedComponentProps } from 'react-intl'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { NoResultMessage } from './NoResultMessage'

const ReportWrapper = styled.div`
  margin-top: 16px;
`

interface ReportProps {
  selectedLocation: ISearchLocation
  timeRange: { start: Date; end: Date }
  eventType: Event
  goBack: typeof goBack
  offlineResources: IOfflineData
}

interface IMetricsQueryResult {
  fetchRegistrationMetrics: GQLRegistrationMetrics
}

type Props = ReportProps & WrappedComponentProps & RouteComponentProps<{}>

function ReportComponent(props: Props) {
  const [selectedLocation] = useState<ISearchLocation>(props.selectedLocation)

  const { timeRange, eventType } = props
  const { start, end } = timeRange

  const title = moment(start).format('MMMM YYYY')
  return (
    <SysAdminContentWrapper
      id="reports"
      type={SysAdminPageVariant.SUBPAGE_CENTERED}
      backActionHandler={props.goBack}
      headerTitle={title}
    >
      <Query
        query={PERFORMANCE_METRICS}
        variables={{
          event: eventType,
          timeStart: start.toISOString(),
          timeEnd: end.toISOString(),
          locationId: selectedLocation.id
        }}
      >
        {({
          loading,
          error,
          data
        }: {
          loading: boolean
          error?: ApolloError
          data?: IMetricsQueryResult
        }) => {
          if (
            !loading &&
            isEmpty(get(data, 'fetchRegistrationMetrics.timeFrames.details')) &&
            isEmpty(
              get(data, 'fetchRegistrationMetrics.genderBasisMetrics.details')
            ) &&
            isEmpty(get(data, 'fetchRegistrationMetrics.payments.details'))
          ) {
            return (
              <NoResultMessage
                id="reports"
                searchedLocation={selectedLocation.displayLabel}
              />
            )
          } else {
            return (
              <ReportWrapper>
                <GenderBasisReports
                  eventType={eventType}
                  loading={loading}
                  genderBasisMetrics={
                    (data &&
                      data.fetchRegistrationMetrics &&
                      (data.fetchRegistrationMetrics
                        .genderBasisMetrics as GQLRegistrationGenderBasisMetrics)) ||
                    {}
                  }
                />
                <TimeFrameReports
                  eventType={eventType}
                  loading={loading}
                  data={
                    (data &&
                      data.fetchRegistrationMetrics &&
                      (data.fetchRegistrationMetrics
                        .timeFrames as GQLRegistrationTimeFrameMetrics)) ||
                    {}
                  }
                />
                {eventType === Event.BIRTH && (
                  <Estimated45DayRegistrationReports
                    eventType={eventType}
                    loading={loading}
                    data={
                      (data &&
                        data.fetchRegistrationMetrics &&
                        (data.fetchRegistrationMetrics
                          .estimated45DayMetrics as GQLRegistration45DayEstimatedMetrics)) ||
                      {}
                    }
                  />
                )}
                <CertificationPaymentReports
                  eventType={eventType}
                  loading={loading}
                  data={
                    (data &&
                      data.fetchRegistrationMetrics &&
                      (data.fetchRegistrationMetrics
                        .payments as GQLCertificationPaymentMetrics)) ||
                    {}
                  }
                />
              </ReportWrapper>
            )
          }
        }}
      </Query>
    </SysAdminContentWrapper>
  )
}

function mapStateToProps(state: IStoreState, props: Props) {
  const historyState = props.history.location.state as any
  return {
    eventType: historyState && historyState.eventType,
    timeRange: (historyState && historyState.timeRange) || {
      start: new Date(),
      end: new Date()
    },
    selectedLocation: historyState!.selectedLocation,
    offlineResources: getOfflineData(state)
  }
}

export const Report = connect(mapStateToProps, { goBack })(
  injectIntl(ReportComponent)
)

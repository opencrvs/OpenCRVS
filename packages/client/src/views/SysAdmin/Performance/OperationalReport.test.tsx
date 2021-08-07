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
import { AppStore } from '@client/store'
import { createTestComponent, createTestStore } from '@client/tests/util'
import { waitForElement } from '@client/tests/wait-for-element'
import { ReactWrapper } from 'enzyme'
import { History } from 'history'
import * as React from 'react'
import {
  OperationalReport,
  OPERATIONAL_REPORT_SECTION
} from './OperationalReport'
import { RegistrationRatesReport } from './reports/operational/RegistrationRatesReport'
import { stringify, parse } from 'query-string'
import { OPERATIONAL_REPORTS_METRICS } from './metricsQuery'
import { GraphQLError } from 'graphql'

describe('OperationalReport tests', () => {
  let component: ReactWrapper<{}, {}>
  let store: AppStore
  let history: History<any>

  const LOCATION_DHAKA_DIVISION = {
    displayLabel: 'Dhaka Division',
    id: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b',
    searchableText: 'Dhaka'
  }

  beforeAll(async () => {
    Date.now = jest.fn(() => 1487076708000)
    const { store: testStore, history: testHistory } = await createTestStore()
    store = testStore
    history = testHistory
  })

  beforeEach(async () => {
    const graphqlMock = [
      {
        request: {
          query: OPERATIONAL_REPORTS_METRICS,
          variables: {
            locationId: LOCATION_DHAKA_DIVISION.id,
            timeEnd: new Date(1487076708000).toISOString(),
            timeStart: new Date(1455454308000).toISOString()
          }
        },
        result: {
          data: {
            getEventEstimationMetrics: {
              birth45DayMetrics: {
                actualRegistration: 4,
                estimatedRegistration: 0,
                estimatedPercentage: 0,
                malePercentage: 0,
                femalePercentage: 0,
                __typename: 'EstimationMetrics'
              },
              death45DayMetrics: {
                actualRegistration: 0,
                estimatedRegistration: 0,
                estimatedPercentage: 0,
                malePercentage: 0,
                femalePercentage: 0,
                __typename: 'EstimationMetrics'
              },
              __typename: 'EventEstimationMetrics'
            },
            getApplicationsStartedMetrics: {
              fieldAgentApplications: 0,
              hospitalApplications: 0,
              officeApplications: 6,
              __typename: 'ApplicationsStartedMetrics'
            }
          }
        }
      }
    ]
    const testComponent = await createTestComponent(
      <OperationalReport
        // @ts-ignore
        location={{
          search: stringify({
            locationId: LOCATION_DHAKA_DIVISION.id,
            sectionId: OPERATIONAL_REPORT_SECTION.OPERATIONAL,
            timeEnd: new Date(1487076708000).toISOString(),
            timeStart: new Date(1455454308000).toISOString()
          })
        }}
      />,
      store,
      graphqlMock
    )
    component = testComponent.component
  })

  it('renders without crashing', async () => {
    await waitForElement(component, '#header-location-name')
  })

  it('header shows location display label', async () => {
    const header = await waitForElement(component, '#header-location-name')
    expect(header.hostNodes().text()).toBe(LOCATION_DHAKA_DIVISION.displayLabel)
  })

  it('clicking on change button redirects to performance home keeping location in history state', async () => {
    const changeLink = await waitForElement(component, '#change-location-link')
    changeLink.hostNodes().simulate('click')
    expect(history.location.pathname).toBe('/performance')
    expect(history.location.state).toStrictEqual({
      selectedLocation: LOCATION_DHAKA_DIVISION
    })
  })

  it('performance select default value is Operational', async () => {
    const performanceSelect = await waitForElement(
      component,
      '#operational-select'
    )
    expect(
      performanceSelect
        .find('.react-select__single-value')
        .hostNodes()
        .text()
    ).toBe('Operational')
    expect(
      component.find('#registration-rates-reports-loader').hostNodes()
    ).toHaveLength(0)
  })

  it('on details link click will forward time range and location to route', async () => {
    const registrationRatesReports = await waitForElement(
      component,
      RegistrationRatesReport
    )

    registrationRatesReports.prop('onClickEventDetails')(
      'birth',
      'Birth registration rate within 45 days of event'
    )

    expect(parse(history.location.search)).toEqual({
      locationId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b',
      timeEnd: new Date(1487076708000).toISOString(),
      timeStart: new Date(1455454308000).toISOString(),
      title: 'Birth registration rate within 45 days of event'
    })
  })

  it('performance select updates history when changed', async () => {
    const performanceSelect = await waitForElement(
      component,
      '#operational-select'
    )
    performanceSelect.at(0).prop('onChange')({
      label: 'Reports',
      value: 'REPORTS'
    })
    component.update()
    expect(parse(history.location.search)).toEqual({
      locationId: LOCATION_DHAKA_DIVISION.id,
      sectionId: OPERATIONAL_REPORT_SECTION.REPORTS,
      timeEnd: new Date(1487076708000).toISOString(),
      timeStart: new Date(1455454308000).toISOString()
    })
  })

  describe('status window test', () => {
    beforeEach(() => {
      component
        .find('#btn-status')
        .hostNodes()
        .simulate('click')
      component.update()
    })

    it('expands status window and hide status button', () => {
      expect(component.find('#status-window').hostNodes()).toHaveLength(1)
      expect(component.find('#btn-status').hostNodes()).toHaveLength(0)
    })

    it('closes status window and show status button', () => {
      component
        .find('#btn-sts-wnd-cross')
        .hostNodes()
        .simulate('click')
      component.update()

      expect(component.find('#status-window').hostNodes()).toHaveLength(0)
      expect(component.find('#btn-status').hostNodes()).toHaveLength(1)
    })
  })

  describe('date range picker tests', () => {
    beforeEach(async () => {
      const dateRangePickerElement = await waitForElement(
        component,
        '#date-range-picker-action'
      )
      dateRangePickerElement.hostNodes().simulate('click')
    })

    it('modal shows up', async () => {
      await waitForElement(component, '#picker-modal')
    })

    it('clicking on close button dismisses the modal', async () => {
      const cancelButtonElement = await waitForElement(component, '#close-btn')
      cancelButtonElement.hostNodes().simulate('click')

      expect(component.find('#picker-modal').hostNodes()).toHaveLength(0)
    })

    it('clicking on outside dismisses the modal', async () => {
      const cancelButtonElement = await waitForElement(
        component,
        '#cancelable-area'
      )
      cancelButtonElement.hostNodes().simulate('click')

      expect(component.find('#picker-modal').hostNodes()).toHaveLength(0)
    })

    it('clicking on any other preset range changes date ranges in url', async () => {
      const dateRangePickerElement = await waitForElement(
        component,
        '#date-range-picker-action'
      )
      expect(dateRangePickerElement.hostNodes().text()).toBe('Last 12 months')
      const previousQueryParams = history.location.search
      const last30DaysPresetButtonElement = await waitForElement(
        component,
        '#last30Days'
      )
      last30DaysPresetButtonElement
        .hostNodes()
        .at(0)
        .simulate('click')
      const confirmButtonElement = await waitForElement(
        component,
        '#date-range-confirm-action'
      )
      confirmButtonElement.hostNodes().simulate('click')
      expect(history.location.search).not.toBe(previousQueryParams)
    })
  })
})
describe('OperationalReport reports tests', () => {
  let component: ReactWrapper<{}, {}>
  let store: AppStore

  const LOCATION_DHAKA_DIVISION = {
    displayLabel: 'Dhaka Division',
    id: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b',
    searchableText: 'Dhaka'
  }

  beforeAll(async () => {
    Date.now = jest.fn(() => 1487076708000)
    const { store: testStore } = await createTestStore()
    store = testStore
  })

  beforeEach(async () => {
    const testComponent = await createTestComponent(
      <OperationalReport
        // @ts-ignore
        location={{
          search: stringify({
            locationId: LOCATION_DHAKA_DIVISION.id,
            sectionId: OPERATIONAL_REPORT_SECTION.REPORTS,
            timeEnd: new Date(1487076708000).toISOString(),
            timeStart: new Date(1455454308000).toISOString()
          })
        }}
      />,
      store
    )
    component = testComponent.component
  })

  it('renders report lists', async () => {
    expect(component.find('#report-lists').hostNodes()).toHaveLength(1)
  })
})

describe('Test error toast notification', () => {
  let component: ReactWrapper<{}, {}>
  let store: AppStore

  const LOCATION_DHAKA_DIVISION = {
    displayLabel: 'Dhaka Division',
    id: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b',
    searchableText: 'Dhaka'
  }

  beforeAll(async () => {
    Date.now = jest.fn(() => 1487076708000)
    const { store: testStore } = await createTestStore()
    store = testStore
  })

  beforeEach(async () => {
    const graphqlMock = [
      {
        request: {
          query: OPERATIONAL_REPORTS_METRICS,
          variables: {
            locationId: LOCATION_DHAKA_DIVISION.id,
            timeEnd: new Date(1487076708000).toISOString(),
            timeStart: new Date(1455454308000).toISOString()
          }
        },
        result: {
          errors: [new GraphQLError('ERROR!')]
        }
      }
    ]
    const testComponent = await createTestComponent(
      <OperationalReport
        // @ts-ignore
        location={{
          search: stringify({
            locationId: LOCATION_DHAKA_DIVISION.id,
            sectionId: OPERATIONAL_REPORT_SECTION.OPERATIONAL,
            timeEnd: new Date(1487076708000).toISOString(),
            timeStart: new Date(1455454308000).toISOString()
          })
        }}
      />,
      store,
      graphqlMock
    )
    component = testComponent.component
  })

  it('renders the error toast notification and component loader', async () => {
    await waitForElement(component, '#error-toast')
    expect(component.find('#error-toast').hostNodes()).toHaveLength(1)
    expect(
      component.find('#registration-rates-reports-loader').hostNodes()
    ).toHaveLength(1)
    expect(
      component.find('#applications-started-reports-loader').hostNodes()
    ).toHaveLength(1)
  })
})

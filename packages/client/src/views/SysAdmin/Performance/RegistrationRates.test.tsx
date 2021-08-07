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

import * as React from 'react'
import { ReactWrapper } from 'enzyme'
import { History } from 'history'
import {
  createTestComponent,
  createTestStore,
  flushPromises
} from '@client/tests/util'
import { AppStore } from '@client/store'
import { RegistrationRates } from '@client/views/SysAdmin/Performance/RegistrationRates'
import { EVENT_REGISTRATION_RATES } from '@client/navigation/routes'
import {
  HAS_CHILD_LOCATION,
  FETCH_MONTH_WISE_EVENT_ESTIMATIONS
} from '@client/views/SysAdmin/Performance/queries'
import { waitForElement } from '@client/tests/wait-for-element'
import { stringify, parse } from 'query-string'
import { GraphQLError } from 'graphql'

const LOCATION_DHAKA_DIVISION = {
  displayLabel: 'Dhaka Division',
  id: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b',
  searchableText: 'Dhaka'
}
const timeStart = new Date(2019, 11, 6)
const timeEnd = new Date(2019, 11, 13)

describe('Registraion Rates tests', () => {
  const graphqlMocks = [
    {
      request: {
        query: HAS_CHILD_LOCATION,
        variables: { parentId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b' }
      },
      result: {
        data: {
          hasChildLocation: {
            id: 'd70fbec1-2b26-474b-adbc-bb83783bdf29',
            type: 'ADMIN_STRUCTURE',
            identifier: [
              {
                system: 'http://opencrvs.org/specs/id/geo-id',
                value: '4194'
              },
              {
                system: 'http://opencrvs.org/specs/id/bbs-code',
                value: '11'
              },
              {
                system: 'http://opencrvs.org/specs/id/jurisdiction-type',
                value: 'UNION'
              },
              {
                system: 'http://opencrvs.org/specs/id/a2i-internal-reference',
                value: 'division=9&district=30&upazila=233&union=4194'
              }
            ]
          }
        }
      }
    },
    {
      request: {
        query: FETCH_MONTH_WISE_EVENT_ESTIMATIONS,
        variables: {
          event: 'BIRTH',
          locationId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b',
          timeStart: timeStart.toISOString(),
          timeEnd: timeEnd.toISOString()
        }
      },
      result: {
        data: {
          fetchMonthWiseEventMetrics: {
            details: [
              {
                actualTotalRegistration: 20,
                actual45DayRegistration: 9,
                estimatedRegistration: 45,
                estimated45DayPercentage: 4.5,
                month: 'April',
                year: '2020',
                startOfMonth: '2020-03-30T18:00:00.000Z'
              },
              {
                actualTotalRegistration: 10,
                actual45DayRegistration: 0,
                estimatedRegistration: 45,
                estimated45DayPercentage: 0,
                month: 'March',
                year: '2020',
                startOfMonth: '2020-02-29T18:00:00.000Z'
              }
            ],
            total: {
              actualTotalRegistration: 30,
              actual45DayRegistration: 9,
              estimatedRegistration: 45,
              estimated45DayPercentage: 2.25
            }
          }
        }
      }
    }
  ]
  let component: ReactWrapper<{}, {}>
  let store: AppStore
  let history: History<any>

  beforeAll(async () => {
    Date.now = jest.fn(() => 1487076708000)
    const { store: testStore, history: testHistory } = await createTestStore()
    store = testStore
    history = testHistory
  })

  beforeEach(async () => {
    component = (
      await createTestComponent(
        <RegistrationRates
          match={{
            params: { eventType: 'birth' },
            isExact: true,
            path: EVENT_REGISTRATION_RATES,
            url: ''
          }}
          // @ts-ignore
          location={{
            search: stringify({
              locationId: LOCATION_DHAKA_DIVISION.id,
              timeEnd: new Date(1487076708000).toISOString(),
              timeStart: new Date(1455454308000).toISOString()
            })
          }}
        />,
        store,
        graphqlMocks
      )
    ).component

    // wait for mocked data to load mockedProvider
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    component.update()
  })

  it('renders the component', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 200
    })
    await waitForElement(component, '#reg-rates-header')
  })

  it('because of more than one child locations from the query, by location option arrives in dropdown', async () => {
    const select = await waitForElement(component, '#base-select')
    select
      .find('.react-select__control')
      .simulate('keyDown', { key: 'ArrowDown', keyCode: 40 })
    component.update()
    expect(component.find('.react-select__menu-list').children().length).toBe(2)
    expect(
      component
        .find('.react-select__menu-list')
        .childAt(1)
        .text()
    ).toBe('By location')
  })

  it('clicking on back takes back to operational dashboard with selected location', async () => {
    const backAction = await waitForElement(component, '#reg-rates-action-back')
    backAction.hostNodes().simulate('click')
    await flushPromises()
    expect(history.location.pathname).toBe('/performance/operations')
    expect(parse(history.location.search)).toEqual({
      sectionId: 'OPERATIONAL',
      locationId: LOCATION_DHAKA_DIVISION.id,
      timeEnd: new Date(1487076708000).toISOString(),
      timeStart: new Date(1455454308000).toISOString()
    })
  })

  it('clicking on any other preset range changes date ranges in url', async () => {
    const dateRangePickerElement = await waitForElement(
      component,
      '#date-range-picker-action'
    )
    expect(dateRangePickerElement.hostNodes().text()).toBe('Last 12 months')
    const previousQueryParams = history.location.search
    dateRangePickerElement.hostNodes().simulate('click')
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

  it('click on close button or outside modal closes location picker modal', async () => {
    const locationPickerElement = await waitForElement(
      component,
      '#location-range-picker-action'
    )
    locationPickerElement.hostNodes().simulate('click')

    expect(component.find('#picker-modal').hostNodes()).toHaveLength(1)

    component
      .find('#close-btn')
      .hostNodes()
      .simulate('click')

    expect(component.find('#picker-modal').hostNodes()).toHaveLength(0)

    locationPickerElement.hostNodes().simulate('click')
    expect(component.find('#picker-modal').hostNodes()).toHaveLength(1)
    component
      .find('#cancelable-area')
      .hostNodes()
      .simulate('click')
    expect(component.find('#picker-modal').hostNodes()).toHaveLength(0)
  })

  it('changing location id from location picker updates the query params', async () => {
    const locationIdBeforeChange = parse(history.location.search).locationId
    const locationPickerElement = await waitForElement(
      component,
      '#location-range-picker-action'
    )

    locationPickerElement.hostNodes().simulate('click')

    const locationSearchInput = await waitForElement(
      component,
      '#locationSearchInput'
    )
    locationSearchInput.hostNodes().simulate('change', {
      target: { value: 'Baniajan', id: 'locationSearchInput' }
    })

    const searchResultOption = await waitForElement(
      component,
      '#locationOptionbfe8306c-0910-48fe-8bf5-0db906cf3155'
    )
    searchResultOption.hostNodes().simulate('click')
    const newLocationId = parse(history.location.search).locationId
    expect(newLocationId).not.toBe(locationIdBeforeChange)
    expect(newLocationId).toBe('bfe8306c-0910-48fe-8bf5-0db906cf3155')
  })
})

describe('Registraion Rates error state tests', () => {
  const graphqlMocks = [
    {
      request: {
        query: HAS_CHILD_LOCATION,
        variables: { parentId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b' }
      },
      result: {
        data: {
          hasChildLocation: {
            id: 'd70fbec1-2b26-474b-adbc-bb83783bdf29',
            type: 'ADMIN_STRUCTURE',
            identifier: [
              {
                system: 'http://opencrvs.org/specs/id/geo-id',
                value: '4194'
              },
              {
                system: 'http://opencrvs.org/specs/id/bbs-code',
                value: '11'
              },
              {
                system: 'http://opencrvs.org/specs/id/jurisdiction-type',
                value: 'UNION'
              },
              {
                system: 'http://opencrvs.org/specs/id/a2i-internal-reference',
                value: 'division=9&district=30&upazila=233&union=4194'
              }
            ]
          }
        }
      }
    },
    {
      request: {
        query: FETCH_MONTH_WISE_EVENT_ESTIMATIONS,
        variables: {
          event: 'BIRTH',
          locationId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b',
          timeStart: timeStart.toISOString(),
          timeEnd: timeEnd.toISOString()
        }
      },
      result: {
        errors: [new GraphQLError('Error!')]
      }
    }
  ]
  let component: ReactWrapper<{}, {}>
  let store: AppStore

  beforeEach(async () => {
    Date.now = jest.fn(() => 1487076708000)
    const { store: testStore } = await createTestStore()
    store = testStore
    component = (
      await createTestComponent(
        <RegistrationRates
          match={{
            params: { eventType: 'birth' },
            isExact: true,
            path: EVENT_REGISTRATION_RATES,
            url: ''
          }}
          // @ts-ignore
          location={{
            search: stringify({
              locationId: LOCATION_DHAKA_DIVISION.id,
              timeEnd: new Date(1487076708000).toISOString(),
              timeStart: new Date(1455454308000).toISOString()
            })
          }}
        />,
        store,
        graphqlMocks
      )
    ).component

    // wait for mocked data to load mockedProvider
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    component.update()
  })

  it('renders the error toast notification and component loader', async () => {
    await waitForElement(component, '#error-toast')
    expect(component.find('#error-toast').hostNodes()).toHaveLength(1)
    expect(
      component.find('#reg-rates-line-chart-loader').hostNodes()
    ).toHaveLength(1)
  })
})

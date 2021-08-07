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
import { AppStore } from '@client/store'
import { ReactWrapper } from 'enzyme'
import { createTestStore, createTestComponent } from '@client/tests/util'
import { Within45DaysTable } from '@client/views/SysAdmin/Performance/reports/registrationRates/Within45DaysTable'
import { Event } from '@client/forms'
import { waitForElement } from '@client/tests/wait-for-element'
import { REG_RATE_BASE } from '@client/views/SysAdmin/Performance/RegistrationRates'

describe('Within45DaysTable tests for over time option', () => {
  let component: ReactWrapper<{}, {}>
  let store: AppStore

  const mockData = {
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

  beforeAll(async () => {
    store = (await createTestStore()).store
  })

  beforeEach(async () => {
    component = (
      await createTestComponent(
        <Within45DaysTable
          loading={false}
          base={{ baseType: REG_RATE_BASE.TIME }}
          eventType={Event.BIRTH}
          data={mockData}
        />,
        store
      )
    ).component
  })

  it('runs without crashing', async () => {
    const firstRowElement = await waitForElement(component, '#row_0')
    expect(firstRowElement).toBeDefined()
  })

  it('toggles sorting order of the list', async () => {
    const firstRowElement = await waitForElement(component, '#row_0')
    const toggleSortActionElement = await waitForElement(
      component,
      '#month-label'
    )
    expect(
      firstRowElement
        .hostNodes()
        .childAt(0)
        .text()
    ).toBe('April 2020')

    toggleSortActionElement.hostNodes().simulate('click')

    expect(
      firstRowElement
        .hostNodes()
        .childAt(0)
        .text()
    ).toBe('March 2020')
  })
})
describe('Within45DaysTable tests for by location option', () => {
  let component: ReactWrapper<{}, {}>
  let store: AppStore

  const mockData = {
    details: [
      {
        actualTotalRegistration: 20,
        actual45DayRegistration: 9,
        estimatedRegistration: 45,
        estimated45DayPercentage: 4.5,
        locationName: 'Atpara Sadar',
        locationId: '123'
      },
      {
        actualTotalRegistration: 10,
        actual45DayRegistration: 0,
        estimatedRegistration: 45,
        estimated45DayPercentage: 0,
        locationName: 'Baniajan',
        locationId: '456'
      }
    ],
    total: {
      actualTotalRegistration: 30,
      actual45DayRegistration: 9,
      estimatedRegistration: 45,
      estimated45DayPercentage: 2.25
    }
  }

  beforeAll(async () => {
    store = (await createTestStore()).store
  })

  beforeEach(async () => {
    component = (
      await createTestComponent(
        <Within45DaysTable
          loading={false}
          base={{
            baseType: REG_RATE_BASE.LOCATION,
            locationJurisdictionType: 'UNION'
          }}
          eventType={Event.BIRTH}
          data={mockData}
        />,
        store
      )
    ).component
  })

  it('runs without crashing', async () => {
    const firstRowElement = await waitForElement(component, '#row_0')
    expect(firstRowElement).toBeDefined()
  })

  it('toggles sorting order of the list', async () => {
    const firstRowElement = await waitForElement(component, '#row_0')
    const toggleSortActionElement = await waitForElement(
      component,
      '#location-label'
    )
    expect(
      firstRowElement
        .hostNodes()
        .childAt(0)
        .text()
    ).toBe('Atpara Sadar')

    toggleSortActionElement.hostNodes().simulate('click')

    expect(
      firstRowElement
        .hostNodes()
        .childAt(0)
        .text()
    ).toBe('Baniajan')
  })
})

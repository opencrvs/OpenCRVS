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
import {
  createTestComponent,
  createTestStore,
  resizeWindow
} from '@client/tests/util'
import { AppStore } from '@client/store'
import { DateRangePicker } from '@client/components/DateRangePicker'
import { waitForElement } from '@client/tests/wait-for-element'

describe('date picker tests', () => {
  let component: ReactWrapper
  let store: AppStore
  let onDatesChangeMock: jest.Mock

  beforeAll(async () => {
    Date.now = jest.fn(() => 1592233232409)
    const appStore = await createTestStore()
    store = appStore.store
    onDatesChangeMock = jest.fn()
    const testComponent = await createTestComponent(
      <DateRangePicker
        startDate={new Date(2020, 4, 16)}
        endDate={new Date(2020, 5, 16)}
        onDatesChange={onDatesChangeMock}
      />,
      store
    )
    component = testComponent.component
  })

  describe('on desktop', () => {
    it('renders without crashing', async () => {
      await waitForElement(component, '#date-range-picker-action')
    })
  })

  describe('on smaller device', () => {
    beforeAll(async () => {
      resizeWindow(412, 755)
    })

    afterEach(() => {
      resizeWindow(1024, 768)
    })

    beforeEach(async () => {
      const pickerButtonElement = await waitForElement(
        component,
        '#date-range-picker-action'
      )
      pickerButtonElement.hostNodes().simulate('click')
      onDatesChangeMock.mockClear()
    })

    it('renders modal for smaller device', async () => {
      await waitForElement(component, '#picker-modal-mobile')
    })

    it('clicking on any preset item triggers onDatesChange with preset dates', async () => {
      const presetElement = await waitForElement(component, '#preset-small')
      presetElement
        .find('#last12Months')
        .hostNodes()
        .simulate('click')
      expect(onDatesChangeMock).toBeCalledWith({
        startDate: new Date(Date.parse('2019-06-15T15:00:32.409Z')),
        endDate: new Date(Date.parse('2020-06-15T15:00:32.409Z'))
      })
    })

    it('clicking on custom date range navigates to from date and finally triggers onDatesChange on click month', async () => {
      const presetElement = await waitForElement(component, '#preset-small')
      presetElement
        .find('#customDateRangeNav')
        .hostNodes()
        .simulate('click')

      let startDatePrevNavButton = await waitForElement(
        component,
        '#start-date-small-prev'
      )

      startDatePrevNavButton.hostNodes().simulate('click')
      component.update()
      startDatePrevNavButton = await waitForElement(
        component,
        '#start-date-small-prev'
      )
      startDatePrevNavButton.hostNodes().simulate('click')
      component.update()
      expect(
        component
          .find('#start-date-small-year-label')
          .hostNodes()
          .text()
      ).toBe('2018')
      const startDateNextNavButton = await waitForElement(
        component,
        '#start-date-small-next'
      )
      startDateNextNavButton.hostNodes().simulate('click')
      expect(
        component
          .find('#start-date-small-year-label')
          .hostNodes()
          .text()
      ).toBe('2019')

      component
        .find('#start-date-small-feb')
        .hostNodes()
        .simulate('click')

      component.update()

      expect(
        component
          .find('#end-date-small-year-label')
          .hostNodes()
          .text()
      ).toBe('2020')
      component.update()

      component
        .find('#end-date-small-mar')
        .hostNodes()
        .simulate('click')

      const [onDatesChangeHandlerArgs] = onDatesChangeMock.mock.calls

      const { startDate, endDate } = onDatesChangeHandlerArgs[0]
      expect((startDate as Date).getMonth()).toBe(1)
      expect((endDate as Date).getMonth()).toBe(2)
    })
  })
})

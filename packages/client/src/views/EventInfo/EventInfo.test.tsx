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
import { createTestStore, createTestComponent } from '@client/tests/util'
import { EventInfo } from '@client/views/EventInfo/EventInfo'
import { Event } from '@client/forms'
import { waitForElement } from '@client/tests/wait-for-element'
import { History } from 'history'

describe('EventInfo tests', () => {
  let component: ReactWrapper<{}, {}>
  let history: History<any>

  describe('For birth event', () => {
    beforeAll(async () => {
      const { store: testStore, history: testHistory } = await createTestStore()

      const testComponent = await createTestComponent(
        // @ts-ignore
        <EventInfo match={{ params: { eventType: Event.BIRTH } }} />,
        testStore
      )
      component = testComponent.component
      history = testHistory
    })

    it('renders birth bullet list items', async () => {
      const element = await waitForElement(component, '#birth-info-bullet-list')
      expect(element).toBeDefined()
    })

    it('clicking on continue takes user to select birth informant view', async () => {
      const continueButton = await waitForElement(component, '#continue')
      continueButton.hostNodes().simulate('click')
      expect(history.location.pathname).toContain(
        'events/birth/registration/informant'
      )
    })
  })

  describe('For death event', () => {
    beforeAll(async () => {
      const { store: testStore, history: testHistory } = await createTestStore()

      const testComponent = await createTestComponent(
        // @ts-ignore
        <EventInfo match={{ params: { eventType: Event.DEATH } }} />,
        testStore
      )
      component = testComponent.component
      history = testHistory
    })

    it('renders death bullet list items', async () => {
      const element = await waitForElement(component, '#death-info-bullet-list')
      expect(element).toBeDefined()
    })

    it('clicking on continue takes user to select death informant view', async () => {
      const continueButton = await waitForElement(component, '#continue')
      continueButton.hostNodes().simulate('click')
      expect(history.location.pathname).toContain(
        'events/death/registration/informant'
      )
    })
  })

  describe('For unknown event', () => {
    beforeAll(async () => {
      const { store: testStore, history: testHistory } = await createTestStore()

      const testComponent = await createTestComponent(
        // @ts-ignore
        <EventInfo match={{ params: { eventType: 'unknwown' } }} />,
        testStore
      )
      component = testComponent.component
      history = testHistory
    })

    it('clicking on continue throws error', async () => {
      const continueButton = await waitForElement(component, '#continue')
      try {
        continueButton.hostNodes().simulate('click')
      } catch (error) {
        expect(error.message).toMatch(/Unknown eventType/)
      }
    })
  })
})

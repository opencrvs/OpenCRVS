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
import { createTestComponent, flushPromises } from '@client/tests/util'
import { createStore } from '@client/store'
import { Unlock } from '@client/views/Unlock/Unlock'
import { storage } from '@client/storage'
import { pinValidator } from '@client/views/Unlock/ComparePINs'
import { SCREEN_LOCK } from '@client/components/ProtectedPage'
import { SECURITY_PIN_EXPIRED_AT } from '@client/utils/constants'
import { waitForElement } from '@client/tests/wait-for-element'
import moment from 'moment'

const clearPassword = (component: ReactWrapper) => {
  const backSpaceElem = component.find('#keypad-backspace').hostNodes()
  backSpaceElem.update()
  backSpaceElem.simulate('click')
  backSpaceElem.simulate('click')
  backSpaceElem.simulate('click')
  backSpaceElem.simulate('click')
}

describe('Unlock page loads Properly', () => {
  let testComponent: { component: ReactWrapper }
  let onForgetPinMock: jest.Mock = jest.fn()
  beforeEach(async () => {
    await flushPromises()

    // mock indexeddb
    const indexedDB = {
      USER_DETAILS: JSON.stringify({ userMgntUserID: 'shakib75' }),
      USER_DATA: JSON.stringify([
        {
          userID: 'shakib75',
          userPIN:
            '$2a$10$xQBLcbPgGQNu9p6zVchWuu6pmCrQIjcb6k2W1PIVUxVTE/PumWM82',
          drafts: []
        }
      ]),
      screenLock: undefined,
      USER_ID: 'shakib75',
      // eslint-disable-next-line @typescript-eslint/camelcase
      locked_time: undefined
    }

    storage.getItem = jest.fn(async (key: string) =>
      // @ts-ignore
      Promise.resolve(indexedDB[key])
    )

    storage.setItem = jest.fn(
      // @ts-ignore
      async (key: string, value: string) => (indexedDB[key] = value)
    )

    const { store } = createStore()
    testComponent = await createTestComponent(
      <Unlock onCorrectPinMatch={() => null} onForgetPin={onForgetPinMock} />,
      store
    )
  })

  it('Should load the Unlock page properly', () => {
    const elem = testComponent.component.find('#unlockPage').hostNodes().length
    expect(elem).toBe(1)
  })

  it('There should be no error message after providing successfull Pin', () => {
    clearPassword(testComponent.component)
    const numberElem = testComponent.component.find('#keypad-0').hostNodes()

    numberElem.simulate('click')
    numberElem.simulate('click')
    numberElem.simulate('click')
    numberElem.simulate('click')
    testComponent.component.update()

    expect(testComponent.component.find('#errorMsg').hostNodes()).toHaveLength(
      0
    )
  })

  it('Should trigger onForgetPin when click on forgotten pin link', () => {
    const forgottenPinElement = testComponent.component.find('#forgotten_pin')
    forgottenPinElement.hostNodes().simulate('click')
    expect(onForgetPinMock).toBeCalledTimes(1)
  })
})

describe('For wrong inputs', () => {
  let testComponent: { component: ReactWrapper }
  let onForgetPinMock: jest.Mock = jest.fn()

  beforeEach(async () => {
    await flushPromises()
    jest.clearAllMocks()
    const { store } = createStore()
    testComponent = await createTestComponent(
      <Unlock onCorrectPinMatch={() => null} onForgetPin={onForgetPinMock} />,
      store
    )

    // These tests are only for wrong inputs, so this mock fn only returns a promise of false
    pinValidator.isValidPin = jest.fn(async pin => Promise.resolve(false))
  })
  it('Should Display Incorrect error message', async () => {
    const numberElem = testComponent.component.find('#keypad-1').hostNodes()
    numberElem.simulate('click')
    numberElem.simulate('click')
    numberElem.simulate('click')
    numberElem.simulate('click')
    testComponent.component.update()

    const errorMsg = await waitForElement(testComponent.component, '#errorMsg')

    expect(errorMsg.hostNodes().text()).toBe('Incorrect pin. Please try again')
  })

  it('Should display the Last try message', async () => {
    testComponent.component
      .find('UnlockView')
      .instance()
      .setState({ attempt: 2 })

    const numberElem = testComponent.component.find('#keypad-1').hostNodes()
    numberElem.simulate('click')
    numberElem.simulate('click')
    numberElem.simulate('click')
    numberElem.simulate('click')

    const errorMsg = await waitForElement(testComponent.component, '#errorMsg')

    expect(errorMsg.hostNodes().text()).toBe('Last Try')
  })
})

describe('Pin locked session', () => {
  let testComponent: { component: ReactWrapper }
  let onForgetPinMock: jest.Mock = jest.fn()
  beforeEach(async () => {
    await flushPromises()
    jest.clearAllMocks()

    moment.now = jest.fn(() => 1578308937586)
    // mock indexeddb
    const indexedDB = {
      USER_DETAILS: JSON.stringify({ userMgntUserID: 'shakib75' }),
      USER_DATA: JSON.stringify([
        {
          userID: 'shakib75',
          userPIN:
            '$2a$10$xQBLcbPgGQNu9p6zVchWuu6pmCrQIjcb6k2W1PIVUxVTE/PumWM82',
          drafts: []
        }
      ]),
      screenLock: undefined,
      USER_ID: 'shakib75',
      // eslint-disable-next-line @typescript-eslint/camelcase
      locked_time: '1578308927392'
    }

    storage.getItem = jest.fn(async (key: string) =>
      // @ts-ignore
      Promise.resolve(indexedDB[key])
    )

    storage.setItem = jest.fn(
      // @ts-ignore
      async (key: string, value: string) => (indexedDB[key] = value)
    )

    const { store } = createStore()
    testComponent = await createTestComponent(
      <Unlock onCorrectPinMatch={() => null} onForgetPin={onForgetPinMock} />,
      store
    )
  })

  it('Should not accept correct pin while the account is locked', async () => {
    testComponent.component
      .find('UnlockView')
      .instance()
      .setState({ attempt: 4 })

    const numberElem = testComponent.component.find('#keypad-0').hostNodes()
    numberElem.simulate('click')
    numberElem.simulate('click')
    numberElem.simulate('click')
    numberElem.simulate('click')

    const errorMsg = await waitForElement(testComponent.component, '#errorMsg')

    expect(errorMsg.hostNodes().text()).toBe(
      'Your account has been locked. Please try again in 1 minute.'
    )
  })
})

describe('Logout Sequence', () => {
  let onForgetPinMock: jest.Mock = jest.fn()

  it('should clear lock-related indexeddb entries upon logout', async () => {
    const { store } = createStore()
    const redirect = jest.fn()
    const testComponent = await createTestComponent(
      <Unlock
        onCorrectPinMatch={() => redirect}
        onForgetPin={onForgetPinMock}
      />,
      store
    )
    const indexeddb = {
      SCREEN_LOCK: true,
      SECURITY_PIN_EXPIRED_AT: 1234
    }
    // @ts-ignore
    storage.removeItem = jest.fn((key: string) => {
      // @ts-ignore
      delete indexeddb[key]
    })
    testComponent.component
      .find('#logout')
      .hostNodes()
      .simulate('click')
    testComponent.component.update()
    // @ts-ignore
    expect(indexeddb[SCREEN_LOCK]).toBeFalsy()
    // @ts-ignore
    expect(indexeddb[SECURITY_PIN_EXPIRED_AT]).toBeFalsy()
  })
})

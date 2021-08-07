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
import React from 'react'
import { ReactWrapper } from 'enzyme'
import { AppStore } from '@client/store'
import {
  createTestStore,
  createTestComponent,
  flushPromises
} from '@client/tests/util'
import { ForgotPIN } from '@client/views/Unlock/ForgotPIN'
import { waitForElement } from '@client/tests/wait-for-element'
import { setUserDetails } from '@client/profile/profileActions'
import { NetworkStatus } from 'apollo-client'
import { userQueries } from '@client/user/queries'
import { storage } from '@client/storage'
import { SCREEN_LOCK } from '@client/components/ProtectedPage'
import { SECURITY_PIN_EXPIRED_AT } from '@client/utils/constants'

describe('ForgotPIN tests', () => {
  let component: ReactWrapper
  let store: AppStore
  const goBackMock: jest.Mock = jest.fn()
  const onVerifyPasswordMock = jest.fn()
  userQueries.verifyPasswordById = jest.fn()

  beforeAll(async () => {
    const testStore = await createTestStore()
    store = testStore.store

    store.dispatch(
      setUserDetails({
        loading: false,
        networkStatus: NetworkStatus.ready,
        stale: false,
        data: {
          getUser: {
            userMgntUserID: '5eba726866458970cf2e23c2',
            practitionerId: '778464c0-08f8-4fb7-8a37-b86d1efc462a',
            mobile: '+8801711111111',
            role: 'FIELD_AGENT',
            type: 'CHA',
            status: 'active',
            name: [
              {
                use: 'en',
                firstNames: 'Shakib',
                familyName: 'Al Hasan'
              }
            ],
            catchmentArea: [
              {
                id: '514cbc3a-cc99-4095-983f-535ea8cb6ac0',
                name: 'Baniajan',
                alias: ['বানিয়াজান'],
                status: 'active',
                identifier: [
                  {
                    system:
                      'http://opencrvs.org/specs/id/a2i-internal-reference',
                    value: 'division=9&district=30&upazila=233&union=4194'
                  }
                ]
              }
            ],
            primaryOffice: undefined,
            localRegistrar: {
              name: [
                {
                  use: 'en',
                  firstNames: 'Mohammad',
                  familyName: 'Ashraful'
                }
              ],
              role: 'LOCAL_REGISTRAR',
              signature: undefined
            }
          }
        }
      })
    )
  })

  beforeEach(async () => {
    component = (
      await createTestComponent(
        <ForgotPIN
          goBack={goBackMock}
          onVerifyPassword={onVerifyPasswordMock}
        />,
        store
      )
    ).component

    // wait for mocked data to load mockedProvider
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    component.update()
  })

  it('renders forgotPIN overlay', () => {
    expect(component.find('#forgot_pin_page').hostNodes()).toHaveLength(1)
  })

  it('clicking on back triggers goBack', async () => {
    const backButton = await waitForElement(component, '#action_back')
    backButton.hostNodes().simulate('click')
    expect(goBackMock).toBeCalledTimes(1)
  })

  it('clicking on verify with empty password field shows error', async () => {
    const formElement = await waitForElement(
      component,
      '#password_verification_form'
    )
    formElement.hostNodes().simulate('submit')
    component.update()
    const formError = await waitForElement(component, '#form_error')
    expect(formError.hostNodes()).toHaveLength(1)
    expect(formError.hostNodes().text()).toBe('This field is required')
  })

  it('wrong password submission shows error', async () => {
    ;(userQueries.verifyPasswordById as jest.Mock).mockRejectedValueOnce({
      data: {
        verifyPasswordById: null
      },
      errors: [
        {
          message: 'Unauthorized to verify password',
          path: ['verifyPasswordById'],
          extensions: {
            code: 'INTERNAL_SERVER_ERROR'
          }
        }
      ]
    })
    const passwordInput = await waitForElement(component, 'input#password')
    passwordInput.hostNodes().simulate('change', {
      target: { id: 'password', value: 'wrongPassword' }
    })

    const formElement = await waitForElement(
      component,
      '#password_verification_form'
    )

    formElement.hostNodes().simulate('submit')

    await flushPromises()

    const formError = await waitForElement(component, '#form_error')
    expect(formError.hostNodes()).toHaveLength(1)
    expect(formError.hostNodes().text()).toBe(
      'The password you entered was incorrect'
    )
  })

  it('correct password submission triggers onVerifyPassword', async () => {
    ;(userQueries.verifyPasswordById as jest.Mock).mockReturnValueOnce({
      data: {
        verifyPasswordById: {
          id: '5eba726866458970cf2e23c2',
          username: 'sakibal.hasan'
        }
      }
    })
    const passwordInput = await waitForElement(component, 'input#password')
    passwordInput.hostNodes().simulate('change', {
      target: { id: 'password', value: 'correctPassword' }
    })

    const formElement = await waitForElement(
      component,
      '#password_verification_form'
    )

    formElement.hostNodes().simulate('submit')

    await flushPromises()

    expect(onVerifyPasswordMock).toBeCalledTimes(1)
  })

  it('clicking on logout removes indexedDB entries', async () => {
    const indexeddb = {
      [SCREEN_LOCK]: true,
      [SECURITY_PIN_EXPIRED_AT]: 1234
    }

    // @ts-ignore
    storage.removeItem = jest.fn((key: string) => {
      // @ts-ignore
      delete indexeddb[key]
    })

    const logoutButton = await waitForElement(component, '#logout')

    logoutButton.hostNodes().simulate('click')

    // @ts-ignore
    expect(indexeddb[SCREEN_LOCK]).toBeFalsy()
    // @ts-ignore
    expect(indexeddb[SECURITY_PIN_EXPIRED_AT]).toBeFalsy()
  })

  it('clicking on forgot password logs out and redirects to forgot password screen of login app', async () => {
    const indexeddb = {
      [SCREEN_LOCK]: true,
      [SECURITY_PIN_EXPIRED_AT]: 1234
    }

    // @ts-ignore
    storage.removeItem = jest.fn((key: string) => {
      // @ts-ignore
      delete indexeddb[key]
    })

    window.location.assign = jest.fn()

    const forgotPasswordButton = await waitForElement(
      component,
      '#forgot_password'
    )

    forgotPasswordButton.hostNodes().simulate('click')

    // @ts-ignore
    expect(indexeddb[SCREEN_LOCK]).toBeFalsy()
    // @ts-ignore
    expect(indexeddb[SECURITY_PIN_EXPIRED_AT]).toBeFalsy()
    expect(window.location.assign).toBeCalledWith(
      'http://localhost:3020/forgotten-item'
    )
  })
})

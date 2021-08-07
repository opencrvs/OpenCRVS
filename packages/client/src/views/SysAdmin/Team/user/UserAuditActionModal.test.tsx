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
import { UserAuditActionModal, AUDIT_ACTION } from './UserAuditActionModal'
import {
  createTestStore,
  createTestComponent,
  flushPromises
} from '@client/tests/util'
import { AppStore } from '@client/store'
import { waitForElement } from '@client/tests/wait-for-element'
import { USER_AUDIT_ACTION } from '@client/user/queries'
import { GraphQLError } from 'graphql'

const users = [
  {
    id: '5d08e102542c7a19fc55b790',
    name: [
      {
        use: 'en',
        firstNames: 'Rabindranath',
        familyName: 'Tagore'
      }
    ],
    username: 'r.tagore',
    role: 'REGISTRATION_AGENT',
    localRegistrar: {
      name: [
        {
          use: 'en',
          firstNames: 'Nasreen Pervin',
          familyName: 'Huq'
        }
      ],
      role: 'LOCAL_REGISTRAR'
    },
    type: 'ENTREPENEUR',
    status: 'active'
  },
  {
    id: '5d08e102542c7a19fc55b793',
    name: [
      {
        use: 'en',
        firstNames: 'Nasreen Pervin',
        familyName: 'Huq'
      }
    ],
    username: 'np.huq',
    role: 'STATE_REGISTRAR',
    type: 'MAYOR',
    status: 'deactivated',
    localRegistrar: {
      name: [
        {
          use: 'en',
          firstNames: 'Kazi Nazrul',
          familyName: 'Islam'
        }
      ],
      role: 'LOCAL_REGISTRAR'
    }
  }
]

const graphqlMocksOfDeactivate = [
  {
    request: {
      query: USER_AUDIT_ACTION,
      variables: {
        userId: '5d08e102542c7a19fc55b790',
        action: AUDIT_ACTION.DEACTIVATE,
        reason: 'TERMINATED',
        comment: ''
      }
    },
    result: {
      data: {
        auditUser: true
      }
    }
  },
  {
    request: {
      query: USER_AUDIT_ACTION,
      variables: {
        userId: '5d08e102542c7a19fc55b790',
        action: AUDIT_ACTION.DEACTIVATE,
        reason: 'TERMINATED',
        comment: ''
      }
    },
    result: {
      errors: [new GraphQLError('Error!')]
    }
  }
]

const graphqlMocksOfReactivate = [
  {
    request: {
      query: USER_AUDIT_ACTION,
      variables: {
        userId: '5d08e102542c7a19fc55b793',
        action: AUDIT_ACTION.REACTIVATE,
        reason: 'ROLE_REGAINED',
        comment: ''
      }
    },
    result: {
      data: {
        auditUser: true
      }
    }
  },
  {
    request: {
      query: USER_AUDIT_ACTION,
      variables: {
        userId: '5d08e102542c7a19fc55b793',
        action: AUDIT_ACTION.DEACTIVATE,
        reason: 'ROLE_REGAINED',
        comment: ''
      }
    },
    result: {
      errors: [new GraphQLError('Error!')]
    }
  }
]

describe('user audit action modal tests', () => {
  let component: ReactWrapper<{}, {}>
  let store: AppStore
  let onCloseMock: jest.Mock

  beforeAll(async () => {
    const testStore = await createTestStore()
    store = testStore.store
    onCloseMock = jest.fn()
  })

  afterAll(() => {
    onCloseMock.mockClear()
  })

  describe('in case of successful deactivate audit action', () => {
    beforeEach(async () => {
      let [successMock] = graphqlMocksOfDeactivate
      const testComponent = await createTestComponent(
        <UserAuditActionModal
          show={true}
          user={users[0]}
          onClose={onCloseMock}
        />,
        store,
        [successMock]
      )
      component = testComponent.component

      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      component.update()
    })

    it('renders responsive modal', async () => {
      await waitForElement(component, '#user-audit-modal')
    })

    it('renders title for deactivation', async () => {
      const title = await waitForElement(component, '#user-audit-modal h1')
      expect(title.text()).toBe('Deactivate Rabindranath Tagore?')
    })

    it('renders subtitle for deactivation', async () => {
      const subtitle = await waitForElement(component, '#modal-subtitle')
      expect(subtitle.hostNodes().text()).toBe(
        'This will revoke Rabindranath Tagore’s ability to login and access the system. The account can be reactivated at a later date.'
      )
    })

    it('clicking on confirm action with empty form shows error text', async () => {
      const confirmButton = await waitForElement(
        component,
        '#deactivate-action'
      )
      confirmButton.hostNodes().simulate('click')
      await waitForElement(component, '#form-error')
    })

    describe('after filling mandatory data', () => {
      beforeEach(async () => {
        const terminatedRadioOption = await waitForElement(
          component,
          '#reason_TERMINATED'
        )
        terminatedRadioOption.hostNodes().simulate('change')
      })

      it('clicking confirm action dispatches success notification action', async () => {
        const confirmButton = await waitForElement(
          component,
          '#deactivate-action'
        )
        confirmButton.hostNodes().simulate('click')
        await flushPromises()
        expect(
          store.getState().notification.userAuditSuccessToast.visible
        ).toBe(true)
      })
    })
  })

  describe('in case of failed deactivate audit action', () => {
    beforeEach(async () => {
      let [errorMock] = graphqlMocksOfDeactivate
      component = (
        await createTestComponent(
          <UserAuditActionModal
            show={true}
            user={users[0]}
            onClose={onCloseMock}
          />,
          store,
          [errorMock]
        )
      ).component

      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      component.update()
    })

    describe('after filling mandatory data', () => {
      beforeEach(async () => {
        const terminatedRadioOption = await waitForElement(
          component,
          '#reason_TERMINATED'
        )
        terminatedRadioOption.hostNodes().simulate('change')
      })

      it('clicking confirm action dispatches error notification action', async () => {
        const confirmButton = await waitForElement(
          component,
          '#deactivate-action'
        )
        confirmButton.hostNodes().simulate('click')

        await flushPromises()
        expect(store.getState().notification.submitFormErrorToast).toBe(
          'userFormFail'
        )
      })
    })
  })

  describe('in case of successful reactivate audit action', () => {
    beforeEach(async () => {
      let [successMock] = graphqlMocksOfReactivate
      const testComponent = await createTestComponent(
        <UserAuditActionModal
          show={true}
          user={users[1]}
          onClose={onCloseMock}
        />,
        store,
        [successMock]
      )
      component = testComponent.component

      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      component.update()
    })

    it('renders title for reactivation', async () => {
      const title = await waitForElement(component, '#user-audit-modal h1')
      expect(title.text()).toBe('Reactivate Nasreen Pervin Huq?')
    })

    it('renders subtitle for reactivation', async () => {
      const subtitle = await waitForElement(component, '#modal-subtitle')
      expect(subtitle.hostNodes().text()).toBe(
        'This will reactivate Nasreen Pervin Huq’s ability to login and access the system.'
      )
    })

    describe('after filling mandatory data', () => {
      beforeEach(async () => {
        const roleRegainedRadioOption = await waitForElement(
          component,
          '#reason_ROLE_REGAINED'
        )
        roleRegainedRadioOption.hostNodes().simulate('change')
      })

      it('clicking confirm action dispatches success notification action', async () => {
        const confirmButton = await waitForElement(
          component,
          '#reactivate-action'
        )
        confirmButton.hostNodes().simulate('click')
        await flushPromises()
        expect(
          store.getState().notification.userAuditSuccessToast.visible
        ).toBe(true)
      })
    })
  })

  describe('in case of failed reactivate audit action', () => {
    beforeEach(async () => {
      let [errorMock] = graphqlMocksOfReactivate
      component = (
        await createTestComponent(
          <UserAuditActionModal
            show={true}
            user={users[1]}
            onClose={onCloseMock}
          />,
          store,
          [errorMock]
        )
      ).component

      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      component.update()
    })

    describe('after filling mandatory data', () => {
      beforeEach(async () => {
        const roleRegainedRadioOption = await waitForElement(
          component,
          '#reason_ROLE_REGAINED'
        )
        roleRegainedRadioOption.hostNodes().simulate('change')
      })

      it('clicking confirm action dispatches error notification action', async () => {
        const confirmButton = await waitForElement(
          component,
          '#reactivate-action'
        )
        confirmButton.hostNodes().simulate('click')

        await flushPromises()
        expect(store.getState().notification.submitFormErrorToast).toBe(
          'userFormFail'
        )
      })
    })
  })
})

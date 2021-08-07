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
  createApplication,
  storeApplication,
  IUserData
} from '@client/applications'
import { Event } from '@client/forms'
import { checkAuth } from '@client/profile/profileActions'
import { queries } from '@client/profile/queries'
import { storage } from '@client/storage'
import { createStore } from '@client/store'
import {
  createTestComponent,
  createTestComponentWithApolloClient,
  mockUserResponse,
  flushPromises
} from '@client/tests/util'
import { createClient } from '@client/utils/apolloClient'
import { RegistrationHome } from '@client/views/RegistrationHome/RegistrationHome'
import { Spinner } from '@opencrvs/components/lib/interface'
import { merge } from 'lodash'
import * as React from 'react'

import { waitForElement } from '@client/tests/wait-for-element'
import { SELECTOR_ID } from './tabs/inProgress/inProgressTab'

const registerScopeToken =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6WyJyZWdpc3RlciIsImNlcnRpZnkiLCJkZW1vIl0sImlhdCI6MTU0MjY4ODc3MCwiZXhwIjoxNTQzMjkzNTcwLCJhdWQiOlsib3BlbmNydnM6YXV0aC11c2VyIiwib3BlbmNydnM6dXNlci1tZ250LXVzZXIiLCJvcGVuY3J2czpoZWFydGgtdXNlciIsIm9wZW5jcnZzOmdhdGV3YXktdXNlciIsIm9wZW5jcnZzOm5vdGlmaWNhdGlvbi11c2VyIiwib3BlbmNydnM6d29ya2Zsb3ctdXNlciJdLCJpc3MiOiJvcGVuY3J2czphdXRoLXNlcnZpY2UiLCJzdWIiOiI1YmVhYWY2MDg0ZmRjNDc5MTA3ZjI5OGMifQ.ElQd99Lu7WFX3L_0RecU_Q7-WZClztdNpepo7deNHqzro-Cog4WLN7RW3ZS5PuQtMaiOq1tCb-Fm3h7t4l4KDJgvC11OyT7jD6R2s2OleoRVm3Mcw5LPYuUVHt64lR_moex0x_bCqS72iZmjrjS-fNlnWK5zHfYAjF2PWKceMTGk6wnI9N49f6VwwkinJcwJi6ylsjVkylNbutQZO0qTc7HRP-cBfAzNcKD37FqTRNpVSvHdzQSNcs7oiv3kInDN5aNa2536XSd3H-RiKR9hm9eID9bSIJgFIGzkWRd5jnoYxT70G0t03_mTVnDnqPXDtyI-lmerx24Ost0rQLUNIg'
const getItem = window.localStorage.getItem as jest.Mock
const mockFetchUserDetails = jest.fn()
const mockListSyncController = jest.fn()

const application = {
  id: 'db097901-feba-4f71-a1ae-d3d46289d2d5',
  type: 'Birth',
  registration: {
    status: 'IN_PROGRESS',
    contactNumber: '+8801622688231',
    trackingId: 'BN99CGM',
    registeredLocationId: '425b9cab-6ec3-47b3-bb8b-aee1b1afe4fc',
    createdAt: '1597657903690'
  },
  operationHistories: [
    {
      operationType: 'IN_PROGRESS',
      operatedOn: '2020-08-17T09:51:43.350Z',
      operatorRole: 'FIELD_AGENT',
      operatorName: [
        {
          firstNames: 'Shakib',
          familyName: 'Al Hasan',
          use: 'en'
        },
        {
          firstNames: 'সাকিব',
          familyName: 'হাসান',
          use: 'bn'
        }
      ],
      operatorOfficeName: 'Baniajan Union Parishad',
      operatorOfficeAlias: ['বানিয়াজান ইউনিয়ন পরিষদ']
    }
  ],
  childName: [
    {
      firstNames: 'Shakib',
      familyName: 'Al Hasan',
      use: 'en'
    },
    {
      firstNames: 'সাকিব',
      familyName: 'হাসান',
      use: 'bn'
    }
  ]
}
const currentUserData: IUserData = {
  userID: '123',
  applications: [],
  workqueue: {
    loading: false,
    error: false,
    initialSyncDone: true,
    data: {
      inProgressTab: {
        totalItems: 1,
        results: [application]
      },
      notificationTab: { totalItems: 0, results: [] },
      reviewTab: { totalItems: 0, results: [] },
      rejectTab: { totalItems: 0, results: [] },
      approvalTab: { totalItems: 0, results: [] },
      printTab: { totalItems: 0, results: [] },
      externalValidationTab: { totalItems: 0, results: [] }
    }
  }
}

const nameObj = {
  data: {
    getUser: {
      name: [
        {
          use: 'en',
          firstNames: 'Mohammad',
          familyName: 'Ashraful',
          __typename: 'HumanName'
        },
        { use: 'bn', firstNames: '', familyName: '', __typename: 'HumanName' }
      ],
      role: 'DISTRICT_REGISTRAR'
    }
  }
}
merge(mockUserResponse, nameObj)
mockFetchUserDetails.mockReturnValue(mockUserResponse)
queries.fetchUserDetails = mockFetchUserDetails

storage.getItem = jest.fn()
storage.setItem = jest.fn()

const { store } = createStore()
const client = createClient(store)
beforeAll(async () => {
  getItem.mockReturnValue(registerScopeToken)
  await store.dispatch(checkAuth({ '?token': registerScopeToken }))
})

describe('RegistrationHome related tests', () => {
  it('sets loading state while waiting for data', async () => {
    const testComponent = await createTestComponent(
      // @ts-ignore
      <RegistrationHome
        match={{
          params: {
            tabId: 'progress'
          },
          isExact: true,
          path: '',
          url: ''
        }}
      />,
      store
    )

    // @ts-ignore
    expect(testComponent.component.containsMatchingElement(Spinner)).toBe(true)
  })

  describe('should load data', () => {
    beforeEach(() => {
      mockListSyncController.mockReturnValue({
        data: {
          inProgressTab: { totalItems: 5, results: [] },
          notificationTab: { totalItems: 2, results: [] },
          reviewTab: { totalItems: 3, results: [] },
          rejectTab: { totalItems: 4, results: [] },
          approvalTab: { totalItems: 0, results: [] },
          printTab: { totalItems: 1, results: [] },
          externalValidationTab: { totalItems: 6, results: [] }
        }
      })
      client.query = mockListSyncController
    })
    it('renders page with five tabs', async () => {
      const testComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome match={{ params: { tabId: 'progress' } }} />,
        store,
        client
      )

      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })

      testComponent.component.update()
      const app = testComponent.component
      app
        .find('#tab_progress')
        .hostNodes()
        .simulate('click')
      app
        .find('#tab_review')
        .hostNodes()
        .simulate('click')
      app
        .find('#tab_updates')
        .hostNodes()
        .simulate('click')
      app
        .find('#tab_print')
        .hostNodes()
        .simulate('click')
      app
        .find('#tab_waitingValidation')
        .hostNodes()
        .simulate('click')
    })

    it('renders tabs with count', async () => {
      const testComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome match={{ params: { tabId: 'progress' } }} />,
        store,
        client
      )

      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 600)
      })

      testComponent.component.update()
      const app = testComponent.component
      expect(
        app
          .find('#tab_progress')
          .hostNodes()
          .text()
      ).toContain('In progress (7)')
      expect(
        app
          .find('#tab_review')
          .hostNodes()
          .text()
      ).toContain('Ready for review (3)')
      expect(
        app
          .find('#tab_updates')
          .hostNodes()
          .text()
      ).toContain('Sent for updates (4)')
      expect(
        app
          .find('#tab_waitingValidation')
          .hostNodes()
          .text()
      ).toContain('Waiting for BRIS (6)')
      expect(
        app
          .find('#tab_print')
          .hostNodes()
          .text()
      ).toContain('Ready to print (1)')
    })
  })
  describe('shows no-record message if error there is no data', () => {
    beforeEach(() => {
      mockListSyncController.mockReturnValue({
        data: {
          inProgressTab: { totalItems: 0, results: [] },
          notificationTab: { totalItems: 0, results: [] },
          reviewTab: { totalItems: 0, results: [] },
          rejectTab: { totalItems: 0, results: [] },
          approvalTab: { totalItems: 0, results: [] },
          printTab: { totalItems: 0, results: [] },
          externalValidationTab: { totalItems: 0, results: [] }
        }
      })
      client.query = mockListSyncController
    })
    it('shows no-record message in inProgress drafts tab', async () => {
      const testComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome match={{ params: { tabId: 'progress' } }} />,
        store,
        client
      )
      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      await waitForElement(testComponent.component, '#no-record')
    })
    it('shows no-record message in inProgress fieldagent drafts tab', async () => {
      const testComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome
          match={{
            params: {
              tabId: 'progress',
              selectorId: SELECTOR_ID.fieldAgentDrafts
            },
            isExact: true,
            path: '',
            url: ''
          }}
        />,
        store,
        client
      )
      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      await waitForElement(testComponent.component, '#no-record')
    })
    it('shows no-record message in inProgress hospital drafts tab', async () => {
      const testComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome
          match={{
            params: {
              tabId: 'progress',
              selectorId: SELECTOR_ID.hospitalDrafts
            },
            isExact: true,
            path: '',
            url: ''
          }}
        />,
        store,
        client
      )
      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      await waitForElement(testComponent.component, '#no-record')
    })
    it('shows no-record message  in review tab', async () => {
      const testComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome match={{ params: { tabId: 'review' } }} />,
        store,
        client
      )
      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.component.update()
      await waitForElement(testComponent.component, '#no-record')
    })
    it('shows no-record message  in reject tab', async () => {
      const testComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome match={{ params: { tabId: 'updates' } }} />,
        store,
        client
      )
      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.component.update()
      await waitForElement(testComponent.component, '#no-record')
    })
    it('shows no-record message  in approval tab', async () => {
      const testComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome match={{ params: { tabId: 'approvals' } }} />,
        store,
        client
      )
      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.component.update()
      await waitForElement(testComponent.component, '#no-record')
    })
    it('shows no-record message  in print tab', async () => {
      const testComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome match={{ params: { tabId: 'print' } }} />,
        store,
        client
      )
      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.component.update()
      await waitForElement(testComponent.component, '#no-record')
    })

    it('shows no-record message  in externalValidation tab', async () => {
      const testComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome match={{ params: { tabId: 'waitingValidation' } }} />,
        store,
        client
      )
      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })

      testComponent.component.update()
      await waitForElement(testComponent.component, '#no-record')
    })
  })

  describe('shows error message if error occurs while querying', () => {
    beforeEach(() => {
      mockListSyncController.mockReturnValue({
        error: true
      })
      client.query = mockListSyncController
    })
    it('shows error message in inProgress fieldagent drafts tab', async () => {
      const testComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome
          match={{
            params: {
              tabId: 'progress',
              selectorId: SELECTOR_ID.fieldAgentDrafts
            },
            isExact: true,
            path: '',
            url: ''
          }}
        />,
        store,
        client
      )
      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      await waitForElement(
        testComponent.component,
        '#search-result-error-text-count'
      )
    })
    it('shows error message in inProgress hospital drafts tab', async () => {
      const testComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome
          match={{
            params: {
              tabId: 'progress',
              selectorId: SELECTOR_ID.hospitalDrafts
            },
            isExact: true,
            path: '',
            url: ''
          }}
        />,
        store,
        client
      )
      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      await waitForElement(
        testComponent.component,
        '#search-result-error-text-count'
      )
    })
    it('shows error message  in review tab', async () => {
      const testComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome match={{ params: { tabId: 'review' } }} />,
        store,
        client
      )
      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.component.update()
      await waitForElement(
        testComponent.component,
        '#search-result-error-text-count'
      )
    })
    it('shows error message  in reject tab', async () => {
      const testComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome match={{ params: { tabId: 'updates' } }} />,
        store,
        client
      )
      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.component.update()
      await waitForElement(
        testComponent.component,
        '#search-result-error-text-count'
      )
    })
    it('shows error message  in approval tab', async () => {
      const testComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome match={{ params: { tabId: 'approvals' } }} />,
        store,
        client
      )
      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.component.update()
      await waitForElement(
        testComponent.component,
        '#search-result-error-text-count'
      )
    })
    it('shows error message  in print tab', async () => {
      const testComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome match={{ params: { tabId: 'print' } }} />,
        store,
        client
      )
      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.component.update()
      await waitForElement(
        testComponent.component,
        '#search-result-error-text-count'
      )
    })
    it('shows error message  in externalValidation tab', async () => {
      const testComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome match={{ params: { tabId: 'waitingValidation' } }} />,
        store,
        client
      )
      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.component.update()
      await waitForElement(
        testComponent.component,
        '#search-result-error-text-count'
      )
    })
  })

  describe('when there are items more than 10', () => {
    beforeEach(() => {
      // Mocking storage reading
      // @ts-ignore
      storage.getItem = jest.fn((key: string) => {
        switch (key) {
          case 'USER_DATA':
            return JSON.stringify([currentUserData])
          default:
            return undefined
        }
      })

      mockListSyncController.mockReturnValue({
        data: {
          inProgressTab: { totalItems: 15, results: [application] },
          notificationTab: { totalItems: 12, results: [] },
          reviewTab: { totalItems: 13, results: [] },
          rejectTab: { totalItems: 14, results: [] },
          approvalTab: { totalItems: 10, results: [] },
          printTab: { totalItems: 11, results: [] },
          externalValidationTab: { totalItems: 11, results: [] }
        }
      })
      client.query = mockListSyncController
    })
    it('shows loadmore in progress tab', async () => {
      for (let i = 0; i < 12; i++) {
        await store.dispatch(storeApplication(createApplication(Event.BIRTH)))
      }
      const testComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome match={{ params: { tabId: 'progress' } }} />,
        store,
        client
      ) // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })

      testComponent.component.update()
      await waitForElement(testComponent.component, '#load_more_button')
      testComponent.component
        .find('#load_more_button')
        .last()
        .hostNodes()
        .simulate('click')
    })
    it('shows loadmore in review tab', async () => {
      const testComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome match={{ params: { tabId: 'review' } }} />,
        store,
        client
      )
      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.component.update()
      await waitForElement(testComponent.component, '#load_more_button')
      testComponent.component
        .find('#load_more_button')
        .last()
        .hostNodes()
        .simulate('click')
    })
    it('shows loadmore in reject tab', async () => {
      const testComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome match={{ params: { tabId: 'updates' } }} />,
        store,
        client
      )
      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.component.update()
      await waitForElement(testComponent.component, '#load_more_button')
      testComponent.component
        .find('#load_more_button')
        .last()
        .hostNodes()
        .simulate('click')
    })
    it('shows loadmore in print tab', async () => {
      const testComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome match={{ params: { tabId: 'print' } }} />,
        store,
        client
      )
      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 600)
      })
      testComponent.component.update()
      await waitForElement(testComponent.component, '#load_more_button')
      testComponent.component
        .find('#load_more_button')
        .last()
        .hostNodes()
        .simulate('click')
      await flushPromises()
    })

    it('shows loadmore in externalValidation tab', async () => {
      const testComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome match={{ params: { tabId: 'waitingValidation' } }} />,
        store,
        client
      )

      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.component.update()
      await waitForElement(testComponent.component, '#load_more_button')
      testComponent.component
        .find('#load_more_button')
        .last()
        .hostNodes()
        .simulate('click')
      await flushPromises()
    })
  })
})

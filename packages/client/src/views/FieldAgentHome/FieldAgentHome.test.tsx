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
  SUBMISSION_STATUS
} from '@client/applications'
import { Event } from '@client/forms'
import { checkAuth } from '@client/profile/profileActions'
import { queries } from '@client/profile/queries'
import {
  COUNT_USER_WISE_APPLICATIONS,
  SEARCH_APPLICATIONS_USER_WISE
} from '@client/search/queries'
import { createStore } from '@client/store'
import {
  createTestComponent,
  fieldAgentScopeToken,
  flushPromises,
  getItem,
  mockApplicationData,
  mockUserResponse
} from '@client/tests/util'
import { waitForElement } from '@client/tests/wait-for-element'
import { FIELD_AGENT_ROLES } from '@client/utils/constants'
import { FieldAgentHome } from '@client/views/FieldAgentHome/FieldAgentHome'
import { EVENT_STATUS } from '@client/views/RegistrationHome/RegistrationHome'
import { ReactWrapper } from 'enzyme'
import { merge } from 'lodash'
import * as React from 'react'
import uuid from 'uuid'

const nameObj = {
  data: {
    getUser: {
      name: [
        {
          use: 'en',
          firstNames: 'Sakib',
          familyName: 'Al Hasan',
          __typename: 'HumanName'
        },
        { use: 'bn', firstNames: '', familyName: '', __typename: 'HumanName' }
      ],
      role: FIELD_AGENT_ROLES[0],
      practitionerId: '43ac3486-7df1-4bd9-9b5e-728054ccd6ba'
    }
  }
}

const countQueryGraphqlMock = {
  request: {
    query: COUNT_USER_WISE_APPLICATIONS,
    variables: {
      userId: nameObj.data.getUser.practitionerId,
      status: [EVENT_STATUS.REJECTED],
      locationIds: ['2a83cf14-b959-47f4-8097-f75a75d1867f']
    }
  },
  result: {
    data: {
      searchEvents: {
        totalItems: 1
      }
    }
  }
}

merge(mockUserResponse, nameObj)

describe('FieldAgentHome tests', () => {
  const { store } = createStore()

  beforeAll(async () => {
    ;(queries.fetchUserDetails as jest.Mock).mockReturnValue(mockUserResponse)
    getItem.mockReturnValue(fieldAgentScopeToken)
    await store.dispatch(checkAuth({ '?token': fieldAgentScopeToken }))
  })

  it('renders loading icon while loading page', async () => {
    const testComponent = await createTestComponent(
      // @ts-ignore
      <FieldAgentHome
        match={{
          params: {
            tabId: 'progress'
          },
          isExact: true,
          path: '',
          url: ''
        }}
      />,
      store,
      [{ ...countQueryGraphqlMock, delay: 2000 }]
    )

    testComponent.component.update()
    const app = testComponent.component
    const element = await waitForElement(app, '#field-agent-home-spinner')

    expect(element.hostNodes()).toHaveLength(1)
  })

  it('renders page with three tabs', async () => {
    const testComponent = await createTestComponent(
      // @ts-ignore
      <FieldAgentHome
        match={{
          params: {
            tabId: 'progress'
          },
          isExact: true,
          path: '',
          url: ''
        }}
      />,
      store,
      [countQueryGraphqlMock]
    )

    // wait for mocked data to load mockedProvider
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    testComponent.component.update()
    const app = testComponent.component
    expect(app.find('#top-bar').hostNodes()).toHaveLength(1)
    expect(app.find('#tab_progress').hostNodes()).toHaveLength(1)
    expect(app.find('#tab_review').hostNodes()).toHaveLength(1)
    expect(app.find('#tab_updates').hostNodes()).toHaveLength(1)
  })

  it('when user clicks the floating action button', async () => {
    const testComponent = await createTestComponent(
      // @ts-ignore
      <FieldAgentHome
        match={{
          params: {
            tabId: 'progress'
          },
          isExact: true,
          path: '',
          url: ''
        }}
      />,
      store,
      [countQueryGraphqlMock]
    )

    // wait for mocked data to load mockedProvider
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    testComponent.component.update()
    testComponent.component
      .find('#new_event_declaration')
      .hostNodes()
      .simulate('click')

    expect(window.location.href).toContain('event')
  })

  it('renders require for updates section while on updates tab', async () => {
    const requireUpdatesMock = {
      request: {
        query: SEARCH_APPLICATIONS_USER_WISE,
        variables: {
          userId: nameObj.data.getUser.practitionerId,
          status: [EVENT_STATUS.REJECTED],
          locationIds: ['2a83cf14-b959-47f4-8097-f75a75d1867f'],
          count: 10,
          skip: 0
        }
      },
      result: {
        data: {
          searchEvents: {
            totalItems: 1,
            results: [
              {
                id: '613da949-db8c-49ad-94b4-631ab0b7503e',
                type: 'Birth',
                registration: {
                  contactNumber: '+8801711111111',
                  trackingId: 'BZW3T4',
                  dateOfApplication: '2019-05-22T10:22:21.840Z',
                  status: 'REJECTED'
                },
                operationHistories: [
                  {
                    notificationFacilityAlias: null,
                    notificationFacilityName: null,
                    operatedOn: '2020-01-21T08:41:08.551Z',
                    operationType: 'DECLARED',
                    operatorOfficeName: 'Baniajan Union Parishad',
                    operatorRole: 'FIELD_AGENT',
                    rejectComment: null,
                    rejectReason: null,
                    operatorName: [
                      {
                        familyName: 'Al Hasan',
                        firstNames: 'Shakib',
                        use: 'en'
                      },
                      {
                        familyName: null,
                        firstNames: '',
                        use: 'bn'
                      }
                    ],
                    operatorOfficeAlias: ['বানিয়াজান ইউনিয়ন পরিষদ']
                  },
                  {
                    notificationFacilityAlias: null,
                    notificationFacilityName: null,
                    operatedOn: '2020-01-22T12:54:28.369Z',
                    operationType: 'REJECTED',
                    operatorOfficeName: 'Baniajan Union Parishad',
                    operatorRole: 'LOCAL_REGISTRAR',
                    rejectComment: 'Spelling mistake',
                    rejectReason: 'misspelling',
                    operatorName: [
                      {
                        familyName: 'Ashraful',
                        firstNames: 'Mohammad',
                        use: 'en'
                      },
                      {
                        familyName: null,
                        firstNames: '',
                        use: 'bn'
                      }
                    ],
                    operatorOfficeAlias: ['বানিয়াজান ইউনিয়ন পরিষদ']
                  }
                ],
                childName: [
                  {
                    use: 'en',
                    firstNames: 'Gayatri',
                    familyName: 'Spivak'
                  },
                  {
                    use: 'bn',
                    firstNames: 'গায়ত্রী',
                    familyName: 'স্পিভক'
                  }
                ],
                // TODO: need to remove this once fragement type issue is resolved
                deceasedName: [
                  {
                    use: 'en',
                    firstNames: 'Gayatri',
                    familyName: 'Spivak'
                  },
                  {
                    use: 'bn',
                    firstNames: 'গায়ত্রী',
                    familyName: 'স্পিভক'
                  }
                ]
              }
            ]
          }
        }
      }
    }
    const testComponent = await createTestComponent(
      // @ts-ignore
      <FieldAgentHome
        match={{
          params: {
            tabId: 'updates'
          },
          isExact: true,
          path: '',
          url: ''
        }}
      />,
      store,
      [countQueryGraphqlMock, requireUpdatesMock]
    )

    // wait for mocked data to load mockedProvider
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    testComponent.component.update()
    const app = testComponent.component
    expect(app.find('#require_updates_list').hostNodes()).toHaveLength(1)
  })

  it('render application details page after clicking require for updates applications', async () => {
    const requireUpdatesMock = {
      request: {
        query: SEARCH_APPLICATIONS_USER_WISE,
        variables: {
          userId: nameObj.data.getUser.practitionerId,
          status: [EVENT_STATUS.REJECTED],
          locationIds: ['2a83cf14-b959-47f4-8097-f75a75d1867f'],
          count: 10,
          skip: 0
        }
      },
      result: {
        data: {
          searchEvents: {
            totalItems: 1,
            results: [
              {
                id: '613da949-db8c-49ad-94b4-631ab0b7503e',
                type: 'Birth',
                registration: {
                  contactNumber: '+8801711111111',
                  trackingId: 'BZW3T4',
                  dateOfApplication: '2019-05-22T10:22:21.840Z',
                  status: 'REJECTED'
                },
                operationHistories: [
                  {
                    notificationFacilityAlias: null,
                    notificationFacilityName: null,
                    operatedOn: '2020-01-21T08:41:08.551Z',
                    operationType: 'DECLARED',
                    operatorOfficeName: 'Baniajan Union Parishad',
                    operatorRole: 'FIELD_AGENT',
                    rejectComment: null,
                    rejectReason: null,
                    operatorName: [
                      {
                        familyName: 'Al Hasan',
                        firstNames: 'Shakib',
                        use: 'en'
                      },
                      {
                        familyName: null,
                        firstNames: '',
                        use: 'bn'
                      }
                    ],
                    operatorOfficeAlias: ['বানিয়াজান ইউনিয়ন পরিষদ']
                  },
                  {
                    notificationFacilityAlias: null,
                    notificationFacilityName: null,
                    operatedOn: '2020-01-22T12:54:28.369Z',
                    operationType: 'REJECTED',
                    operatorOfficeName: 'Baniajan Union Parishad',
                    operatorRole: 'LOCAL_REGISTRAR',
                    rejectComment: 'Spelling mistake',
                    rejectReason: 'misspelling',
                    operatorName: [
                      {
                        familyName: 'Ashraful',
                        firstNames: 'Mohammad',
                        use: 'en'
                      },
                      {
                        familyName: null,
                        firstNames: '',
                        use: 'bn'
                      }
                    ],
                    operatorOfficeAlias: ['বানিয়াজান ইউনিয়ন পরিষদ']
                  }
                ],
                childName: [
                  {
                    use: 'en',
                    firstNames: 'Gayatri',
                    familyName: 'Spivak'
                  },
                  {
                    use: 'bn',
                    firstNames: 'গায়ত্রী',
                    familyName: 'স্পিভক'
                  }
                ],
                // TODO: need to remove this once fragement type issue is resolved
                deceasedName: [
                  {
                    use: 'en',
                    firstNames: 'Gayatri',
                    familyName: 'Spivak'
                  },
                  {
                    use: 'bn',
                    firstNames: 'গায়ত্রী',
                    familyName: 'স্পিভক'
                  }
                ]
              }
            ]
          }
        }
      }
    }
    const testComponent = await createTestComponent(
      // @ts-ignore
      <FieldAgentHome
        match={{
          params: {
            tabId: 'updates'
          },
          isExact: true,
          path: '',
          url: ''
        }}
      />,
      store,
      [countQueryGraphqlMock, requireUpdatesMock]
    )

    // wait for mocked data to load mockedProvider
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    testComponent.component.update()
    testComponent.component
      .find('#row_0')
      .hostNodes()
      .simulate('click')

    expect(window.location.href).toContain(
      'details/613da949-db8c-49ad-94b4-631ab0b7503e'
    )
  })

  it('when user clicks the sent for review tab', async () => {
    const testComponent = await createTestComponent(
      // @ts-ignore
      <FieldAgentHome
        match={{
          params: {
            tabId: 'progress'
          },
          isExact: true,
          path: '',
          url: ''
        }}
      />,
      store,
      [countQueryGraphqlMock]
    )

    // wait for mocked data to load mockedProvider
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    testComponent.component.update()
    testComponent.component
      .find('#tab_review')
      .hostNodes()
      .simulate('click')
    await flushPromises()

    testComponent.component.update()
    expect(window.location.href).toContain('field-agent-home/review')
  })

  it('when user clicks the sent for updates tab', async () => {
    const testComponent = await createTestComponent(
      // @ts-ignore
      <FieldAgentHome
        match={{
          params: {
            tabId: 'progress'
          },
          isExact: true,
          path: '',
          url: ''
        }}
      />,
      store,
      [countQueryGraphqlMock]
    )

    // wait for mocked data to load mockedProvider
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    testComponent.component.update()
    testComponent.component
      .find('#tab_updates')
      .hostNodes()
      .simulate('click')
    await flushPromises()

    testComponent.component.update()
    expect(window.location.href).toContain('field-agent-home/updates')
  })

  it('when user clicks the sent for inprogress tab', async () => {
    const testComponent = await createTestComponent(
      // @ts-ignore
      <FieldAgentHome
        match={{
          params: {
            tabId: 'review'
          },
          isExact: true,
          path: '',
          url: ''
        }}
      />,
      store,
      [countQueryGraphqlMock]
    )

    // wait for mocked data to load mockedProvider
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    testComponent.component.update()
    testComponent.component
      .find('#tab_progress')
      .hostNodes()
      .simulate('click')
    await flushPromises()

    testComponent.component.update()
    expect(window.location.href).toContain('field-agent-home/progress')
  })

  describe('when user is in sent for review tab', () => {
    let component: ReactWrapper

    beforeEach(async () => {
      component = (
        await createTestComponent(
          // @ts-ignore
          <FieldAgentHome
            match={{
              params: {
                tabId: 'review'
              },
              isExact: true,
              path: '',
              url: ''
            }}
          />,
          store
        )
      ).component
    })

    it('renders no records text when no data in grid table', async () => {
      const testComponent = await createTestComponent(
        // @ts-ignore
        <FieldAgentHome
          match={{
            params: {
              tabId: 'review'
            },
            isExact: true,
            path: '',
            url: ''
          }}
        />,
        store
      )
      expect(
        testComponent.component.find('#no-record').hostNodes()
      ).toHaveLength(1)
    })

    it('when online renders submission status', () => {
      const readyApplication = {
        id: uuid(),
        data: mockApplicationData,
        event: Event.BIRTH,
        submissionStatus: SUBMISSION_STATUS[SUBMISSION_STATUS.READY_TO_SUBMIT]
      }

      const submittingApplication = {
        id: uuid(),
        data: mockApplicationData,
        event: Event.BIRTH,
        submissionStatus: SUBMISSION_STATUS[SUBMISSION_STATUS.SUBMITTING]
      }

      const submittedApplication = {
        id: uuid(),
        data: mockApplicationData,
        event: Event.BIRTH,
        submissionStatus: SUBMISSION_STATUS[SUBMISSION_STATUS.SUBMITTED]
      }

      const failedApplication = {
        id: uuid(),
        data: mockApplicationData,
        event: Event.BIRTH,
        submissionStatus: SUBMISSION_STATUS[SUBMISSION_STATUS.FAILED]
      }

      store.dispatch(storeApplication(readyApplication))
      store.dispatch(storeApplication(submittingApplication))
      store.dispatch(storeApplication(submittedApplication))
      store.dispatch(storeApplication(failedApplication))

      component.update()
      expect(component.find('#failed0').hostNodes()).toHaveLength(1)
      expect(component.find('#submitted1').hostNodes()).toHaveLength(1)
      expect(component.find('#submitting2').hostNodes()).toHaveLength(1)
      expect(component.find('#waiting3').hostNodes()).toHaveLength(1)
    })

    it('when offline renders pending submission status', async () => {
      Object.defineProperty(window.navigator, 'onLine', { value: false })

      const readyApplication = {
        id: uuid(),
        data: mockApplicationData,
        event: Event.BIRTH,
        submissionStatus: SUBMISSION_STATUS[SUBMISSION_STATUS.READY_TO_SUBMIT]
      }

      store.dispatch(storeApplication(readyApplication))

      const element = await waitForElement(component, '#offline0')

      expect(element.hostNodes()).toHaveLength(1)
    })
  })

  describe('when user is in progress tab', () => {
    let component: ReactWrapper

    beforeEach(async () => {
      component = (
        await createTestComponent(
          // @ts-ignore
          <FieldAgentHome
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
      ).component
    })

    it('renders no records text when no data in grid table', () => {
      expect(component.find('#no-record').hostNodes()).toHaveLength(1)
    })

    it('renders draft application', async () => {
      const draftApplication = createApplication(Event.BIRTH)
      store.dispatch(storeApplication(draftApplication))
      const element = await waitForElement(component, '#row_0')
      expect(element.hostNodes()).toHaveLength(1)
    })
  })
})

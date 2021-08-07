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
  DOWNLOAD_STATUS,
  makeApplicationReadyToDownload,
  storeApplication
} from '@client/applications'
import { Action, Event } from '@client/forms'
import { checkAuth } from '@client/profile/profileActions'
import { queries } from '@client/profile/queries'
import { storage } from '@client/storage'
import { createStore } from '@client/store'
import {
  createTestComponent,
  createTestComponentWithApolloClient,
  mockUserResponse,
  resizeWindow
} from '@client/tests/util'
import { waitForElement } from '@client/tests/wait-for-element'
import { createClient } from '@client/utils/apolloClient'
import { RegistrationHome } from '@client/views/RegistrationHome/RegistrationHome'
import { GridTable } from '@opencrvs/components/lib/interface'
import { ReactWrapper } from 'enzyme'
import { merge } from 'lodash'
import moment from 'moment'
import * as React from 'react'
import { Store } from 'redux'
import { PrintTab } from './printTab'
import {
  GQLBirthEventSearchSet,
  GQLDeathEventSearchSet
} from '@opencrvs/gateway/src/graphql/schema'
import { formattedDuration } from '@client/utils/date-formatting'

const registerScopeToken =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6WyJyZWdpc3RlciIsImNlcnRpZnkiLCJkZW1vIl0sImlhdCI6MTU0MjY4ODc3MCwiZXhwIjoxNTQzMjkzNTcwLCJhdWQiOlsib3BlbmNydnM6YXV0aC11c2VyIiwib3BlbmNydnM6dXNlci1tZ250LXVzZXIiLCJvcGVuY3J2czpoZWFydGgtdXNlciIsIm9wZW5jcnZzOmdhdGV3YXktdXNlciIsIm9wZW5jcnZzOm5vdGlmaWNhdGlvbi11c2VyIiwib3BlbmNydnM6d29ya2Zsb3ctdXNlciJdLCJpc3MiOiJvcGVuY3J2czphdXRoLXNlcnZpY2UiLCJzdWIiOiI1YmVhYWY2MDg0ZmRjNDc5MTA3ZjI5OGMifQ.ElQd99Lu7WFX3L_0RecU_Q7-WZClztdNpepo7deNHqzro-Cog4WLN7RW3ZS5PuQtMaiOq1tCb-Fm3h7t4l4KDJgvC11OyT7jD6R2s2OleoRVm3Mcw5LPYuUVHt64lR_moex0x_bCqS72iZmjrjS-fNlnWK5zHfYAjF2PWKceMTGk6wnI9N49f6VwwkinJcwJi6ylsjVkylNbutQZO0qTc7HRP-cBfAzNcKD37FqTRNpVSvHdzQSNcs7oiv3kInDN5aNa2536XSd3H-RiKR9hm9eID9bSIJgFIGzkWRd5jnoYxT70G0t03_mTVnDnqPXDtyI-lmerx24Ost0rQLUNIg'
const getItem = window.localStorage.getItem as jest.Mock

const mockFetchUserDetails = jest.fn()
const mockListSyncController = jest.fn()

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

const mockUserData = {
  id: '956281c9-1f47-4c26-948a-970dd23c4094',
  type: 'Birth',
  registration: {
    status: 'REGISTERED',
    contactNumber: '01622688231',
    trackingId: 'BW0UTHR',
    registrationNumber: '20190203323443BW0UTHR',
    registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1',
    duplicates: null,
    createdAt: '2018-05-23T14:44:58+02:00',
    modifiedAt: '2018-05-23T14:44:58+02:00'
  },
  dateOfBirth: '2010-10-10',
  childName: [
    {
      firstNames: 'Iliyas',
      familyName: 'Khan',
      use: 'en'
    },
    {
      firstNames: 'ইলিয়াস',
      familyName: 'খান',
      use: 'bn'
    }
  ],
  // TODO: When fragmentMatching work is completed, remove unnecessary result objects
  // PR: https://github.com/opencrvs/opencrvs-core/pull/836/commits/6302fa8f015fe313cbce6197980f1300bf4eba32
  child: {
    id: 'FAKE_ID',
    name: [
      {
        firstNames: 'Iliyas',
        familyName: 'Khan',
        use: 'en'
      },
      {
        firstNames: 'ইলিয়াস',
        familyName: 'খান',
        use: 'bn'
      }
    ],
    birthDate: '2010-10-10'
  },
  deceased: {
    name: [
      {
        use: '',
        firstNames: '',
        familyName: ''
      }
    ],
    deceased: {
      deathDate: ''
    }
  },
  informant: {
    individual: {
      telecom: [
        {
          system: '',
          use: '',
          value: ''
        }
      ]
    }
  },
  dateOfDeath: null,
  deceasedName: null,
  createdAt: '2018-05-23T14:44:58+02:00'
}
const userData: any = []
for (let i = 0; i < 14; i++) {
  userData.push(mockUserData)
}
merge(mockUserResponse, nameObj)
mockFetchUserDetails.mockReturnValue(mockUserResponse)
queries.fetchUserDetails = mockFetchUserDetails

const mockPrintTabData = {
  totalItems: 2,
  results: [
    {
      id: '956281c9-1f47-4c26-948a-970dd23c4094',
      type: 'Death',
      registration: {
        status: 'REGISTERED',
        contactNumber: undefined,
        trackingId: 'DG6PECX',
        registrationNumber: '20196816020000113',
        eventLocationId: undefined,
        registeredLocationId: 'd8cfd240-4b5a-4557-9df7-b1591a11d843',
        duplicates: [null],
        createdAt: '1574696143372',
        modifiedAt: undefined
      },
      operationHistories: [
        {
          operationType: 'REGISTERED',
          operatedOn: '2019-10-20T11:03:20.660Z',
          operatorRole: 'LOCAL_REGISTRAR',
          operatorName: [
            {
              firstNames: 'Mohammad',
              familyName: 'Ashraful',
              use: 'en'
            },
            {
              firstNames: '',
              familyName: null,
              use: 'bn'
            }
          ],
          operatorOfficeName: 'Alokbali Union Parishad',
          operatorOfficeAlias: ['আলোকবালী  ইউনিয়ন পরিষদ']
        }
      ],
      dateOfDeath: '2019-01-18',
      deceasedName: [
        {
          use: 'bn',
          firstNames: 'ক ম আব্দুল্লাহ আল আমিন ',
          familyName: 'খান'
        },
        {
          use: 'en',
          firstNames: 'K M Abdullah al amin',
          familyName: 'Khan'
        }
      ]
    } as GQLDeathEventSearchSet,
    {
      id: 'bc09200d-0160-43b4-9e2b-5b9e90424e95',
      type: 'Death',
      registration: {
        status: 'REGISTERED',
        trackingId: 'DW0UTHR',
        registrationNumber: '2019333494B8I0NEB9',
        eventLocationId: undefined,
        contactNumber: '01622688231',
        duplicates: ['308c35b4-04f8-4664-83f5-9790e790cd33'],
        registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1',
        createdAt: '2007-01-01',
        modifiedAt: '2007-01-01'
      },
      dateOfDeath: '2007-01-01',
      deceasedName: [
        {
          firstNames: 'Iliyas',
          familyName: 'Khan',
          use: 'en'
        },
        {
          firstNames: 'ইলিয়াস',
          familyName: 'খান',
          use: 'bn'
        }
      ]
    } as GQLDeathEventSearchSet
  ]
}

storage.getItem = jest.fn()
storage.setItem = jest.fn()

describe('RegistrarHome ready to print tab related tests', () => {
  const { store, history } = createStore()
  const client = createClient(store)

  beforeAll(async () => {
    getItem.mockReturnValue(registerScopeToken)
    await store.dispatch(checkAuth({ '?token': registerScopeToken }))
  })

  it('renders all items returned from graphql query in ready for print', async () => {
    const TIME_STAMP = '1544188309380'
    Date.now = jest.fn(() => 1554055200000)

    const birthEventSearchSet: GQLBirthEventSearchSet = {
      id: '956281c9-1f47-4c26-948a-970dd23c4094',
      type: 'Birth',
      registration: {
        status: 'REGISTERED',
        contactNumber: '01622688231',
        trackingId: 'BW0UTHR',
        registrationNumber: '2019333494BBONT7U7',
        eventLocationId: undefined,
        registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1',
        duplicates: [null],
        createdAt: TIME_STAMP,
        modifiedAt: TIME_STAMP
      },
      dateOfBirth: '2010-10-10',
      childName: [
        {
          firstNames: 'Iliyas',
          familyName: 'Khan',
          use: 'en'
        },
        {
          firstNames: 'ইলিয়াস',
          familyName: 'খান',
          use: 'bn'
        }
      ]
    }

    const deathEventSearchSet: GQLDeathEventSearchSet = {
      id: 'bc09200d-0160-43b4-9e2b-5b9e90424e95',
      type: 'Death',
      registration: {
        status: 'REGISTERED',
        trackingId: 'DW0UTHR',
        registrationNumber: '2019333494B8I0NEB9',
        eventLocationId: undefined,
        contactNumber: '01622688231',
        duplicates: ['308c35b4-04f8-4664-83f5-9790e790cd33'],
        registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1',
        createdAt: TIME_STAMP,
        modifiedAt: undefined
      },
      dateOfDeath: '2007-01-01',
      deceasedName: [
        {
          firstNames: 'Iliyas',
          familyName: 'Khan',
          use: 'en'
        },
        {
          firstNames: 'ইলিয়াস',
          familyName: 'খান',
          use: 'bn'
        }
      ]
    }

    const testComponent = await createTestComponent(
      // @ts-ignore
      <PrintTab
        registrarLocationId={'2a83cf14-b959-47f4-8097-f75a75d1867f'}
        queryData={{
          data: {
            totalItems: 2,
            results: [birthEventSearchSet, deathEventSearchSet]
          }
        }}
      />,
      store
    )

    const element = await waitForElement(testComponent.component, GridTable)
    const data = element.prop('content')
    const EXPECTED_DATE_OF_APPLICATION = formattedDuration(
      moment(
        moment(TIME_STAMP, 'x').format('YYYY-MM-DD HH:mm:ss'),
        'YYYY-MM-DD HH:mm:ss'
      )
    )

    expect(data.length).toBe(2)
    expect(data[0].id).toBe('956281c9-1f47-4c26-948a-970dd23c4094')
    expect(data[0].dateOfRegistration).toBe(EXPECTED_DATE_OF_APPLICATION)
    expect(data[0].trackingId).toBe('BW0UTHR')
    expect(data[0].event).toBe('Birth')
    expect(data[0].actions).toBeDefined()
  })

  it('returns an empty array incase of invalid graphql query response', async () => {
    Date.now = jest.fn(() => 1554055200000)

    const testComponent = await createTestComponent(
      // @ts-ignore
      <PrintTab
        registrarLocationId={'2a83cf14-b959-47f4-8097-f75a75d1867f'}
        queryData={{
          data: { totalItems: 0, results: [] }
        }}
      />,
      store
    )

    testComponent.component.update()
    const data = testComponent.component.find(GridTable).prop('content')
    expect(data.length).toBe(0)
  })

  it('should show pagination bar if pagination is used and items are more than 11 in ready for print tab', async () => {
    Date.now = jest.fn(() => 1554055200000)

    const testComponent = await createTestComponent(
      // @ts-ignore
      <PrintTab
        registrarLocationId={'2a83cf14-b959-47f4-8097-f75a75d1867f'}
        queryData={{
          data: { totalItems: 14, results: [] }
        }}
        showPaginated={true}
      />,
      store
    )

    const element = await waitForElement(testComponent.component, '#pagination')

    expect(element.hostNodes()).toHaveLength(1)

    testComponent.component
      .find('#pagination button')
      .last()
      .hostNodes()
      .simulate('click')
  })
  it('should show loadmore button if loadmore is used and items are more than 11 in ready for print tab', async () => {
    Date.now = jest.fn(() => 1554055200000)

    const testComponent = await createTestComponent(
      // @ts-ignore
      <PrintTab
        registrarLocationId={'2a83cf14-b959-47f4-8097-f75a75d1867f'}
        queryData={{
          data: { totalItems: 14, results: [] }
        }}
        showPaginated={false}
      />,
      store
    )

    const element = await waitForElement(
      testComponent.component,
      '#load_more_button'
    )

    expect(element.hostNodes()).toHaveLength(1)

    testComponent.component
      .find('#load_more_button')
      .last()
      .hostNodes()
      .simulate('click')
  })

  describe('When a row is expanded', () => {
    let expandedRow: any

    beforeEach(async () => {
      Date.now = jest.fn(() => 1554055200000)

      const testComponent = await createTestComponent(
        // @ts-ignore
        <PrintTab
          registrarLocationId={'2a83cf14-b959-47f4-8097-f75a75d1867f'}
          queryData={{
            data: mockPrintTabData
          }}
        />,
        store
      )

      const instance = (
        await waitForElement(testComponent.component, GridTable)
      ).instance() as any

      instance.toggleExpanded('956281c9-1f47-4c26-948a-970dd23c4094')

      expandedRow = await waitForElement(
        testComponent.component,
        '#REGISTERED-0'
      )
    })

    it('renders expanded area for ready to print', async () => {
      expect(expandedRow.hostNodes().length).toBe(1)
    })

    it('renders correct timestamps for history steps [OCRVS-2214]', async () => {
      expect(
        expandedRow
          .find('#expanded_history_item_timestamp')
          .hostNodes()
          .text()
      ).toBe('Registered on:20 October 2019')
    })
  })

  describe('handles download status', () => {
    let testComponent: ReactWrapper<{}, {}>
    let createdTestComponent: { component: ReactWrapper; store: Store }
    beforeEach(async () => {
      Date.now = jest.fn(() => 1554055200000)
      mockListSyncController
        .mockReturnValueOnce({
          data: {
            inProgressTab: { totalItems: 0, results: [] },
            notificationTab: { totalItems: 0, results: [] },
            reviewTab: { totalItems: 0, results: [] },
            rejectTab: { totalItems: 0, results: [] },
            approvalTab: { totalItems: 0, results: [] },
            printTab: mockPrintTabData,
            externalValidationTab: { totalItems: 0, results: [] }
          }
        })
        .mockReturnValueOnce({
          data: {
            fetchDeathRegistration: {
              _fhirIDMap: {
                composition: '956281c9-1f47-4c26-948a-970dd23c4094'
              },
              id: '956281c9-1f47-4c26-948a-970dd23c4094',
              deceased: {
                id: 'a6cce2e1-10df-42d0-bbc9-8e037b0bf14e',
                name: [
                  {
                    use: 'bn',
                    firstNames: 'ক ম আব্দুল্লাহ আল আমিন ',
                    familyName: 'খান'
                  },
                  {
                    use: 'en',
                    firstNames: 'K M Abdullah al amin',
                    familyName: 'Khan'
                  }
                ],
                birthDate: '1988-06-16',
                gender: 'male',
                maritalStatus: 'MARRIED',
                nationality: ['BGD'],
                identifier: [
                  {
                    id: '1020617910288',
                    type: 'NATIONAL_ID',
                    otherType: null
                  }
                ],
                deceased: {
                  deathDate: '2019-01-18'
                },
                address: [
                  {
                    type: 'PERMANENT',
                    line: [
                      '40 Ward',
                      '',
                      'Bahadur street',
                      'f4d236c5-6328-4e8e-a45b-e307720b7cdf',
                      '',
                      '2612765c-f5a7-4291-9191-7625dd76fa82'
                    ],
                    district: '18dd420e-daec-4d35-9a44-fb58b5185923',
                    state: 'e93b10bc-1318-4dcb-b8b6-35c7532a0a90',
                    city: null,
                    postalCode: '1024',
                    country: 'BGD'
                  },
                  {
                    type: 'CURRENT',
                    line: [
                      '40',
                      '',
                      'My street',
                      'f4d236c5-6328-4e8e-a45b-e307720b7cdf',
                      '',
                      '2612765c-f5a7-4291-9191-7625dd76fa82'
                    ],
                    district: '18dd420e-daec-4d35-9a44-fb58b5185923',
                    state: 'e93b10bc-1318-4dcb-b8b6-35c7532a0a90',
                    city: null,
                    postalCode: '1024',
                    country: 'BGD'
                  }
                ]
              },
              informant: {
                id: 'c7e17721-bccf-4dfb-8f85-d6311d1da1bc',
                relationship: 'OTHER',
                otherRelationship: 'Friend',
                individual: {
                  id: '7ac8d0a6-a391-42f9-add4-dec27279474d',
                  identifier: [
                    {
                      id: '1020607917288',
                      type: 'NATIONAL_ID',
                      otherType: null
                    }
                  ],
                  name: [
                    {
                      use: 'bn',
                      firstNames: 'জামাল উদ্দিন খান',
                      familyName: 'খান'
                    },
                    {
                      use: 'en',
                      firstNames: 'Jamal Uddin Khan',
                      familyName: 'Khan'
                    }
                  ],
                  nationality: ['BGD'],
                  birthDate: '1956-10-17',
                  telecom: null,
                  address: [
                    {
                      type: 'CURRENT',
                      line: [
                        '48',
                        '',
                        'My street',
                        'f4d236c5-6328-4e8e-a45b-e307720b7cdf',
                        '',
                        '2612765c-f5a7-4291-9191-7625dd76fa82'
                      ],
                      district: '18dd420e-daec-4d35-9a44-fb58b5185923',
                      state: 'e93b10bc-1318-4dcb-b8b6-35c7532a0a90',
                      city: null,
                      postalCode: '1024',
                      country: 'BGD'
                    },
                    {
                      type: 'PERMANENT',
                      line: [
                        '40 Ward',
                        '',
                        'Bahadur street',
                        'f4d236c5-6328-4e8e-a45b-e307720b7cdf',
                        '',
                        '2612765c-f5a7-4291-9191-7625dd76fa82'
                      ],
                      district: '18dd420e-daec-4d35-9a44-fb58b5185923',
                      state: 'e93b10bc-1318-4dcb-b8b6-35c7532a0a90',
                      city: null,
                      postalCode: '1024',
                      country: 'BGD'
                    }
                  ]
                }
              },
              father: {
                id: '7ac8d0a6-a391-42f9-add4-dec27279589',
                name: [
                  {
                    use: 'bn',
                    firstNames: 'মোক্তার',
                    familyName: 'আলী'
                  },
                  {
                    use: 'en',
                    firstNames: 'Moktar',
                    familyName: 'Ali'
                  }
                ]
              },
              mother: {
                id: '7ac8d0a6-a391-42f9-add4-decds589',
                name: [
                  {
                    use: 'bn',
                    firstNames: 'মরিউম',
                    familyName: 'আলী'
                  },
                  {
                    use: 'en',
                    firstNames: 'Morium',
                    familyName: 'Ali'
                  }
                ]
              },
              spouse: {
                id: '7ac8d0a6-a391-42f9-add4-sssdec27279589',
                name: [
                  {
                    use: 'bn',
                    firstNames: 'রেহানা',
                    familyName: 'আলী'
                  },
                  {
                    use: 'en',
                    firstNames: 'Rehana',
                    familyName: 'Ali'
                  }
                ]
              },
              registration: {
                id: 'ba1cb210-b98f-46e1-a185-4c8df2971064',
                contact: 'OTHER',
                contactRelationship: 'Colleague',
                contactPhoneNumber: '+8801678945638',
                attachments: null,
                status: [
                  {
                    comments: null,
                    type: 'REGISTERED',
                    location: {
                      name: 'Alokbali',
                      alias: ['আলো্কবালী']
                    },
                    office: {
                      name: 'Alokbali Union Parishad',
                      alias: ['আলোকবালী  ইউনিয়ন পরিষদ'],
                      address: {
                        district: 'Narsingdi',
                        state: 'Dhaka'
                      }
                    },
                    timestamp: null
                  },
                  {
                    comments: null,
                    type: 'DECLARED',
                    location: {
                      name: 'Alokbali',
                      alias: ['আলো্কবালী']
                    },
                    office: {
                      name: 'Alokbali Union Parishad',
                      alias: ['আলোকবালী  ইউনিয়ন পরিষদ'],
                      address: {
                        district: 'Narsingdi',
                        state: 'Dhaka'
                      }
                    },
                    timestamp: null
                  }
                ],
                type: 'DEATH',
                trackingId: 'DG6PECX',
                registrationNumber: '20196816020000113'
              },
              eventLocation: {
                id: '7a503721-a258-49ef-9fb9-aa77c970d19b',
                type: 'PRIVATE_HOME',
                address: {
                  type: null,
                  line: [
                    '40',
                    '',
                    'My street',
                    'f4d236c5-6328-4e8e-a45b-e307720b7cdf',
                    '',
                    '2612765c-f5a7-4291-9191-7625dd76fa82'
                  ],
                  district: '18dd420e-daec-4d35-9a44-fb58b5185923',
                  state: 'e93b10bc-1318-4dcb-b8b6-35c7532a0a90',
                  city: null,
                  postalCode: '1024',
                  country: 'BGD'
                }
              },
              mannerOfDeath: 'HOMICIDE',
              causeOfDeathMethod: null,
              causeOfDeath: 'Chronic Obstructive Pulmonary Disease'
            }
          }
        })
      client.query = mockListSyncController

      createdTestComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome match={{ params: { tabId: 'print' } }} />,
        store,
        client
      )
      testComponent = createdTestComponent.component
    })

    it('downloads application after clicking download button', async () => {
      const downloadButton = await waitForElement(
        testComponent,
        '#ListItemAction-0-icon'
      )

      downloadButton.hostNodes().simulate('click')

      testComponent.update()

      expect(
        testComponent.find('#action-loading-ListItemAction-0').hostNodes()
      ).toHaveLength(1)

      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.update()

      const action = await waitForElement(
        testComponent,
        '#ListItemAction-0-Print'
      )
      action.hostNodes().simulate('click')

      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.update()
      expect(history.location.pathname).toBe(
        '/cert/collector/956281c9-1f47-4c26-948a-970dd23c4094/death/certCollector'
      )
    })

    it('shows error when download is failed', async () => {
      const downloadedApplication = makeApplicationReadyToDownload(
        Event.DEATH,
        'bc09200d-0160-43b4-9e2b-5b9e90424e95',
        Action.LOAD_CERTIFICATE_APPLICATION
      )
      downloadedApplication.downloadStatus = DOWNLOAD_STATUS.FAILED
      createdTestComponent.store.dispatch(
        storeApplication(downloadedApplication)
      )

      testComponent.update()

      const errorIcon = await waitForElement(
        testComponent,
        '#action-error-ListItemAction-1'
      )

      expect(errorIcon.hostNodes()).toHaveLength(1)
    })
  })
})

describe('Tablet tests', () => {
  const { store } = createStore()

  beforeAll(async () => {
    getItem.mockReturnValue(registerScopeToken)
    await store.dispatch(checkAuth({ '?token': registerScopeToken }))
    resizeWindow(800, 1280)
  })

  afterEach(() => {
    resizeWindow(1024, 768)
  })

  it('redirects to detail page if item is clicked', async () => {
    Date.now = jest.fn(() => 1554055200000)

    const testComponent = await createTestComponent(
      // @ts-ignore
      <PrintTab
        registrarLocationId={'2a83cf14-b959-47f4-8097-f75a75d1867f'}
        queryData={{
          data: mockPrintTabData
        }}
      />,
      store
    )

    testComponent.component.update()
    const element = await waitForElement(testComponent.component, '#row_0')
    element.hostNodes().simulate('click')

    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })
    testComponent.component.update()

    expect(window.location.href).toContain(
      '/details/956281c9-1f47-4c26-948a-970dd23c4094'
    )
  })
})

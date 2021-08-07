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
  storeApplication,
  modifyApplication
} from '@client/applications'
import { Action, Event } from '@client/forms'
import { checkAuth } from '@client/profile/profileActions'
import { queries } from '@client/profile/queries'
import { createStore } from '@client/store'
import {
  createTestComponent,
  createTestComponentWithApolloClient,
  mockUserResponse,
  resizeWindow
} from '@client/tests/util'
import { waitForElement, waitFor } from '@client/tests/wait-for-element'
import { createClient } from '@client/utils/apolloClient'
import { REGISTRATION_HOME_QUERY } from '@client/views/RegistrationHome/queries'
import {
  RegistrationHome,
  EVENT_STATUS
} from '@client/views/RegistrationHome/RegistrationHome'
import { Validate } from '@opencrvs/components/lib/icons'
import { GridTable } from '@opencrvs/components/lib/interface'
import ApolloClient from 'apollo-client'
import { ReactWrapper } from 'enzyme'
import { merge } from 'lodash'
import moment from 'moment'
import * as React from 'react'
import { Store } from 'redux'
import { ReviewTab } from './reviewTab'
import {
  GQLBirthEventSearchSet,
  GQLDeathEventSearchSet
} from '@opencrvs/gateway/src/graphql/schema'
import { formattedDuration } from '@client/utils/date-formatting'

const registerScopeToken =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6WyJyZWdpc3RlciIsImNlcnRpZnkiLCJkZW1vIl0sImlhdCI6MTU0MjY4ODc3MCwiZXhwIjoxNTQzMjkzNTcwLCJhdWQiOlsib3BlbmNydnM6YXV0aC11c2VyIiwib3BlbmNydnM6dXNlci1tZ250LXVzZXIiLCJvcGVuY3J2czpoZWFydGgtdXNlciIsIm9wZW5jcnZzOmdhdGV3YXktdXNlciIsIm9wZW5jcnZzOm5vdGlmaWNhdGlvbi11c2VyIiwib3BlbmNydnM6d29ya2Zsb3ctdXNlciJdLCJpc3MiOiJvcGVuY3J2czphdXRoLXNlcnZpY2UiLCJzdWIiOiI1YmVhYWY2MDg0ZmRjNDc5MTA3ZjI5OGMifQ.ElQd99Lu7WFX3L_0RecU_Q7-WZClztdNpepo7deNHqzro-Cog4WLN7RW3ZS5PuQtMaiOq1tCb-Fm3h7t4l4KDJgvC11OyT7jD6R2s2OleoRVm3Mcw5LPYuUVHt64lR_moex0x_bCqS72iZmjrjS-fNlnWK5zHfYAjF2PWKceMTGk6wnI9N49f6VwwkinJcwJi6ylsjVkylNbutQZO0qTc7HRP-cBfAzNcKD37FqTRNpVSvHdzQSNcs7oiv3kInDN5aNa2536XSd3H-RiKR9hm9eID9bSIJgFIGzkWRd5jnoYxT70G0t03_mTVnDnqPXDtyI-lmerx24Ost0rQLUNIg'
const getItem = window.localStorage.getItem as jest.Mock

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

const mockListSyncController = jest.fn()

const mockSearchData = {
  id: 'e302f7c5-ad87-4117-91c1-35eaf2ea7be8',
  type: 'Birth',
  registration: {
    status: 'DECLARED',
    contactNumber: '01622688231',
    trackingId: 'BW0UTHR',
    registrationNumber: null,
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
const searchData: any = []
for (let i = 0; i < 14; i++) {
  searchData.push(mockSearchData)
}
merge(mockUserResponse, nameObj)

const mockReviewTabData = {
  totalItems: 2,
  results: [
    {
      id: '9a55d213-ad9f-4dcd-9418-340f3a7f6269',
      type: 'Birth',
      operationHistories: [
        {
          operationType: 'DECLARED',
          operatedOn: new Date(1544188309380).toISOString(),
          operatorOfficeName: 'Baniajan Union Parishad',
          operatorRole: 'FIELD_AGENT',
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
        }
      ],
      registration: {
        status: 'DECLARED',
        contactNumber: '01622688231',
        trackingId: 'BW0UTHR',
        registrationNumber: undefined,
        eventLocationId: undefined,
        registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1',
        createdAt: '1544188309380',
        modifiedAt: '1544188309380'
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
    } as GQLBirthEventSearchSet,
    {
      id: 'bc09200d-0160-43b4-9e2b-5b9e90424e95',
      type: 'Death',
      registration: {
        status: 'VALIDATED',
        trackingId: 'DW0UTHR',
        registrationNumber: undefined,
        eventLocationId: undefined,
        contactNumber: undefined,
        duplicates: ['308c35b4-04f8-4664-83f5-9790e790cd33'],
        registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1',
        createdAt: '1544188309380',
        modifiedAt: '1544188309380'
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

describe('RegistrationHome sent for review tab related tests', () => {
  let store: ReturnType<typeof createStore>['store']
  let history: ReturnType<typeof createStore>['history']
  let client: ApolloClient<{}>

  beforeEach(async () => {
    ;(queries.fetchUserDetails as jest.Mock).mockReturnValue(mockUserResponse)
    const createdStore = createStore()
    store = createdStore.store
    history = createdStore.history

    client = createClient(store)

    getItem.mockReturnValue(registerScopeToken)
    await store.dispatch(checkAuth({ '?token': registerScopeToken }))
  })

  it('renders all items returned from graphql query in ready for review', async () => {
    const TIME_STAMP = '1544188309380'
    Date.now = jest.fn(() => 1554055200000)

    const testComponent = await createTestComponent(
      // @ts-ignore
      <ReviewTab
        registrarLocationId={'2a83cf14-b959-47f4-8097-f75a75d1867f'}
        queryData={{
          data: mockReviewTabData
        }}
      />,
      store
    )

    const gridTable = await waitForElement(testComponent.component, GridTable)

    const data = gridTable.prop('content')
    const EXPECTED_DATE_OF_APPLICATION = formattedDuration(
      moment(new Date(Number.parseInt(TIME_STAMP)))
    )

    expect(data.length).toBe(2)
    expect(data[0].id).toBe('9a55d213-ad9f-4dcd-9418-340f3a7f6269')
    expect(data[0].eventTimeElapsed).toBe('8 years ago')
    expect(data[0].applicationTimeElapsed).toBe(EXPECTED_DATE_OF_APPLICATION)
    expect(data[0].name).toBe('Iliyas Khan')
    expect(data[0].trackingId).toBe('BW0UTHR')
    expect(data[0].event).toBe('Birth')
    expect(data[0].actions).toBeDefined()
  })

  it('returns an empty array incase of invalid graphql query response', async () => {
    Date.now = jest.fn(() => 1554055200000)

    const testComponent = await createTestComponent(
      // @ts-ignore
      <ReviewTab
        registrarLocationId={'2a83cf14-b959-47f4-8097-f75a75d1867f'}
        queryData={{
          data: {
            totalItems: 12,
            results: []
          }
        }}
      />,
      store
    )

    const gridTable = await waitForElement(testComponent.component, GridTable)
    const data = gridTable.prop('content')
    expect(data.length).toBe(0)
  })

  it('should show pagination bar if pagination is used and items more than 11 in ReviewTab', async () => {
    Date.now = jest.fn(() => 1554055200000)

    const testComponent = await createTestComponent(
      // @ts-ignore
      <ReviewTab
        registrarLocationId={'2a83cf14-b959-47f4-8097-f75a75d1867f'}
        queryData={{
          data: {
            totalItems: 14,
            results: []
          }
        }}
        showPaginated={true}
      />,
      store
    )

    const pagination = await waitForElement(
      testComponent.component,
      '#pagination'
    )

    expect(pagination.hostNodes()).toHaveLength(1)

    testComponent.component
      .find('#pagination button')
      .last()
      .hostNodes()
      .simulate('click')
  })
  it('should show loadmore button if loadmore is used and items more than 11 in ReviewTab', async () => {
    Date.now = jest.fn(() => 1554055200000)

    const testComponent = await createTestComponent(
      // @ts-ignore
      <ReviewTab
        registrarLocationId={'2a83cf14-b959-47f4-8097-f75a75d1867f'}
        queryData={{
          data: {
            totalItems: 14,
            results: []
          }
        }}
        showPaginated={false}
      />,
      store
    )

    const loadmore = await waitForElement(
      testComponent.component,
      '#load_more_button'
    )

    expect(loadmore.hostNodes()).toHaveLength(1)

    testComponent.component
      .find('#load_more_button')
      .last()
      .hostNodes()
      .simulate('click')
  })

  it('renders expanded area for validated status', async () => {
    Date.now = jest.fn(() => 1554055200000)

    const testComponent = await createTestComponent(
      // @ts-ignore
      <ReviewTab
        registrarLocationId={'2a83cf14-b959-47f4-8097-f75a75d1867f'}
        queryData={{
          data: {
            totalItems: 2,
            results: [
              {
                id: 'e302f7c5-ad87-4117-91c1-35eaf2ea7be8',
                type: 'Birth',
                registration: {
                  status: 'DECLARED',
                  contactNumber: '01622688231',
                  trackingId: 'BW0UTHR',
                  registrationNumber: undefined,
                  eventLocationId: undefined,
                  registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1',
                  duplicates: [null],
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
                ]
              } as GQLBirthEventSearchSet,
              {
                id: 'bc09200d-0160-43b4-9e2b-5b9e90424e95',
                type: 'Death',
                registration: {
                  status: 'VALIDATED',
                  trackingId: 'DW0UTHR',
                  registrationNumber: undefined,
                  eventLocationId: undefined,
                  contactNumber: undefined,
                  duplicates: ['308c35b4-04f8-4664-83f5-9790e790cd33'],
                  registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1',
                  createdAt: '2007-01-01',
                  modifiedAt: '2007-01-01'
                },
                operationHistories: [
                  {
                    operationType: 'VALIDATED',
                    operatedOn: '2019-12-12T15:23:21.280Z',
                    operatorRole: 'REGISTRATION_AGENT',
                    operatorName: [
                      {
                        firstNames: 'Tamim',
                        familyName: 'Iqbal',
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
        }}
      />,
      store
    )

    const gridTable = (
      await waitForElement(testComponent.component, GridTable)
    ).instance()

    gridTable.toggleExpanded('bc09200d-0160-43b4-9e2b-5b9e90424e95')

    const element = await waitForElement(
      testComponent.component,
      '#VALIDATED-0'
    )

    expect(element.hostNodes().length).toBe(1)
  })

  it('renders expanded area for declared status', async () => {
    Date.now = jest.fn(() => 1554055200000)

    const testComponent = await createTestComponent(
      // @ts-ignore
      <ReviewTab
        registrarLocationId={'2a83cf14-b959-47f4-8097-f75a75d1867f'}
        queryData={{
          data: {
            totalItems: 2,
            results: [
              {
                id: 'e302f7c5-ad87-4117-91c1-35eaf2ea7be8',
                type: 'Birth',
                registration: {
                  status: 'DECLARED',
                  contactNumber: '01622688231',
                  trackingId: 'BW0UTHR',
                  registrationNumber: undefined,
                  eventLocationId: undefined,
                  registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1',
                  duplicates: [null],
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
                ]
              } as GQLBirthEventSearchSet,
              {
                id: 'bc09200d-0160-43b4-9e2b-5b9e90424e95',
                type: 'Death',
                registration: {
                  status: 'VALIDATED',
                  trackingId: 'DW0UTHR',
                  registrationNumber: undefined,
                  eventLocationId: undefined,
                  contactNumber: undefined,
                  duplicates: ['308c35b4-04f8-4664-83f5-9790e790cd33'],
                  registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1',
                  createdAt: '2007-01-01',
                  modifiedAt: '2007-01-01'
                },
                operationHistories: [
                  {
                    operationType: 'DECLARED',
                    operatedOn: '2019-12-12T15:23:21.280Z',
                    operatorRole: 'FIELD_AGENT',
                    operatorName: [
                      {
                        firstNames: 'Tamim',
                        familyName: 'Iqbal',
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
        }}
      />,
      store
    )

    const instance = (
      await waitForElement(testComponent.component, GridTable)
    ).instance()

    instance.toggleExpanded('bc09200d-0160-43b4-9e2b-5b9e90424e95')

    const element = await waitForElement(testComponent.component, '#DECLARED-0')

    expect(element.hostNodes().length).toBe(1)
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
            reviewTab: mockReviewTabData,
            rejectTab: { totalItems: 0, results: [] },
            approvalTab: { totalItems: 0, results: [] },
            printTab: { totalItems: 0, results: [] },
            externalValidationTab: { totalItems: 0, results: [] }
          },
          initialSyncDone: true
        })
        .mockReturnValueOnce({
          data: {
            fetchBirthRegistration: {
              id: '9a55d213-ad9f-4dcd-9418-340f3a7f6269',
              _fhirIDMap: {
                composition: '9a55d213-ad9f-4dcd-9418-340f3a7f6269',
                encounter: 'dba420af-3d3a-46e3-817d-2fa5c37b7439',
                observation: {
                  birthType: '16643bcf-457a-4a5b-a7d2-328d57182476',
                  weightAtBirth: '13a75fdf-54d3-476e-ab0e-68fca7286686',
                  attendantAtBirth: 'add45cfa-8390-4792-a857-a1df587e45a6',
                  presentAtBirthRegistration:
                    'd43f9c01-bd4f-4df6-b38f-91f7a978a232'
                }
              },
              child: null,
              informant: null,
              primaryCaregiver: null,
              mother: {
                name: [
                  {
                    use: 'bn',
                    firstNames: '',
                    familyName: 'ময়না'
                  },
                  {
                    use: 'en',
                    firstNames: '',
                    familyName: 'Moyna'
                  }
                ],
                birthDate: '2001-01-01',
                maritalStatus: 'MARRIED',
                occupation: 'Mother Occupation',
                dateOfMarriage: '2001-01-01',
                educationalAttainment: 'PRIMARY_ISCED_1',
                nationality: ['BGD'],
                identifier: [{ id: '1233', type: 'PASSPORT', otherType: '' }],
                multipleBirth: 1,
                address: [
                  {
                    type: 'PERMANENT',
                    line: ['12', '', 'union1', 'upazila10'],
                    district: 'district2',
                    state: 'state2',
                    city: '',
                    postalCode: '',
                    country: 'BGD'
                  },
                  {
                    type: 'CURRENT',
                    line: ['12', '', 'union1', 'upazila10'],
                    district: 'district2',
                    state: 'state2',
                    city: '',
                    postalCode: '',
                    country: 'BGD'
                  }
                ],
                telecom: [
                  {
                    system: 'phone',
                    value: '01711111111'
                  }
                ],
                id: '20e9a8d0-907b-4fbd-a318-ec46662bf608'
              },
              father: null,
              registration: {
                id: 'c8dbe751-5916-4e2a-ba95-1733ccf699b6',
                contact: 'MOTHER',
                contactRelationship: 'Contact Relation',
                contactPhoneNumber: '01733333333',
                attachments: null,
                status: [
                  {
                    comments: [
                      {
                        comment: 'This is a note'
                      }
                    ],
                    type: 'DECLARED',
                    timestamp: null
                  }
                ],
                trackingId: 'B123456',
                registrationNumber: null,
                type: 'BIRTH'
              },
              attendantAtBirth: 'NURSE',
              weightAtBirth: 2,
              birthType: 'SINGLE',
              eventLocation: {
                address: {
                  country: 'BGD',
                  state: 'state4',
                  city: '',
                  district: 'district2',
                  postalCode: '',
                  line: ['Rd #10', '', 'Akua', 'union1', '', 'upazila10'],
                  postCode: '1020'
                },
                type: 'PRIVATE_HOME',
                partOf: 'Location/upazila10'
              },
              presentAtBirthRegistration: 'MOTHER_ONLY'
            }
          }
        })
      client.query = mockListSyncController

      createdTestComponent = await createTestComponentWithApolloClient(
        // @ts-ignore
        <RegistrationHome />,
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
        '#ListItemAction-0-Review'
      )
      action.hostNodes().simulate('click')

      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.update()
      expect(history.location.pathname).toBe(
        '/reviews/9a55d213-ad9f-4dcd-9418-340f3a7f6269/events/birth/parent/review'
      )
    })

    it('shows error when download is failed', async () => {
      const downloadedApplication = makeApplicationReadyToDownload(
        Event.DEATH,
        'bc09200d-0160-43b4-9e2b-5b9e90424e95',
        Action.LOAD_REVIEW_APPLICATION
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

  it('check the validate icon', async () => {
    const TIME_STAMP = '1544188309380'
    Date.now = jest.fn(() => 1554055200000)

    const testComponent = await createTestComponent(
      // @ts-ignore
      <ReviewTab
        registrarLocationId={'2a83cf14-b959-47f4-8097-f75a75d1867f'}
        queryData={{
          data: {
            totalItems: 2,
            results: [
              {
                id: 'e302f7c5-ad87-4117-91c1-35eaf2ea7be8',
                type: 'Birth',
                registration: {
                  status: 'VALIDATED',
                  contactNumber: '01622688231',
                  trackingId: 'BW0UTHR',
                  registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1',
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
              } as GQLBirthEventSearchSet,
              {
                id: 'bc09200d-0160-43b4-9e2b-5b9e90424e95',
                type: 'Death',
                registration: {
                  status: 'DECLARED',
                  trackingId: 'DW0UTHR',
                  duplicates: ['308c35b4-04f8-4664-83f5-9790e790cd33'],
                  registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1',
                  createdAt: TIME_STAMP,
                  modifiedAt: TIME_STAMP
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
        }}
      />,
      store
    )

    const validate = await waitForElement(testComponent.component, Validate)

    expect(validate).toHaveLength(1)
  })

  describe.skip('handles download status for possible duplicate application', () => {
    let testComponent: ReactWrapper<{}, {}>
    let createdTestComponent: { component: ReactWrapper; store: Store }
    beforeAll(async () => {
      Date.now = jest.fn(() => 1554055200000)
      const graphqlMock = [
        {
          request: {
            query: REGISTRATION_HOME_QUERY,
            variables: {
              locationIds: ['2a83cf14-b959-47f4-8097-f75a75d1867f'],
              count: 10,
              reviewStatuses: [EVENT_STATUS.DECLARED, EVENT_STATUS.VALIDATED],
              inProgressSkip: 0,
              reviewSkip: 0,
              rejectSkip: 0,
              approvalSkip: 0,
              externalValidationSkip: 0,
              printSkip: 0
            }
          },
          result: {
            data: {
              inProgressTab: { totalItems: 0, results: [] },
              notificationTab: { totalItems: 0, results: [] },
              reviewTab: mockReviewTabData,
              rejectTab: { totalItems: 0, results: [] },
              approvalTab: { totalItems: 0, results: [] },
              externalValidationTab: { totalItems: 0, results: [] },
              printTab: { totalItems: 0, results: [] }
            }
          }
        }
      ]

      createdTestComponent = await createTestComponent(
        // @ts-ignore
        <RegistrationHome />,
        store,
        graphqlMock
      )

      getItem.mockReturnValue(registerScopeToken)
      await createdTestComponent.store.dispatch(
        checkAuth({ '?token': registerScopeToken })
      )
      testComponent = createdTestComponent.component
    })

    it('starts downloading after clicking download button', async () => {
      const downloadButton = await waitForElement(
        testComponent,
        '#ListItemAction-1-icon'
      )

      downloadButton.hostNodes().simulate('click')
      testComponent.update()

      expect(
        testComponent.find('#action-loading-ListItemAction-1').hostNodes()
      ).toHaveLength(1)
    })

    it('shows review button when download is complete', async () => {
      const downloadedApplication = makeApplicationReadyToDownload(
        Event.DEATH,
        'bc09200d-0160-43b4-9e2b-5b9e90424e95',
        Action.LOAD_REVIEW_APPLICATION
      )
      downloadedApplication.downloadStatus = DOWNLOAD_STATUS.DOWNLOADED
      createdTestComponent.store.dispatch(
        modifyApplication(downloadedApplication)
      )

      const action = await waitForElement(
        testComponent,
        '#ListItemAction-1-Review'
      )

      expect(action.hostNodes()).toHaveLength(1)
      action.hostNodes().simulate('click')

      await waitFor(() =>
        window.location.href.includes(
          '/duplicates/bc09200d-0160-43b4-9e2b-5b9e90424e95'
        )
      )
    })

    it('shows error when download is failed', async () => {
      const downloadedApplication = makeApplicationReadyToDownload(
        Event.DEATH,
        'bc09200d-0160-43b4-9e2b-5b9e90424e95',
        Action.LOAD_REVIEW_APPLICATION
      )
      downloadedApplication.downloadStatus = DOWNLOAD_STATUS.FAILED
      createdTestComponent.store.dispatch(
        modifyApplication(downloadedApplication)
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
    resizeWindow(800, 1280)
  })

  afterEach(() => {
    resizeWindow(1024, 768)
  })

  it('redirects to detail page if item is clicked', async () => {
    const TIME_STAMP = '1544188309380'
    Date.now = jest.fn(() => 1554055200000)

    const testComponent = await createTestComponent(
      // @ts-ignore
      <ReviewTab
        registrarLocationId={'2a83cf14-b959-47f4-8097-f75a75d1867f'}
        queryData={{
          data: {
            totalItems: 2,
            results: [
              {
                id: 'e302f7c5-ad87-4117-91c1-35eaf2ea7be8',
                type: 'Birth',
                registration: {
                  status: 'VALIDATED',
                  contactNumber: '01622688231',
                  trackingId: 'BW0UTHR',
                  registrationNumber: undefined,
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
              } as GQLBirthEventSearchSet,
              {
                id: 'bc09200d-0160-43b4-9e2b-5b9e90424e95',
                type: 'Death',
                registration: {
                  status: 'DECLARED',
                  trackingId: 'DW0UTHR',
                  registrationNumber: undefined,
                  eventLocationId: undefined,
                  contactNumber: undefined,
                  duplicates: ['308c35b4-04f8-4664-83f5-9790e790cd33'],
                  registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1',
                  createdAt: TIME_STAMP,
                  modifiedAt: TIME_STAMP
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
        }}
      />,
      store
    )

    getItem.mockReturnValue(registerScopeToken)
    await testComponent.store.dispatch(
      checkAuth({ '?token': registerScopeToken })
    )

    const row = await waitForElement(testComponent.component, '#row_0')
    row.hostNodes().simulate('click')

    expect(window.location.href).toContain(
      '/details/e302f7c5-ad87-4117-91c1-35eaf2ea7be8'
    )
  })
})

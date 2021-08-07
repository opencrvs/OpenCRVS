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
import { GridTable } from '@opencrvs/components/lib/interface'
import {
  createApplication,
  IApplication,
  storeApplication,
  SUBMISSION_STATUS,
  makeApplicationReadyToDownload,
  DOWNLOAD_STATUS,
  modifyApplication
} from '@client/applications'
import { Event, Action } from '@client/forms'
import { formatUrl } from '@client/navigation'
import {
  REGISTRAR_HOME_TAB,
  REVIEW_EVENT_PARENT_FORM_PAGE
} from '@client/navigation/routes'
import { checkAuth } from '@client/profile/profileActions'
import { queries } from '@client/profile/queries'
import { storage } from '@client/storage'
import { createStore } from '@client/store'
import {
  createTestComponent,
  mockUserResponse,
  resizeWindow
} from '@client/tests/util'
import { merge } from 'lodash'
import moment from 'moment'
import * as React from 'react'
import { InProgressTab, SELECTOR_ID, TAB_ID } from './inProgressTab'
import {
  GQLBirthEventSearchSet,
  GQLDeathEventSearchSet
} from '@opencrvs/gateway/src/graphql/schema'
import { waitForElement } from '@client/tests/wait-for-element'
import { formattedDuration } from '@client/utils/date-formatting'

const registerScopeToken =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6WyJyZWdpc3RlciIsInBlcmZvcm1hbmNlIiwiY2VydGlmeSIsImRlbW8iXSwiaWF0IjoxNTYzMzQzMTMzLCJleHAiOjE1NjM5NDc5MzMsImF1ZCI6WyJvcGVuY3J2czphdXRoLXVzZXIiLCJvcGVuY3J2czp1c2VyLW1nbnQtdXNlciIsIm9wZW5jcnZzOmhlYXJ0aC11c2VyIiwib3BlbmNydnM6Z2F0ZXdheS11c2VyIiwib3BlbmNydnM6bm90aWZpY2F0aW9uLXVzZXIiLCJvcGVuY3J2czp3b3JrZmxvdy11c2VyIiwib3BlbmNydnM6c2VhcmNoLXVzZXIiLCJvcGVuY3J2czptZXRyaWNzLXVzZXIiLCJvcGVuY3J2czpyZXNvdXJjZXMtdXNlciJdLCJpc3MiOiJvcGVuY3J2czphdXRoLXNlcnZpY2UiLCJzdWIiOiI1ZDI1ZWM4YTI0YjExMGMyNWEyN2JhNjcifQ.C5v0fboxhawmzrHrO2kzdwfe9pNrF23UedkiPo_4PTBLuS6dm1UgPZWV7SXT9_JVS7djpH2lh-wZ24CR6S-QWI1QgGdvXGrzyUsayJxCdh2FSBnmgLpsD-LTvbDefpmliWzjLk_glbcqeoFX54hwjORZrsH6JMac4GSRRq2vL_Lq7bBUae7IdmB8itoZQLJJHi29bsCvGr3h1njV5BUvQ4N0Q9-w7QAd-ZPjTz4hYf_biFn52fWMwYaxY6_zA5GB6Bm_6ibI8cz14wY4fEME2cv33x4DwVRD8z4UL_Qq14nqWMO5EEf5mb_YKH-wTPl3kUzofngRsMY8cKI_YTr_1Q'
const getItem = window.localStorage.getItem as jest.Mock

const mockFetchUserDetails = jest.fn()

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

const { store, history } = createStore()
beforeAll(async () => {
  getItem.mockReturnValue(registerScopeToken)
  await store.dispatch(checkAuth({ '?token': registerScopeToken }))
})

describe('In Progress tab', () => {
  it('redirects to different route upon selection', async () => {
    const localDrafts = [
      {
        id: '1',
        event: Event.BIRTH,
        data: {}
      },
      {
        id: '2',
        event: Event.BIRTH,
        data: {}
      }
    ]
    const testComponent = await createTestComponent(
      // @ts-ignore
      <InProgressTab
        drafts={localDrafts}
        registrarLocationId={'2a83cf14-b959-47f4-8097-f75a75d1867f'}
        queryData={{
          inProgressData: {},
          notificationData: {}
        }}
      />,
      store
    )

    // wait for mocked data to load mockedProvider
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    testComponent.component.update()
    const app = testComponent.component

    app
      .find(`#selector_${SELECTOR_ID.ownDrafts}`)
      .hostNodes()
      .simulate('click')
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })
    expect(history.location.pathname).toBe(
      formatUrl(REGISTRAR_HOME_TAB, {
        tabId: TAB_ID.inProgress,
        selectorId: SELECTOR_ID.ownDrafts
      })
    )
    app
      .find(`#selector_${SELECTOR_ID.fieldAgentDrafts}`)
      .hostNodes()
      .simulate('click')
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })
    expect(history.location.pathname).toBe(
      formatUrl(REGISTRAR_HOME_TAB, {
        tabId: TAB_ID.inProgress,
        selectorId: SELECTOR_ID.fieldAgentDrafts
      })
    )
  })

  it('renders two selectors with count for each', async () => {
    const localDrafts = [
      {
        id: '1',
        event: Event.BIRTH,
        data: {}
      },
      {
        id: '2',
        event: Event.BIRTH,
        data: {}
      }
    ]

    const testComponent = await createTestComponent(
      // @ts-ignore
      <InProgressTab
        drafts={localDrafts}
        selectorId={'you'}
        registrarLocationId={'2a83cf14-b959-47f4-8097-f75a75d1867f'}
        queryData={{
          inProgressData: { totalItems: 5 },
          notificationData: { totalItems: 3 }
        }}
      />,
      store
    )

    // wait for mocked data to load mockedProvider
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    testComponent.component.update()
    const app = testComponent.component

    expect(
      app
        .find('#selector_you')
        .hostNodes()
        .text()
    ).toContain('Yours (2)')
    expect(
      app
        .find('#selector_field-agents')
        .hostNodes()
        .text()
    ).toContain('Field agents (5)')
  })

  describe('When the local drafts selector is selected', () => {
    it('renders all items returned from local storage in inProgress tab', async () => {
      const { store } = createStore()
      const TIME_STAMP = 1562912635549
      const drafts: IApplication[] = [
        {
          id: 'e302f7c5-ad87-4117-91c1-35eaf2ea7be8',
          data: {
            registration: {
              presentAtBirthRegistration: 'MOTHER_ONLY',
              applicant: 'MOTHER_ONLY',
              registrationPhone: '01722222222',
              whoseContactDetails: 'MOTHER'
            },
            child: {
              firstNamesEng: 'Anik',
              familyNameEng: 'Hoque'
            }
          },
          event: Event.BIRTH,
          submissionStatus: SUBMISSION_STATUS[SUBMISSION_STATUS.DRAFT],
          modifiedOn: TIME_STAMP
        },
        {
          id: 'e6605607-92e0-4625-87d8-c168205bdde7',
          event: Event.BIRTH,
          modifiedOn: TIME_STAMP,
          submissionStatus: SUBMISSION_STATUS[SUBMISSION_STATUS.DRAFT],
          data: {
            registration: {
              presentAtBirthRegistration: 'MOTHER_ONLY',
              applicant: 'MOTHER_ONLY',
              registrationPhone: '01722222222',
              whoseContactDetails: 'MOTHER'
            },
            child: {
              firstNamesEng: 'Anik',
              familyNameEng: 'Hoque'
            }
          }
        },
        {
          id: 'cc66d69c-7f0a-4047-9283-f066571830f1',
          data: {
            deceased: {
              firstNamesEng: 'Anik',
              familyNameEng: 'Hoque'
            }
          },
          event: Event.DEATH,
          submissionStatus: SUBMISSION_STATUS[SUBMISSION_STATUS.DRAFT],
          modifiedOn: TIME_STAMP
        },

        {
          id: '607afa75-4fb0-4785-9388-724911d62809',
          data: {
            deceased: {
              firstNamesEng: 'Anik',
              familyNameEng: 'Hoque'
            }
          },
          event: Event.DEATH,
          submissionStatus: SUBMISSION_STATUS[SUBMISSION_STATUS.DRAFT],
          modifiedOn: TIME_STAMP
        }
      ]
      // @ts-ignore
      const testComponent = await createTestComponent(
        // @ts-ignore
        <InProgressTab
          drafts={drafts}
          selectorId={SELECTOR_ID.ownDrafts}
          registrarLocationId={'2a83cf14-b959-47f4-8097-f75a75d1867f'}
          queryData={{
            inProgressData: {},
            notificationData: {}
          }}
        />,
        store
      )

      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.component.update()
      const data = testComponent.component.find(GridTable).prop('content')
      const EXPECTED_DATE_OF_REJECTION = formattedDuration(moment(TIME_STAMP))

      expect(data[0].id).toBe('e302f7c5-ad87-4117-91c1-35eaf2ea7be8')
      expect(data[0].name).toBe('Anik Hoque')
      expect(data[0].dateOfModification).toBe(EXPECTED_DATE_OF_REJECTION)
      expect(data[0].event).toBe('Birth')
      expect(data[0].actions).toBeDefined()
    })

    it('Should render pagination in progress tab if pagination is used and data is more than 10', async () => {
      jest.clearAllMocks()
      const drafts: IApplication[] = []
      for (let i = 0; i < 12; i++) {
        drafts.push(createApplication(Event.BIRTH))
      }
      const testComponent = await createTestComponent(
        // @ts-ignore
        <InProgressTab
          drafts={drafts}
          selectorId={SELECTOR_ID.ownDrafts}
          registrarLocationId={'2a83cf14-b959-47f4-8097-f75a75d1867f'}
          queryData={{
            inProgressData: {},
            notificationData: {}
          }}
          showPaginated={true}
        />,
        store
      )

      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })

      testComponent.component.update()
      const pagiBtn = testComponent.component.find('#pagination')

      expect(pagiBtn.hostNodes()).toHaveLength(1)
      testComponent.component
        .find('#pagination button')
        .last()
        .hostNodes()
        .simulate('click')
    })

    it('redirects user to draft preview page on update click', async () => {
      const TIME_STAMP = 1562912635549
      const drafts: IApplication[] = [
        {
          id: 'e302f7c5-ad87-4117-91c1-35eaf2ea7be8',
          event: Event.BIRTH,
          modifiedOn: TIME_STAMP,
          submissionStatus: SUBMISSION_STATUS[SUBMISSION_STATUS.DRAFT],
          data: {
            registration: {
              contactPoint: {
                value: 'MOTHER',
                nestedFields: {
                  registrationPhone: '01722222222'
                }
              }
            },
            child: {
              firstNamesEng: 'Anik',
              firstNames: 'অনিক',
              familyNameEng: 'Hoque',
              familyName: 'অনিক'
            }
          }
        },
        {
          id: 'bd22s7c5-ad87-4117-91c1-35eaf2ese32bw',
          event: Event.BIRTH,
          submissionStatus: SUBMISSION_STATUS[SUBMISSION_STATUS.DRAFT],
          data: {
            child: {
              familyNameEng: 'Hoque'
            }
          }
        },
        {
          id: 'e302f7c5-ad87-4117-91c1-35eaf2ea7be9',
          event: Event.BIRTH,
          modifiedOn: TIME_STAMP,
          submissionStatus: SUBMISSION_STATUS[SUBMISSION_STATUS.DRAFT],
          data: {
            child: {
              familyName: 'অনিক'
            }
          }
        },
        {
          id: 'cc66d69c-7f0a-4047-9283-f066571830f1',
          event: Event.DEATH,
          modifiedOn: TIME_STAMP,
          submissionStatus: SUBMISSION_STATUS[SUBMISSION_STATUS.DRAFT],
          data: {
            deceased: {
              firstNamesEng: 'Anik',
              firstNames: 'অনিক',
              familyNameEng: 'Hoque',
              familyName: 'অনিক'
            }
          }
        },
        {
          id: 'cc66d69c-7f0a-4047-9283-f066571830f2',
          event: Event.DEATH,
          modifiedOn: TIME_STAMP,
          submissionStatus: SUBMISSION_STATUS[SUBMISSION_STATUS.DRAFT],
          data: {
            deceased: {
              familyNameEng: 'Hoque'
            }
          }
        },
        {
          id: 'cc66d69c-7f0a-4047-9283-f066571830f3',
          event: Event.DEATH,
          modifiedOn: TIME_STAMP,
          submissionStatus: SUBMISSION_STATUS[SUBMISSION_STATUS.DRAFT],
          data: {
            deceased: {
              familyName: 'অনিক'
            }
          }
        },
        {
          id: 'cc66d69c-7f0a-4047-9283-f066571830f4',
          event: Event.DEATH,
          modifiedOn: TIME_STAMP,
          submissionStatus: SUBMISSION_STATUS[SUBMISSION_STATUS.DRAFT],
          data: {
            '': {}
          }
        }
      ]
      // @ts-ignore
      store.dispatch(storeApplication(drafts))
      const testComponent = await createTestComponent(
        // @ts-ignore
        <InProgressTab
          drafts={drafts}
          selectorId={SELECTOR_ID.ownDrafts}
          registrarLocationId={'2a83cf14-b959-47f4-8097-f75a75d1867f'}
          queryData={{
            inProgressData: {},
            notificationData: {}
          }}
        />,
        store
      )

      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.component.update()
      expect(
        testComponent.component.find('#ListItemAction-0-Update').hostNodes()
      ).toHaveLength(1)
      testComponent.component
        .find('#ListItemAction-0-Update')
        .hostNodes()
        .simulate('click')

      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.component.update()

      expect(history.location.pathname).toContain(
        '/drafts/e302f7c5-ad87-4117-91c1-35eaf2ea7be8'
      )
    })
  })

  describe('When the remote drafts selector is selected', () => {
    it('renders all items returned from graphql query in inProgress tab', async () => {
      const TIME_STAMP = '1562912635549'
      const drafts: IApplication[] = []
      drafts.push(createApplication(Event.BIRTH))
      const testComponent = await createTestComponent(
        // @ts-ignore
        <InProgressTab
          drafts={drafts}
          selectorId={SELECTOR_ID.fieldAgentDrafts}
          registrarLocationId={'0627c48a-c721-4ff9-bc6e-1fba59a2332a'}
          queryData={{
            inProgressData: {
              totalItems: 1,
              results: [
                {
                  id: '956281c9-1f47-4c26-948a-970dd23c4094',
                  type: 'Death',
                  registration: {
                    status: 'IN_PROGRESS',
                    contactNumber: undefined,
                    trackingId: 'DG6PECX',
                    registrationNumber: undefined,
                    eventLocationId: undefined,
                    registeredLocationId:
                      'd8cfd240-4b5a-4557-9df7-b1591a11d843',
                    duplicates: [null],
                    createdAt: TIME_STAMP,
                    modifiedAt: undefined
                  },
                  operationHistories: [
                    {
                      operationType: 'IN_PROGRESS',
                      operatedOn: '2019-10-20T11:03:20.660Z',
                      operatorRole: 'FIELD_AGENT',
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
                } as GQLDeathEventSearchSet
              ]
            },
            notificationData: {}
          }}
        />,
        store
      )

      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.component.update()
      const data = testComponent.component.find(GridTable).prop('content')
      const EXPECTED_DATE_OF_REJECTION = formattedDuration(
        moment(Number(TIME_STAMP))
      )

      expect(data[0].id).toBe('956281c9-1f47-4c26-948a-970dd23c4094')
      expect(data[0].name).toBe('K M Abdullah al amin Khan')
      expect(data[0].dateOfModification).toBe(EXPECTED_DATE_OF_REJECTION)
      expect(data[0].event).toBe('Death')
    })

    it('Should render pagination in progress tab if pagination is used and data is more than 10', async () => {
      jest.clearAllMocks()
      const drafts: IApplication[] = []
      drafts.push(createApplication(Event.BIRTH))
      const testComponent = await createTestComponent(
        // @ts-ignore
        <InProgressTab
          drafts={drafts}
          selectorId={SELECTOR_ID.fieldAgentDrafts}
          registrarLocationId={'0627c48a-c721-4ff9-bc6e-1fba59a2332a'}
          queryData={{
            inProgressData: { totalItems: 12 },
            notificationData: { totalItems: 2 }
          }}
          showPaginated={true}
        />,
        store
      )

      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })

      testComponent.component.update()
      const pagiBtn = testComponent.component.find('#pagination')

      expect(pagiBtn.hostNodes()).toHaveLength(1)
      testComponent.component
        .find('#pagination button')
        .last()
        .hostNodes()
        .simulate('click')
    })

    it('renders expanded area for remote draft data', async () => {
      jest.clearAllMocks()
      const TIME_STAMP = '1562912635549'
      const drafts: IApplication[] = []
      drafts.push(createApplication(Event.BIRTH))
      // @ts-ignore
      const testComponent = await createTestComponent(
        // @ts-ignore
        <InProgressTab
          drafts={drafts}
          selectorId={SELECTOR_ID.hospitalDrafts}
          registrarLocationId={'0627c48a-c721-4ff9-bc6e-1fba59a2332a'}
          queryData={{
            inProgressData: {},
            notificationData: {
              totalItems: 1,
              results: [
                {
                  id: '956281c9-1f47-4c26-948a-970dd23c4094',
                  type: 'Death',
                  registration: {
                    status: 'IN_PROGRESS',
                    contactNumber: undefined,
                    trackingId: 'DG6PECX',
                    registrationNumber: undefined,
                    eventLocationId: undefined,
                    registeredLocationId:
                      'd8cfd240-4b5a-4557-9df7-b1591a11d843',
                    duplicates: [null],
                    createdAt: TIME_STAMP,
                    modifiedAt: undefined
                  },
                  operationHistories: [
                    {
                      operationType: 'IN_PROGRESS',
                      operatedOn: '2019-10-20T11:03:20.660Z',
                      operatorRole: 'FIELD_AGENT',
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
                      operatorOfficeAlias: ['আলোকবালী  ইউনিয়ন পরিষদ'],
                      notificationFacilityName:
                        'Charmadhabpur(bakharnagar) Cc - Narsingdi Sadar',
                      notificationFacilityAlias: [
                        'Charmadhabpur(bakharnagar) Cc - Narsingdi Sadar'
                      ]
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
                } as GQLDeathEventSearchSet
              ]
            }
          }}
        />,
        store
      )

      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.component.update()

      const instance = (
        await waitForElement(testComponent.component, GridTable)
      ).instance()

      instance.toggleExpanded('956281c9-1f47-4c26-948a-970dd23c4094')
      const element = await waitForElement(
        testComponent.component,
        '#IN_PROGRESS-0'
      )
      expect(element.hostNodes().length).toBe(1)
    })

    describe('handles download status', () => {
      const TIME_STAMP = '1562912635549'
      const applicationId = 'e302f7c5-ad87-4117-91c1-35eaf2ea7be8'
      const inprogressProps = {
        drafts: [],
        selectorId: SELECTOR_ID.fieldAgentDrafts,
        registrarLocationId: '0627c48a-c721-4ff9-bc6e-1fba59a2332a',
        queryData: {
          inProgressData: {
            totalItems: 1,
            results: [
              {
                id: applicationId,
                type: 'Birth',
                registration: {
                  trackingId: 'BQ2IDOP',
                  modifiedAt: TIME_STAMP
                },
                childName: [
                  {
                    use: 'en',
                    firstNames: 'Anik',
                    familyName: 'Hoque'
                  }
                ]
              } as GQLBirthEventSearchSet
            ]
          },
          notificationData: {}
        }
      }
      it('renders download button when not downloaded', async () => {
        const downloadableApplication = makeApplicationReadyToDownload(
          Event.BIRTH,
          applicationId,
          Action.LOAD_REVIEW_APPLICATION
        )
        downloadableApplication.downloadStatus = undefined
        store.dispatch(modifyApplication(downloadableApplication))
        const testComponent = await createTestComponent(
          // @ts-ignore
          <InProgressTab {...inprogressProps} />,
          store
        )

        expect(
          testComponent.component.find('#ListItemAction-0-icon').hostNodes()
        ).toHaveLength(1)
      })
      it('renders loading indicator when application is being downloaded', async () => {
        const downloadableApplication = makeApplicationReadyToDownload(
          Event.BIRTH,
          applicationId,
          Action.LOAD_REVIEW_APPLICATION
        )
        downloadableApplication.downloadStatus = DOWNLOAD_STATUS.DOWNLOADING
        store.dispatch(modifyApplication(downloadableApplication))
        const testComponent = await createTestComponent(
          // @ts-ignore
          <InProgressTab {...inprogressProps} />,
          store
        )

        expect(
          testComponent.component
            .find('#action-loading-ListItemAction-0')
            .hostNodes()
        ).toHaveLength(1)
      })
      it('renders update button when download succeeds', async () => {
        const downloadableApplication = makeApplicationReadyToDownload(
          Event.BIRTH,
          applicationId,
          Action.LOAD_REVIEW_APPLICATION
        )
        downloadableApplication.downloadStatus = DOWNLOAD_STATUS.DOWNLOADED
        store.dispatch(modifyApplication(downloadableApplication))
        const testComponent = await createTestComponent(
          // @ts-ignore
          <InProgressTab {...inprogressProps} />,
          store
        )

        expect(
          testComponent.component.find('#ListItemAction-0-Update').hostNodes()
        ).toHaveLength(1)

        testComponent.component
          .find('#ListItemAction-0-Update')
          .hostNodes()
          .simulate('click')

        await new Promise(resolve => {
          setTimeout(resolve, 100)
        })
        testComponent.component.update()

        expect(history.location.pathname).toContain(
          formatUrl(REVIEW_EVENT_PARENT_FORM_PAGE, {
            applicationId,
            pageId: 'review',
            event: 'birth'
          })
        )
      })
      it('renders error when download fails', async () => {
        const downloadableApplication = makeApplicationReadyToDownload(
          Event.BIRTH,
          applicationId,
          Action.LOAD_REVIEW_APPLICATION
        )
        downloadableApplication.downloadStatus = DOWNLOAD_STATUS.FAILED
        store.dispatch(modifyApplication(downloadableApplication))
        const testComponent = await createTestComponent(
          // @ts-ignore
          <InProgressTab {...inprogressProps} />,
          store
        )

        expect(
          testComponent.component
            .find('#action-error-ListItemAction-0')
            .hostNodes()
        ).toHaveLength(1)
      })
    })
  })

  describe('When Notification (Hospital) tab is selected', () => {
    it('Should render all items returned from graphQL', async () => {
      const TIME_STAMP = '1562912635549'
      const drafts: IApplication[] = []
      drafts.push(createApplication(Event.BIRTH))
      const testComponent = await createTestComponent(
        // @ts-ignore
        <InProgressTab
          drafts={drafts}
          selectorId={SELECTOR_ID.hospitalDrafts}
          registrarLocationId={'0627c48a-c721-4ff9-bc6e-1fba59a2332a'}
          queryData={{
            notificationData: {
              totalItems: 2,
              results: [
                {
                  id: 'f0a1ca2c-6a14-4b9e-a627-c3e2e110587e',
                  type: 'Birth',
                  registration: {
                    trackingId: 'BQ2IDOP',
                    modifiedAt: TIME_STAMP
                  },
                  childName: [
                    {
                      use: 'en',
                      firstNames: 'Anik',
                      familyName: 'Hoque'
                    }
                  ]
                } as GQLBirthEventSearchSet,
                {
                  id: '2f7828fd-24ac-49fd-a1fd-53cda4777aa0',
                  type: 'Death',
                  registration: {
                    trackingId: 'DZECJZC',
                    modifiedAt: TIME_STAMP
                  },
                  deceasedName: [
                    {
                      use: 'en',
                      firstNames: 'Anik',
                      familyName: 'Hoque'
                    }
                  ]
                } as GQLDeathEventSearchSet
              ]
            },
            inProgressData: {}
          }}
        />,
        store
      )

      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.component.update()
      const data = testComponent.component.find(GridTable).prop('content')
      const EXPECTED_DATE_OF_REJECTION = formattedDuration(
        moment(Number(TIME_STAMP))
      )

      expect(data[0].id).toBe('f0a1ca2c-6a14-4b9e-a627-c3e2e110587e')
      expect(data[0].name).toBe('Anik Hoque')
      expect(data[0].dateOfModification).toBe(EXPECTED_DATE_OF_REJECTION)
      expect(data[0].event).toBe('Birth')
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
    jest.clearAllMocks()
    const TIME_STAMP = '1562912635549'
    const drafts: IApplication[] = []
    drafts.push(createApplication(Event.BIRTH))
    const applicationId = 'e302f7c5-ad87-4117-91c1-35eaf2ea7be8'

    // @ts-ignore
    const testComponent = await createTestComponent(
      // @ts-ignore
      <InProgressTab
        drafts={drafts}
        selectorId={SELECTOR_ID.fieldAgentDrafts}
        registrarLocationId={'0627c48a-c721-4ff9-bc6e-1fba59a2332a'}
        queryData={{
          inProgressData: {
            totalItems: 1,
            results: [
              {
                id: applicationId,
                type: 'Birth',
                registration: {
                  trackingId: 'BQ2IDOP',
                  modifiedAt: TIME_STAMP
                },
                childName: [
                  {
                    use: 'en',
                    firstNames: 'Anik',
                    familyName: 'Hoque'
                  }
                ]
              } as GQLBirthEventSearchSet
            ]
          },
          notificationData: {}
        }}
      />,
      store
    )

    getItem.mockReturnValue(registerScopeToken)
    await testComponent.store.dispatch(
      checkAuth({ '?token': registerScopeToken })
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

    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })
    testComponent.component.update()

    expect(window.location.href).toContain(
      '/details/e302f7c5-ad87-4117-91c1-35eaf2ea7be8'
    )
  })
})

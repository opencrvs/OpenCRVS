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
  IFormField,
  IFormSectionData,
  ISelectFormFieldWithDynamicOptions,
  ISelectFormFieldWithOptions,
  Section
} from '@client/forms'
import { deserializeFormSection } from '@client/forms/mappings/deserializer'
import { createOrUpdateUserMutation } from '@client/forms/user/fieldDefinitions/mutation/mutations'
import {
  getRolesQuery,
  roleQueries
} from '@client/forms/user/fieldDefinitions/query/queries'
import { userMessages } from '@client/i18n/messages'
import { userQueries } from '@client/user/queries'
import { draftToGqlTransformer } from '@client/transformer'
import {
  ROLE_FIELD_AGENT,
  ROLE_LOCAL_REGISTRAR,
  ROLE_REGISTRATION_AGENT,
  ROLE_TYPE_CHAIRMAN,
  ROLE_TYPE_MAYOR,
  ROLE_TYPE_SECRETARY
} from '@client/utils/constants'
import { GQLRole, GQLUser } from '@opencrvs/gateway/src/graphql/schema'
import { MessageDescriptor } from 'react-intl'
import { messages } from '@client/i18n/messages/views/userSetup'

export enum UserStatus {
  ACTIVE,
  DEACTIVATED,
  PENDING,
  DISABLED
}

export const mockIncompleteFormData = {
  accountDetails: '',
  assignedRegistrationOffice: '',
  device: '',
  familyName: 'হোসেন',
  familyNameEng: 'Hossain',
  firstNames: '',
  firstNamesEng: '',
  nid: '1014881922',
  phoneNumber: '',
  registrationOffice: '895cc945-94a9-4195-9a29-22e9310f3385',
  role: 'FIELD_AGENT',
  userDetails: '',
  username: ''
}

export const mockCompleteFormData = {
  accountDetails: '',
  assignedRegistrationOffice: '',
  device: '',
  familyName: 'হোসেন',
  familyNameEng: 'Hossain',
  firstNames: '',
  firstNamesEng: '',
  nid: '1234567896',
  phoneNumber: '01662132132',
  registrationOffice: '895cc945-94a9-4195-9a29-22e9310f3385',
  role: 'FIELD_AGENT',
  type: 'HOSPITAL',
  userDetails: '',
  username: ''
}

export const mockDataWithRegistarRoleSelected = {
  accountDetails: '',
  assignedRegistrationOffice: '',
  device: '',
  familyName: 'হোসেন',
  familyNameEng: 'Hossain',
  firstNames: '',
  firstNamesEng: '',
  nid: '1014881922',
  phoneNumber: '01662132132',
  registrationOffice: '895cc945-94a9-4195-9a29-22e9310f3385',
  role: 'LOCAL_REGISTRAR',
  type: 'SECRETARY',
  userDetails: '',
  username: '',
  signature: {
    type: 'image/png',
    data:
      'iVBORw0KGgoAAAANSUhEUgAAAAgAAAACCAYAAABllJ3tAAAABHNCSVQICAgIfAhkiAAAABl0RVh0U29mdHdhcmUAZ25vbWUt'
  }
}

export const mockUserGraphqlOperation = {
  request: {
    query: createOrUpdateUserMutation,
    variables: draftToGqlTransformer(
      {
        sections: [
          deserializeFormSection({
            id: 'user' as Section,
            viewType: 'form',
            name: {
              defaultMessage: 'User',
              description: 'The name of the user form',
              id: 'constants.user'
            },
            title: {
              defaultMessage: 'Create new user',
              description: 'The title of user form',
              id: 'form.section.user.title'
            },
            groups: [
              {
                id: 'registration-office',
                title: {
                  defaultMessage: 'Assigned Registration Office',
                  description: 'Assigned Registration Office section',
                  id: 'form.section.assignedRegistrationOffice'
                },
                conditionals: [
                  {
                    action: 'hide',
                    expression:
                      'values.skippedOfficeSelction && values.registrationOffice'
                  }
                ],
                fields: [
                  {
                    name: 'assignedRegistrationOffice',
                    type: 'FIELD_GROUP_TITLE',
                    label: {
                      defaultMessage: 'Assigned registration office',
                      description: 'Assigned Registration Office section',
                      id: 'form.section.assignedRegistrationOfficeGroupTitle'
                    },
                    required: false,
                    hidden: true,
                    initialValue: '',
                    validate: []
                  },
                  {
                    name: 'registrationOffice',
                    type: 'LOCATION_SEARCH_INPUT',
                    label: {
                      defaultMessage: 'Registration Office',
                      description: 'Registration office',
                      id: 'form.field.label.registrationOffice'
                    },
                    required: true,
                    initialValue: '',
                    searchableResource: 'facilities',
                    searchableType: 'CRVS_OFFICE',
                    dispatchOptions: {
                      action: 'USER_FORM/PROCESS_ROLES',
                      payloadKey: 'primaryOfficeId'
                    },
                    locationList: [],
                    validate: [],
                    mapping: {
                      mutation: {
                        operation: 'fieldNameTransformer',
                        parameters: ['primaryOffice']
                      },
                      query: {
                        operation: 'locationIDToFieldTransformer',
                        parameters: ['primaryOffice']
                      }
                    }
                  }
                ]
              },
              {
                id: 'user-view-group',
                fields: [
                  {
                    name: 'userDetails',
                    type: 'FIELD_GROUP_TITLE',
                    label: {
                      defaultMessage: 'User details',
                      description: 'User details section',
                      id: 'form.section.userDetails'
                    },
                    required: false,
                    initialValue: '',
                    validate: []
                  },
                  {
                    name: 'firstNames',
                    type: 'TEXT',
                    label: {
                      defaultMessage: 'Bengali first name',
                      description: 'Bengali first name',
                      id: 'form.field.label.firstNameBN'
                    },
                    required: false,
                    initialValue: '',
                    validate: [{ operation: 'bengaliOnlyNameFormat' }],
                    mapping: {
                      mutation: {
                        operation: 'fieldToNameTransformer',
                        parameters: ['bn']
                      },
                      query: {
                        operation: 'nameToFieldTransformer',
                        parameters: ['bn']
                      }
                    }
                  },
                  {
                    name: 'familyName',
                    type: 'TEXT',
                    label: {
                      defaultMessage: 'Bengali last name',
                      description: 'Bengali last name',
                      id: 'form.field.label.lastNameBN'
                    },
                    required: true,
                    initialValue: '',
                    validate: [{ operation: 'bengaliOnlyNameFormat' }],
                    mapping: {
                      mutation: {
                        operation: 'fieldToNameTransformer',
                        parameters: ['bn']
                      },
                      query: {
                        operation: 'nameToFieldTransformer',
                        parameters: ['bn']
                      }
                    }
                  },
                  {
                    name: 'firstNamesEng',
                    type: 'TEXT',
                    label: {
                      defaultMessage: 'English first name',
                      description: 'English first name',
                      id: 'form.field.label.firstNameEN'
                    },
                    required: false,
                    initialValue: '',
                    validate: [{ operation: 'englishOnlyNameFormat' }],
                    mapping: {
                      mutation: {
                        operation: 'fieldToNameTransformer',
                        parameters: ['en', 'firstNames']
                      },
                      query: {
                        operation: 'nameToFieldTransformer',
                        parameters: ['en', 'firstNames']
                      }
                    }
                  },
                  {
                    name: 'familyNameEng',
                    type: 'TEXT',
                    label: {
                      defaultMessage: 'English last name',
                      description: 'English last name',
                      id: 'form.field.label.lastNameEN'
                    },
                    required: true,
                    initialValue: '',
                    validate: [{ operation: 'englishOnlyNameFormat' }],
                    mapping: {
                      mutation: {
                        operation: 'fieldToNameTransformer',
                        parameters: ['en', 'familyName']
                      },
                      query: {
                        operation: 'nameToFieldTransformer',
                        parameters: ['en', 'familyName']
                      }
                    }
                  },
                  {
                    name: 'phoneNumber',
                    type: 'TEXT',
                    label: {
                      defaultMessage: 'Phone number',
                      description: 'Input label for phone input',
                      id: 'form.field.label.phoneNumber'
                    },
                    required: true,
                    initialValue: '',
                    validate: [{ operation: 'phoneNumberFormat' }],
                    mapping: {
                      mutation: {
                        operation: 'msisdnTransformer',
                        parameters: ['user.mobile']
                      },
                      query: {
                        operation: 'localPhoneTransformer',
                        parameters: ['user.mobile']
                      }
                    }
                  },
                  {
                    name: 'nid',
                    type: 'TEXT',
                    label: {
                      defaultMessage: 'NID',
                      description: 'National ID',
                      id: 'form.field.label.NID'
                    },
                    required: true,
                    initialValue: '',
                    validate: [
                      {
                        operation: 'validIDNumber',
                        parameters: ['NATIONAL_ID']
                      }
                    ],
                    mapping: {
                      mutation: {
                        operation: 'fieldToIdentifierWithTypeTransformer',
                        parameters: ['NATIONAL_ID']
                      },
                      query: {
                        operation: 'identifierWithTypeToFieldTransformer',
                        parameters: ['NATIONAL_ID']
                      }
                    }
                  },
                  {
                    name: 'accountDetails',
                    type: 'FIELD_GROUP_TITLE',
                    label: {
                      defaultMessage: 'Account details',
                      description: 'Account details section',
                      id: 'form.section.accountDetails'
                    },
                    required: false,
                    initialValue: '',
                    validate: []
                  },
                  {
                    name: 'role',
                    type: 'SELECT_WITH_OPTIONS',
                    label: {
                      defaultMessage: 'Role',
                      description: 'Role label',
                      id: 'constants.role'
                    },
                    required: true,
                    initialValue: '',
                    validate: [],
                    options: []
                  },
                  {
                    name: 'type',
                    type: 'SELECT_WITH_DYNAMIC_OPTIONS',
                    label: {
                      defaultMessage: 'Type',
                      description:
                        'Label for type of event in work queue list item',
                      id: 'constants.type'
                    },
                    required: true,
                    initialValue: '',
                    validate: [],
                    dynamicOptions: {
                      dependency: 'role',
                      options: {}
                    }
                  },
                  {
                    name: 'device',
                    type: 'TEXT',
                    label: {
                      defaultMessage: 'Device',
                      description: 'User device',
                      id: 'form.field.label.userDevice'
                    },
                    required: false,
                    initialValue: '',
                    validate: []
                  }
                ]
              },
              {
                id: 'signature-attachment',
                title: {
                  defaultMessage: 'Attach the signature',
                  description: 'Title for user signature attachment',
                  id: 'form.field.label.userSignatureAttachmentTitle'
                },
                conditionals: [
                  {
                    action: 'hide',
                    expression:
                      'values.role!=="LOCAL_REGISTRAR" && values.role!=="REGISTRATION_AGENT"'
                  }
                ],
                fields: [
                  {
                    name: 'attachmentTitle',
                    type: 'FIELD_GROUP_TITLE',
                    hidden: true,
                    label: {
                      defaultMessage: 'Attachments',
                      description: 'label for user signature attachment',
                      id: 'form.field.label.userAttachmentSection'
                    },
                    required: false,
                    initialValue: '',
                    validate: []
                  },
                  {
                    name: 'signature',
                    type: 'SIMPLE_DOCUMENT_UPLOADER',
                    label: {
                      defaultMessage: 'User’s signature',
                      description: 'Input label for user signature attachment',
                      id: 'form.field.label.userSignatureAttachment'
                    },
                    description: {
                      defaultMessage:
                        'Ask the user to sign a piece of paper and then scan or take a photo.',
                      description: 'Description for user signature attachment',
                      id: 'form.field.label.userSignatureAttachmentDesc'
                    },
                    allowedDocType: ['image/png'],
                    initialValue: '',
                    required: false,
                    validate: []
                  }
                ]
              }
            ]
          })
        ]
      },
      { user: mockCompleteFormData }
    )
  },
  result: {
    data: {
      createOrUpdateUserMutation: { username: 'hossain123', __typename: 'User' }
    }
  }
}

export const mockFetchRoleGraphqlOperation = {
  request: {
    query: getRolesQuery,
    variables: {}
  },
  result: {
    data: {
      getRoles: [
        {
          title: 'Field Agent',
          value: 'FIELD_AGENT',
          types: ['HOSPITAL', 'CHA']
        },
        {
          title: 'Registration Agent',
          value: 'REGISTRATION_AGENT',
          types: ['ENTREPENEUR', 'DATA_ENTRY_CLERK']
        },
        {
          title: 'Registrar',
          value: 'LOCAL_REGISTRAR',
          types: ['SECRETARY', 'CHAIRMAN', 'MAYOR']
        },
        {
          title: 'System admin (local)',
          value: 'LOCAL_SYSTEM_ADMIN',
          types: ['LOCAL_SYSTEM_ADMIN']
        },
        {
          title: 'System admin (national)',
          value: 'NATIONAL_SYSTEM_ADMIN',
          types: ['NATIONAL_SYSTEM_ADMIN']
        },
        {
          title: 'Performance Oversight',
          value: 'PERFORMANCE_OVERSIGHT',
          types: ['CABINET_DIVISION', 'BBS']
        },
        {
          title: 'Performance Management',
          value: 'PERFORMANCE_MANAGEMENT',
          types: ['HEALTH_DIVISION', 'ORG_DIVISION']
        }
      ]
    }
  }
}

export const transformRoleDataToDefinitions = (
  fields: IFormField[],
  data: any,
  userFormData: IFormSectionData
): IFormField[] => {
  const roles = data as Array<any>
  const transformTypes = (types: string[]) =>
    types.map(type => ({
      label: userMessages[type],
      value: type
    }))

  return fields.map(field => {
    if (field.name === 'role') {
      if (userFormData && userFormData.role) {
        userFormData.role = ''
      }
      ;(field as ISelectFormFieldWithOptions).options = roles.map(
        ({ value }: { value: string }) => ({
          label: userMessages[value],
          value
        })
      )
      return field
    } else if (field.name === 'type') {
      if (userFormData && userFormData.type) {
        userFormData.type = ''
      }
      ;(field as ISelectFormFieldWithDynamicOptions).dynamicOptions.options = roles.reduce(
        (options, { value, types }) => ({
          ...options,
          [value]: transformTypes(types)
        }),
        {}
      )
      return field
    } else return field
  })
}

export async function alterRolesBasedOnUserRole(primaryOfficeId: string) {
  const roleData = await roleQueries.fetchRoles()
  const userData = await userQueries.searchUsers(primaryOfficeId)
  const roles = roleData.data.getRoles as Array<GQLRole>
  const users = userData.data.searchUsers.results as Array<GQLUser>

  const hasSecretary = users.some(user => user.type === ROLE_TYPE_SECRETARY)
  const hasMayor = users.some(user => user.type === ROLE_TYPE_MAYOR)
  const hasChariman = users.some(user => user.type === ROLE_TYPE_CHAIRMAN)

  const roleList = [] as Array<GQLRole>

  /* eslint-disable array-callback-return */
  roles.map(role => {
    if (
      role.value === ROLE_FIELD_AGENT ||
      role.value === ROLE_REGISTRATION_AGENT
    ) {
      if (hasSecretary && (hasChariman || hasMayor)) {
        roleList.push(role)
      }
    } else if (role.value === ROLE_LOCAL_REGISTRAR) {
      role.types =
        (role.types &&
          role.types.filter(
            (t: string | null) =>
              (t === ROLE_TYPE_SECRETARY && !hasSecretary) ||
              (t === ROLE_TYPE_MAYOR && !hasMayor) ||
              (t === ROLE_TYPE_CHAIRMAN && !hasChariman)
          )) ||
        []
      role.types.length > 0 && roleList.push(role)
    } else {
      roleList.push(role)
    }
  })

  /* eslint-enable array-callback-return */
  return roleList
}

const AuditDescriptionMapping: {
  [key: string]: MessageDescriptor
} = {
  IN_PROGRESS: messages.inProgressAuditAction,
  DECLARED: messages.declaredAuditAction,
  VALIDATED: messages.validatedAuditAction,
  WAITING_VALIDATION: messages.waitingForValidationAuditAction,
  REGISTERED: messages.registeredAuditAction,
  REJECTED: messages.rejectedAuditAction,
  CERTIFIED: messages.certifiedAuditAction
}

export function getUserAuditDescription(
  status: string
): MessageDescriptor | undefined {
  return AuditDescriptionMapping[status] || undefined
}
export function checkExternalValidationStatus(status?: string | null): boolean {
  return !(
    !window.config.EXTERNAL_VALIDATION_WORKQUEUE &&
    status === 'WAITING_VALIDATION'
  )
}
export function checkIfLocalLanguageProvided() {
  return window.config.LANGUAGES.split(',').length > 1
}

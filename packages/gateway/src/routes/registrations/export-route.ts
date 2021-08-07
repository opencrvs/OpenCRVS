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
import * as Joi from 'joi'
import * as Hapi from '@hapi/hapi'
import { graphql } from 'graphql'
import { getExecutableSchema } from '@gateway/graphql/config'
import * as stringify from 'csv-stringify'
import * as flatten from 'flat'
import * as archiver from 'archiver'
import { unauthorized } from '@hapi/boom'
import { omit } from 'lodash'
import {
  GQLBirthRegistration,
  GQLDeathRegistration,
  GQLPerson,
  GQLHumanName,
  GQLIdentityType,
  GQLAddress,
  GQLRegistration,
  GQLAttachment,
  GQLRegWorkflow
} from '@gateway/graphql/schema'

export default {
  method: 'GET',
  path: '/registrations/export',
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    const auth = request.auth as Hapi.RequestAuth & {
      token: string
    }

    if (!auth.credentials.scope?.includes('sysadmin')) {
      throw unauthorized()
    }

    const query = request.query as {
      fromDate: string
      toDate: string
    }

    const response = await graphql(
      getExecutableSchema(),
      `
        query data($fromDate: Date!, $toDate: Date!) {
          searchBirthRegistrations(fromDate: $fromDate, toDate: $toDate) {
            id
            child {
              multipleBirth
              name {
                use
                firstNames
                familyName
              }
              birthDate
              gender
            }
            mother {
              name {
                use
                firstNames
                familyName
              }
              birthDate
              maritalStatus
              dateOfMarriage
              educationalAttainment
              nationality
              identifier {
                id
                type
              }
              address {
                type
                lineName
                districtName
                stateName
                city
                postalCode
                country
              }
              telecom {
                system
                value
              }
            }
            father {
              id
              name {
                use
                firstNames
                familyName
              }
              birthDate
              maritalStatus
              dateOfMarriage
              educationalAttainment
              nationality
              identifier {
                id
                type
              }
              address {
                type
                lineName
                districtName
                stateName
                city
                postalCode
                country
              }
              telecom {
                system
                value
              }
            }
            informant {
              id
              individual {
                id
                identifier {
                  id
                  type
                }
                name {
                  use
                  firstNames
                  familyName
                }
                nationality
                birthDate
                address {
                  type
                  lineName
                  districtName
                  stateName
                  city
                  postalCode
                  country
                }
              }
            }
            primaryCaregiver {
              parentDetailsType
              primaryCaregiver {
                name {
                  use
                  firstNames
                  familyName
                }
                telecom {
                  system
                  value
                  use
                }
              }
              reasonsNotApplying {
                primaryCaregiverType
                reasonNotApplying
                isDeceased
              }
            }
            registration {
              id
              contact
              contactPhoneNumber
              attachments {
                data
                type
                contentType
                subject
              }
              status {
                comments {
                  comment
                }
                type
                timestamp
                location {
                  name
                  alias
                }
                user {
                  name {
                    use
                    firstNames
                    familyName
                  }
                  role
                }
                timeLogged
                office {
                  name
                  alias
                  address {
                    districtName
                    stateName
                  }
                }
              }
              trackingId
              registrationNumber
            }
            attendantAtBirth
            weightAtBirth
            birthType
            eventLocation {
              type
              address {
                lineName
                districtName
                stateName
                city
                postalCode
                country
              }
            }
            presentAtBirthRegistration
          }

          searchDeathRegistrations(fromDate: $fromDate, toDate: $toDate) {
            id
            deceased {
              name {
                use
                firstNames
                familyName
              }
              birthDate
              gender
              maritalStatus
              nationality
              identifier {
                id
                type
              }
              gender
              deceased {
                deathDate
              }
              address {
                type
                lineName
                districtName
                stateName
                city
                postalCode
                country
              }
            }
            informant {
              relationship
              otherRelationship
              individual {
                identifier {
                  id
                  type
                }
                name {
                  use
                  firstNames
                  familyName
                }
                nationality
                birthDate
                telecom {
                  system
                  value
                }
                address {
                  type
                  lineName
                  districtName
                  stateName
                  city
                  postalCode
                  country
                }
              }
            }
            father {
              name {
                use
                firstNames
                familyName
              }
            }
            mother {
              name {
                use
                firstNames
                familyName
              }
            }
            spouse {
              name {
                use
                firstNames
                familyName
              }
            }
            registration {
              contact
              contactRelationship
              contactPhoneNumber
              attachments {
                data
                type
                contentType
                subject
              }
              status {
                comments {
                  comment
                }
                type
                timestamp
                location {
                  name
                  alias
                }
                user {
                  name {
                    use
                    firstNames
                    familyName
                  }
                  role
                }
                timeLogged
                office {
                  name
                  alias
                  address {
                    districtName
                    stateName
                  }
                }
              }
              type
              trackingId
              registrationNumber
            }
            eventLocation {
              type
              address {
                type
                lineName
                districtName
                stateName
                city
                postalCode
                country
              }
            }
            mannerOfDeath
            causeOfDeath
          }
        }
      `,
      undefined,
      { Authorization: `Bearer ${auth.token}` },
      {
        fromDate: query.fromDate,
        toDate: query.toDate
      }
    )

    if (response.errors?.length) {
      throw response.errors[0]
    }

    // Process birth registrations
    const birthRows = (response?.data?.searchBirthRegistrations ?? []).map(
      (result: GQLBirthRegistration) => {
        result.child = flattenPerson(result.child)
        result.mother = flattenPerson(result.mother)
        result.father = flattenPerson(result.father)
        if (result.informant && result.informant.individual) {
          result.informant.individual = flattenPerson(
            result.informant.individual
          )
        }
        if (
          result.primaryCaregiver &&
          result.primaryCaregiver.primaryCaregiver
        ) {
          result.primaryCaregiver.primaryCaregiver = flattenPerson(
            result.primaryCaregiver.primaryCaregiver
          )
        }
        result.registration = flattenRegistration(result.registration)

        return flatten(result)
      }
    )
    const birthCSV = stringify(birthRows, {
      header: true
    })

    // Process death registrations
    const deathRows = (response?.data?.searchDeathRegistrations ?? []).map(
      (result: GQLDeathRegistration) => {
        result.deceased = flattenPerson(result.deceased)
        result.mother = flattenPerson(result.mother)
        result.father = flattenPerson(result.father)
        result.spouse = flattenPerson(result.spouse)
        if (result.informant && result.informant.individual) {
          result.informant.individual = flattenPerson(
            result.informant.individual
          )
        }
        result.registration = flattenRegistration(result.registration)
        return flatten(result)
      }
    )
    const deathCSV = stringify(deathRows, {
      header: true
    })

    // Create the archive
    const archive = archiver('zip', {
      // Sets the compression level.
      zlib: { level: 9 }
    })
    archive.append(birthCSV, { name: 'birth-registrations.csv' })
    archive.append(deathCSV, { name: 'death-registrations.csv' })
    archive.finalize()

    return archive
  },
  config: {
    tags: ['api'],
    validate: {
      query: Joi.object({
        fromDate: Joi.date(),
        toDate: Joi.date(),
        token: Joi.string()
      })
    },
    description:
      'Exports both birth and death registrations from the selected time period as a CSV'
  }
}

function flattenPerson(personData: GQLPerson | undefined) {
  if (!personData) {
    return
  }
  return {
    ...omit(personData, ['name', 'identifier', 'address']),
    ...flattenArray(personData.name, 'name', 'use'),
    ...flattenArray(personData.identifier, 'identifier', 'type'),
    ...flattenArray(personData.address, 'address', 'type')
  }
}

function flattenRegistration(registrationData: GQLRegistration | undefined) {
  if (!registrationData) {
    return
  }
  return {
    ...omit(registrationData, ['attachments', 'status']),
    ...flattenArray(registrationData.attachments, 'attachments', 'type'),
    ...flattenArray(registrationData.status, 'status', 'type')
  }
}

function flattenArray(
  dataArray:
    | (
        | GQLHumanName
        | GQLIdentityType
        | GQLAddress
        | GQLAttachment
        | GQLRegWorkflow
        | null
      )[]
    | undefined,
  arrayPoperty: string,
  filterProperty: string
) {
  if (!dataArray || dataArray.length <= 0) {
    return {}
  }
  const flattenArrayData: any = {}
  dataArray.forEach(data => {
    if (data === null) {
      return
    }
    flattenArrayData[`${arrayPoperty}_${data[filterProperty]}`] = omit(
      data,
      filterProperty
    )
  })
  return flattenArrayData
}

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.
 */
import {
  Bundle,
  BundleEntry,
  DocumentReference,
  Extension,
  PaymentReconciliation,
  Practitioner,
  Task,
  URNReference,
  SavedTask,
  Composition,
  SavedComposition,
  isComposition,
  SavedBundle,
  Resource,
  urlReferenceToUUID,
  ValidRecord,
  resourceIdentifierToUUID,
  isEncounter,
  isRelatedPerson,
  Encounter,
  RelatedPerson,
  BundleEntryWithFullUrl as MaybeSavedBundleEntryWithFullUrl,
  RegisteredRecord,
  CertifiedRecord,
  Patient,
  findCompositionSection,
  getComposition,
  EVENT_TYPE,
  TaskStatus,
  getStatusFromTask,
  SavedPractitioner,
  SavedLocation,
  SavedRelatedPerson,
  isURNReference,
  SavedEncounter,
  resourceToSavedBundleEntry,
  ResourceIdentifier,
  isTask,
  urlReferenceToResourceIdentifier,
  RegistrationStatus,
  getResourceFromBundleById,
  TransactionResponse,
  TaskIdentifierSystem,
  Location,
  PractitionerRole,
  URLReference
} from '@opencrvs/commons/types'
import { FHIR_URL } from '@workflow/constants'
import fetch from 'node-fetch'
import { getTokenPayload, getUUID, UUID } from '@opencrvs/commons'
import { MAKE_CORRECTION_EXTENSION_URL } from '@workflow/features/task/fhir/constants'
import {
  ApproveRequestInput,
  CorrectionRequestInput,
  PaymentInput,
  ChangedValuesInput,
  CertifyInput
} from '@workflow/records/validations'
import { badRequest, internal } from '@hapi/boom'
import { getUserOrSystem, isSystem } from './user'
import {
  getLoggedInPractitionerResource,
  getPractitionerOfficeId,
  getPractitionerRoleByPractitionerId,
  getUser
} from '@workflow/features/user/utils'
import { z } from 'zod'
import { fetchLocationHierarchy } from '@workflow/utils/location'

function getFHIRValueField(value: unknown) {
  if (typeof value === 'string') {
    return { valueString: value }
  }

  if (typeof value === 'number') {
    return { valueInteger: value }
  }

  if (typeof value === 'boolean') {
    return { valueBoolean: value }
  }

  throw new Error('Invalid value type')
}

export async function mergeChangedResourcesIntoRecord(
  record: ValidRecord,
  unsavedChangedResources: Bundle,
  practitionerResourcesBundle: SavedBundle<SavedLocation | SavedPractitioner>
) {
  const responseBundle = await sendBundleToHearth(unsavedChangedResources)

  const changedResources = toSavedBundle(
    unsavedChangedResources,
    responseBundle
  )

  const recordWithChangedResources = mergeBundles(record, changedResources)

  return mergeBundles(recordWithChangedResources, practitionerResourcesBundle)
}

export async function withPractitionerDetails<T extends Task>(
  task: T,
  token: string
): Promise<[T, SavedBundle<SavedLocation | SavedPractitioner>]> {
  const userOrSystem = await getUserOrSystem(token)
  const newTask: T = {
    ...task,
    identifier: task.identifier.filter(
      ({ system }) =>
        system !== 'http://opencrvs.org/specs/id/system_identifier'
    ),
    requester: {
      agent: { reference: `Practitioner/${userOrSystem.practitionerId}` }
    }
  }
  if (isSystem(userOrSystem)) {
    const { name, username, type } = userOrSystem
    newTask.identifier.push({
      system: 'http://opencrvs.org/specs/id/system_identifier',
      value: JSON.stringify({
        name,
        username,
        type
      })
    })
    // return [
    //   newTask,
    //   {
    //     type: 'document',
    //     resourceType: 'Bundle',
    //     entry: []
    //   }
    // ]
  }
  const user = userOrSystem
  const practitioner = await getLoggedInPractitionerResource(token)
  const practitionerOfficeId = await getPractitionerOfficeId(practitioner.id)
  const hierarchy = await fetchLocationHierarchy(practitionerOfficeId)

  newTask.extension.push(
    ...([
      {
        url: 'http://opencrvs.org/specs/extension/regLastUser',
        valueReference: {
          reference: `Practitioner/${user.practitionerId as UUID}`
        }
      },
      {
        url: 'http://opencrvs.org/specs/extension/regLastOffice',
        valueReference: {
          reference: `Location/${practitionerOfficeId}`
        }
      }
    ] satisfies Task['extension'])
  )
  return [
    newTask,
    {
      type: 'document',
      resourceType: 'Bundle',
      entry: [practitioner, ...hierarchy].map((r) =>
        resourceToSavedBundleEntry(r)
      )
    }
  ]
}

export function createCorrectionProofOfLegalCorrectionDocument(
  subjectReference: URNReference,
  attachmentURL: string,
  attachmentType: string
): BundleEntry<DocumentReference> {
  const temporaryDocumentReferenceId = getUUID()
  return {
    fullUrl: `urn:uuid:${temporaryDocumentReferenceId}`,
    resource: {
      resourceType: 'DocumentReference',
      masterIdentifier: {
        value: temporaryDocumentReferenceId,
        system: 'urn:ietf:rfc:3986'
      },
      status: 'current',
      subject: {
        reference: subjectReference
      },
      type: {
        coding: [
          {
            system: 'http://opencrvs.org/specs/documentType',
            code: attachmentType
          }
        ]
      },
      content: [
        {
          attachment: {
            contentType: 'image/jpg',
            data: attachmentURL
          }
        }
      ],
      identifier: []
    }
  }
}

export function createDocumentReferenceEntryForCertificate(
  temporaryDocumentReferenceId: UUID,
  temporaryRelatedPersonId: UUID,
  eventType: EVENT_TYPE,
  hasShowedVerifiedDocument: boolean,
  certifierReference?: ResourceIdentifier,
  certificateTemplateId?: string,
  paymentUrl?: URNReference | ResourceIdentifier
): BundleEntry<DocumentReference> {
  return {
    fullUrl: `urn:uuid:${temporaryDocumentReferenceId}`,
    resource: {
      resourceType: 'DocumentReference',
      masterIdentifier: {
        system: 'urn:ietf:rfc:3986',
        value: temporaryDocumentReferenceId
      },
      extension: [
        {
          url: 'http://opencrvs.org/specs/extension/collector',
          valueReference: {
            reference: `urn:uuid:${temporaryRelatedPersonId}`
          }
        },
        ...(certifierReference
          ? [
              {
                url: 'http://opencrvs.org/specs/extension/certifier' as const,
                valueReference: {
                  reference: certifierReference
                }
              }
            ]
          : []),
        {
          url: 'http://opencrvs.org/specs/extension/hasShowedVerifiedDocument',
          valueBoolean: hasShowedVerifiedDocument
        },
        {
          url: 'http://opencrvs.org/specs/extension/certificateTemplateId',
          valueString: certificateTemplateId
        },
        ...(paymentUrl
          ? [
              {
                url: 'http://opencrvs.org/specs/extension/payment' as const,
                valueReference: {
                  reference: paymentUrl
                }
              }
            ]
          : [])
      ],
      type: {
        coding: [
          {
            system: 'http://opencrvs.org/specs/certificate-type',
            code: eventType
          }
        ]
      },
      content: [],
      status: 'current'
    }
  }
}

function findPatientReferenceFromRelatedPerson(
  record: RegisteredRecord | CertifiedRecord,
  relatedPesonReference: ResourceIdentifier
): ResourceIdentifier {
  return getResourceFromBundleById<RelatedPerson>(
    record,
    resourceIdentifierToUUID(relatedPesonReference)
  ).patient.reference
}

export function createRelatedPersonEntries(
  collectorDetails: CertifyInput['collector'],
  temporaryRelatedPersonId: UUID,
  record: RegisteredRecord | CertifiedRecord
): [BundleEntry<RelatedPerson>, ...BundleEntry<Patient>[]] | [] {
  const knownRelationships = z.enum([
    'MOTHER',
    'FATHER',
    'INFORMANT',
    'BRIDE',
    'GROOM'
  ])

  const relationshipToSectionCode = (
    relationship: z.TypeOf<typeof knownRelationships>
  ): `${Lowercase<typeof relationship>}-details` =>
    `${relationship.toLowerCase() as Lowercase<typeof relationship>}-details`

  if ('otherRelationship' in collectorDetails) {
    const temporaryPatientId = getUUID()
    return [
      {
        fullUrl: `urn:uuid:${temporaryRelatedPersonId}`,
        resource: {
          resourceType: 'RelatedPerson',
          relationship: {
            coding: [
              {
                system:
                  'http://hl7.org/fhir/ValueSet/relatedperson-relationshiptype',
                code: collectorDetails.relationship
              }
            ],
            text: collectorDetails.otherRelationship
          },
          ...(collectorDetails.affidavit?.[0] && {
            extension: [
              {
                url: `http://opencrvs.org/specs/extension/relatedperson-affidavittype`,
                valueAttachment: {
                  ...collectorDetails.affidavit[0]
                }
              }
            ]
          }),
          patient: {
            reference: `urn:uuid:${temporaryPatientId}`
          }
        }
      },
      {
        fullUrl: `urn:uuid:${temporaryPatientId}`,
        resource: {
          resourceType: 'Patient',
          name: collectorDetails.name.map(
            ({ use, firstNames, familyName }) => ({
              use,
              given: firstNames.split(' '),
              family: familyName
            })
          ),
          identifier: collectorDetails.identifier.map(({ id, type }) => ({
            value: id,
            type: {
              coding: [
                {
                  system: 'http://opencrvs.org/specs/identifier-type',
                  code: type
                }
              ]
            }
          }))
        }
      }
    ]
  }

  const parseResult = knownRelationships.safeParse(
    collectorDetails.relationship
  )

  if (parseResult.success) {
    const knownRelationship = parseResult.data
    const section = findCompositionSection(
      relationshipToSectionCode(knownRelationship),
      getComposition(record)
    )

    if (!section) {
      throw badRequest(`Patient resource for ${knownRelationship} not found`)
    }

    return [
      {
        fullUrl: `urn:uuid:${temporaryRelatedPersonId}`,
        resource: {
          resourceType: 'RelatedPerson',
          relationship: {
            coding: [
              {
                system:
                  'http://hl7.org/fhir/ValueSet/relatedperson-relationshiptype',
                code: collectorDetails.relationship
              }
            ]
          },
          patient: {
            reference:
              knownRelationship !== 'INFORMANT'
                ? section.entry[0].reference
                : findPatientReferenceFromRelatedPerson(
                    record,
                    section.entry[0].reference
                  )
          }
        }
      }
    ]
  }

  /*
   * For collector relations that we don't have any
   * details e.g. "Legal Guardian"
   */

  return [
    {
      fullUrl: `urn:uuid:${temporaryRelatedPersonId}`,
      resource: {
        resourceType: 'RelatedPerson',
        relationship: {
          coding: [
            {
              system:
                'http://hl7.org/fhir/ValueSet/relatedperson-relationshiptype',
              code: collectorDetails.relationship
            }
          ]
        }
      }
    }
  ]
}

type BundleEntryWithFullUrl<T extends Resource = Resource> = Omit<
  MaybeSavedBundleEntryWithFullUrl<T>,
  'fullUrl'
> & {
  fullUrl: URNReference
}

export function createPaymentResources(
  paymentDetails: PaymentInput
): [BundleEntryWithFullUrl<PaymentReconciliation>]

export function createPaymentResources(
  paymentDetails: PaymentInput,
  attachmentURL?: string
): [
  BundleEntryWithFullUrl<PaymentReconciliation>,
  BundleEntryWithFullUrl<DocumentReference>
]

export function createPaymentResources(
  paymentDetails: PaymentInput,
  attachmentURL?: string
):
  | [
      BundleEntryWithFullUrl<PaymentReconciliation>,
      BundleEntryWithFullUrl<DocumentReference>
    ]
  | [BundleEntryWithFullUrl<PaymentReconciliation>] {
  const temporaryPaymentId = getUUID()
  const temporaryDocumentReferenceId = getUUID()

  const paymentBundleEntry = {
    fullUrl: `urn:uuid:${temporaryPaymentId}`,
    resource: {
      resourceType: 'PaymentReconciliation',
      status: 'active',
      total: {
        value: paymentDetails.amount
      },
      detail: [
        {
          type: {
            coding: [
              {
                code: paymentDetails.type
              }
            ]
          },
          amount: {
            value: paymentDetails.amount
          },
          date: paymentDetails.date
        }
      ],
      outcome: {
        coding: [
          {
            code: paymentDetails.outcome
          }
        ]
      }
    }
  } satisfies BundleEntry<PaymentReconciliation>

  if (!attachmentURL) {
    return [paymentBundleEntry]
  }

  return [
    paymentBundleEntry,
    {
      fullUrl: `urn:uuid:${temporaryDocumentReferenceId}`,
      resource: {
        resourceType: 'DocumentReference',
        masterIdentifier: {
          value: temporaryDocumentReferenceId,
          system: 'urn:ietf:rfc:3986'
        },
        status: 'current',
        subject: {
          reference: `urn:uuid:${temporaryPaymentId}`
        },
        extension: [
          {
            url: 'http://opencrvs.org/specs/extension/payment',
            valueReference: {
              reference: `urn:uuid:${temporaryPaymentId}`
            }
          }
        ],
        type: {
          coding: [
            {
              system: 'http://opencrvs.org/specs/documentType',
              code: 'PROOF_OF_PAYMENT'
            }
          ]
        },
        content: [
          {
            attachment: {
              contentType: 'image/jpg',
              data: attachmentURL
            }
          }
        ],
        identifier: []
      }
    }
  ]
}

export function createCorrectionEncounter() {
  const encounter = {
    fullUrl: `urn:uuid:${getUUID()}` as const,
    resource: {
      resourceType: 'Encounter' as const,
      status: 'finished' as const
    }
  } satisfies BundleEntry<fhir3.Encounter>

  return encounter
}

export function createCorrectedTask(
  previousTask: Task, // @todo do not require previous task, pass values from outside
  correctionDetails: CorrectionRequestInput | ApproveRequestInput,
  correctionEncounter: BundleEntry<fhir3.Encounter>,
  paymentReconciliation?: BundleEntry<PaymentReconciliation>
): Task {
  const conditionalExtensions: Extension[] = []

  if (paymentReconciliation?.fullUrl) {
    conditionalExtensions.push({
      url: 'http://opencrvs.org/specs/extension/paymentDetails',
      valueReference: {
        reference: paymentReconciliation.fullUrl
      }
    })
  }

  if (correctionDetails.requesterOther) {
    conditionalExtensions.push({
      url: 'http://opencrvs.org/specs/extension/requestingIndividualOther',
      valueString: correctionDetails.requesterOther
    })
  }

  return {
    resourceType: 'Task',
    status: 'ready',
    intent: 'order',
    code: previousTask.code,
    focus: previousTask.focus,
    id: previousTask.id,
    encounter: { reference: correctionEncounter.fullUrl },
    identifier: previousTask.identifier,
    extension: [
      ...previousTask.extension.filter((extension) =>
        [
          'http://opencrvs.org/specs/extension/contact-person-phone-number',
          'http://opencrvs.org/specs/extension/informants-signature',
          'http://opencrvs.org/specs/extension/contact-person-email'
        ].includes(extension.url)
      ),
      ...conditionalExtensions,
      {
        url: 'http://opencrvs.org/specs/extension/timeLoggedMS',
        valueInteger: 0
      },
      {
        url: 'http://opencrvs.org/specs/extension/noSupportingDocumentationRequired',
        valueBoolean: correctionDetails.noSupportingDocumentationRequired
      },
      {
        url: 'http://opencrvs.org/specs/extension/requestingIndividual',
        valueString: correctionDetails.requester
      },
      {
        url: 'http://opencrvs.org/specs/extension/hasShowedVerifiedDocument',
        valueBoolean: correctionDetails.hasShowedVerifiedDocument
      },
      {
        url: MAKE_CORRECTION_EXTENSION_URL,
        valueString: 'REGISTERED'
      }
    ],
    input: correctionDetails.values.map((update) => ({
      valueCode: update.section,
      valueId: update.fieldName,
      type: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/action-type',
            code: 'update'
          }
        ]
      },
      ...getFHIRValueField(update.oldValue)
    })),
    output: correctionDetails.values.map((update) => ({
      valueCode: update.section,
      valueId: update.fieldName,
      type: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/action-type',
            code: 'update'
          }
        ]
      },
      ...getFHIRValueField(update.newValue)
    })),
    reason: {
      text: correctionDetails.reason,
      extension: [
        {
          url: 'http://opencrvs.org/specs/extension/otherReason',
          valueString: correctionDetails.otherReason
        }
      ]
    },
    note: [
      {
        text: correctionDetails.note
      }
    ],
    lastModified: new Date().toISOString(),
    businessStatus: {
      coding: [
        {
          system: 'http://opencrvs.org/specs/reg-status',
          code: 'REGISTERED'
        }
      ]
    }
  }
}

export async function createViewTask(
  previousTask: SavedTask,
  token: string
): Promise<SavedTask> {
  const taskWithoutPracitionerExtensions = createNewTaskResource(previousTask, [
    { url: 'http://opencrvs.org/specs/extension/regViewed' }
  ])

  const [viewedTask] = await withPractitionerDetails(
    taskWithoutPracitionerExtensions,
    token
  )

  return viewedTask
}

export function createDownloadTask(previousTask: SavedTask) {
  return createNewTaskResource(previousTask, [
    { url: 'http://opencrvs.org/specs/extension/regAssigned' }
  ])
}

export function createRejectTask(
  previousTask: SavedTask,
  comment: fhir3.CodeableConcept,
  reason?: string
): SavedTask {
  const rejectedTask = createNewTaskResource(
    previousTask,
    [
      {
        url: 'http://opencrvs.org/specs/extension/timeLoggedMS',
        valueInteger: 0
      }
    ],
    'REJECTED'
  )

  const updatedRejectedTask: SavedTask = {
    ...rejectedTask,
    statusReason: comment,
    reason: {
      text: reason ?? ''
    }
  }

  return updatedRejectedTask
}

export function createValidateTask(
  previousTask: SavedTask,
  comments?: string,
  timeLoggedMS?: number
): SavedTask {
  const validatedTask = createNewTaskResource(
    previousTask,
    [
      {
        url: 'http://opencrvs.org/specs/extension/timeLoggedMS',
        valueInteger: timeLoggedMS ?? 0
      }
    ],
    'VALIDATED'
  )

  return {
    ...validatedTask,
    ...(comments ? { note: [{ text: comments }] } : {})
  }
}

export function createWaitingForValidationTask(
  previousTask: SavedTask,
  comments?: string,
  timeLoggedMS?: number
): Task {
  const waitingForValidationTask = createNewTaskResource(
    previousTask,
    [
      {
        url: 'http://opencrvs.org/specs/extension/timeLoggedMS',
        valueInteger: timeLoggedMS ?? 0
      }
    ],
    'WAITING_VALIDATION'
  )

  return {
    ...waitingForValidationTask,
    ...(comments ? { note: [{ text: comments }] } : {})
  }
}

export function createRegisterTask(
  previousTask: SavedTask,
  comment?: string
): Task {
  const timeLoggedMSExtension = previousTask.extension.find(
    (e) => e.url === 'http://opencrvs.org/specs/extension/timeLoggedMS'
  )

  const registeredTask = createNewTaskResource(
    previousTask,
    timeLoggedMSExtension ? [timeLoggedMSExtension] : [],
    'REGISTERED'
  )

  const comments = comment ?? previousTask?.note?.[0]?.text

  return {
    ...registeredTask,
    ...(comments ? { note: [{ text: comments }] } : {})
  }
}

export function createReinstateTask(
  previousTask: SavedTask,
  prevBusinessStatus: RegistrationStatus
) {
  return createNewTaskResource(
    previousTask,
    [
      {
        url: 'http://opencrvs.org/specs/extension/regReinstated'
      }
    ],
    prevBusinessStatus
  )
}

export function createArchiveTask(
  previousTask: SavedTask,
  reason?: string,
  comment?: string,
  duplicateTrackingId?: string
): SavedTask {
  const newExtensions: Extension[] = []
  if (duplicateTrackingId) {
    newExtensions.push({
      url: 'http://opencrvs.org/specs/extension/duplicateTrackingId',
      valueString: duplicateTrackingId
    })
  }
  const archivedTask = createNewTaskResource(
    previousTask,
    newExtensions,
    'ARCHIVED'
  )

  const updatedArchivedTask = {
    ...archivedTask,
    // Reason example - "duplicate"
    reason: { text: reason ?? '' },
    // Status reason is comments which is added in the UI
    statusReason: { text: comment ?? '' }
  }

  return updatedArchivedTask
}

export function createNotDuplicateTask(previousTask: SavedTask): SavedTask {
  return createNewTaskResource(previousTask, [
    {
      url: 'http://opencrvs.org/specs/extension/markedAsNotDuplicate' as const
    }
  ])
}

export function createDuplicateTask(
  previousTask: SavedTask,
  reason?: string,
  comment?: string,
  duplicateTrackingId?: string
): SavedTask {
  const newExtensions: Extension[] = []
  newExtensions.push({
    url: 'http://opencrvs.org/specs/extension/markedAsDuplicate',
    valueString: duplicateTrackingId
  })

  const duplicateTask = createNewTaskResource(previousTask, newExtensions)

  return {
    ...duplicateTask,
    reason: { text: reason ?? '' },
    statusReason: { text: comment ?? '' }
  }
}

export function createUpdatedTask(
  previousTask: SavedTask,
  updatedDetails: ChangedValuesInput
): SavedTask {
  const updatedTask = createNewTaskResource(
    previousTask,
    [],
    'DECLARATION_UPDATED'
  )
  return {
    ...updatedTask,
    input: updatedDetails.map((update) => ({
      valueCode: update.section,
      valueId: update.fieldName,
      type: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/action-type',
            code: 'update'
          }
        ]
      },
      ...getFHIRValueField(update.oldValue)
    })),
    output: updatedDetails.map((update) => ({
      valueCode: update.section,
      valueId: update.fieldName,
      type: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/action-type',
            code: 'update'
          }
        ]
      },
      ...getFHIRValueField(update.newValue)
    }))
  }
}

export async function createUnassignedTask(
  previousTask: SavedTask,
  token: string
) {
  const taskWithoutPracitionerExtensions = createNewTaskResource(previousTask, [
    { url: 'http://opencrvs.org/specs/extension/regUnassigned' }
  ])

  const [unassignedTask] = await withPractitionerDetails(
    taskWithoutPracitionerExtensions,
    token
  )

  return unassignedTask
}

export function createCertifiedTask(
  previousTask: SavedTask,
  certificateTemplateId: string
): SavedTask {
  return createNewTaskResource(
    previousTask,
    [
      {
        url: 'http://opencrvs.org/specs/extension/certificateTemplateId',
        valueString: certificateTemplateId
      }
    ],
    'CERTIFIED'
  )
}

export function createIssuedTask(
  previousTask: SavedTask,
  paymentReconciliation?: BundleEntry<PaymentReconciliation>
): SavedTask {
  const nextExtentions: Extension[] = paymentReconciliation?.fullUrl
    ? [
        {
          url: 'http://opencrvs.org/specs/extension/paymentDetails',
          valueReference: {
            reference: paymentReconciliation.fullUrl
          }
        }
      ]
    : []
  return createNewTaskResource(previousTask, nextExtentions, 'ISSUED')
}

export function createVerifyRecordTask(
  previousTask: SavedTask,
  ipInfo: string
): SavedTask {
  return createNewTaskResource(previousTask, [
    {
      url: 'http://opencrvs.org/specs/extension/regVerified',
      valueString: ipInfo
    }
  ])
}

export function createCorrectionRequestTask(
  previousTask: Task,
  correctionDetails: CorrectionRequestInput,
  correctionEncounter: BundleEntry<fhir3.Encounter>,
  practitioner: Practitioner,
  paymentReconciliation?: BundleEntry<PaymentReconciliation>
): Task {
  const conditionalExtensions: Extension[] = []

  if (paymentReconciliation) {
    conditionalExtensions.push({
      url: 'http://opencrvs.org/specs/extension/paymentDetails',
      valueReference: {
        // @todo implement URLReference and URNReference types for Extensions
        reference: paymentReconciliation.fullUrl as string
      }
    })
  }

  if (correctionDetails.requesterOther) {
    conditionalExtensions.push({
      url: 'http://opencrvs.org/specs/extension/requestingIndividualOther',
      valueString: correctionDetails.requesterOther
    })
  }

  return {
    resourceType: 'Task',
    status: 'requested',
    intent: 'proposal',
    code: previousTask.code,
    focus: previousTask.focus,
    id: previousTask.id,
    requester: {
      agent: { reference: `Practitioner/${practitioner.id}` }
    },
    encounter: { reference: correctionEncounter.fullUrl },
    identifier: previousTask.identifier,
    extension: [
      ...previousTask.extension.filter((extension) =>
        [
          'http://opencrvs.org/specs/extension/contact-person-phone-number',
          'http://opencrvs.org/specs/extension/informants-signature',
          'http://opencrvs.org/specs/extension/contact-person-email',
          'http://opencrvs.org/specs/extension/bride-signature',
          'http://opencrvs.org/specs/extension/groom-signature',
          'http://opencrvs.org/specs/extension/witness-one-signature',
          'http://opencrvs.org/specs/extension/witness-two-signature'
        ].includes(extension.url)
      ),
      {
        url: 'http://opencrvs.org/specs/extension/timeLoggedMS',
        valueInteger: 0
      },
      ...conditionalExtensions,
      {
        url: 'http://opencrvs.org/specs/extension/noSupportingDocumentationRequired',
        valueBoolean: correctionDetails.noSupportingDocumentationRequired
      },
      {
        url: 'http://opencrvs.org/specs/extension/requestingIndividual',
        valueString: correctionDetails.requester
      },
      {
        url: `http://opencrvs.org/specs/extension/hasShowedVerifiedDocument` as const,
        valueBoolean: correctionDetails.hasShowedVerifiedDocument
      }
    ],
    input: correctionDetails.values.map((update) => ({
      valueCode: update.section,
      valueId: update.fieldName,
      type: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/action-type',
            code: 'update'
          }
        ]
      },
      ...getFHIRValueField(update.oldValue)
    })),
    output: correctionDetails.values.map((update) => ({
      valueCode: update.section,
      valueId: update.fieldName,
      type: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/action-type',
            code: 'update'
          }
        ]
      },
      ...getFHIRValueField(update.newValue)
    })),
    reason: {
      text: correctionDetails.reason,
      extension: [
        {
          url: 'http://opencrvs.org/specs/extension/otherReason',
          valueString: correctionDetails.otherReason
        }
      ]
    },
    note: [
      {
        text: previousTask.note?.[0]?.text || ''
      },
      {
        text: correctionDetails.note
      }
    ],
    lastModified: new Date().toISOString(),
    businessStatus: {
      coding: [
        {
          system: 'http://opencrvs.org/specs/reg-status',
          code: 'CORRECTION_REQUESTED'
        }
      ]
    }
  }
}

function createNewTaskResource(
  previousTask: SavedTask,
  newExtensions: Extension[],
  status?: TaskStatus
): SavedTask {
  return {
    resourceType: 'Task',
    status: previousTask.status ?? 'accepted',
    intent: 'proposal',
    ...(previousTask.encounter && { encounter: previousTask.encounter }),
    code: previousTask.code,
    focus: previousTask.focus,
    id: previousTask.id,
    requester: previousTask.requester,
    identifier: previousTask.identifier,
    note: previousTask.note,
    extension: previousTask.extension
      .filter((extension) =>
        [
          'http://opencrvs.org/specs/extension/contact-person-phone-number',
          'http://opencrvs.org/specs/extension/informants-signature',
          'http://opencrvs.org/specs/extension/contact-person-email',
          'http://opencrvs.org/specs/extension/bride-signature',
          'http://opencrvs.org/specs/extension/groom-signature',
          'http://opencrvs.org/specs/extension/witness-one-signature',
          'http://opencrvs.org/specs/extension/witness-two-signature'
        ].includes(extension.url)
      )
      .concat(newExtensions),
    lastModified: new Date().toISOString(),
    businessStatus: {
      coding: [
        {
          system: 'http://opencrvs.org/specs/reg-status',
          code: status ?? getStatusFromTask(previousTask)
        }
      ]
    },
    meta: {
      ...previousTask.meta,
      lastUpdated: new Date().toISOString()
    }
  }
}

export async function sendBundleToHearth(
  bundle: Bundle
): Promise<TransactionResponse> {
  const res = await fetch(FHIR_URL, {
    method: 'POST',
    /*
     * History resources e.g. TaskHistory, PractitionerRoleHistory
     * are internal OpenCRVS representation which hearth won't
     * recognize
     */
    body: JSON.stringify({
      ...bundle,
      entry: bundle.entry.filter(
        ({ resource: { resourceType } }) => !resourceType.endsWith('History')
      )
    }),
    headers: {
      'Content-Type': 'application/fhir+json'
    }
  })

  if (!res.ok) {
    throw new Error(
      `FHIR post to /fhir failed with [${res.status}] body: ${await res.text()}`
    )
  }

  const responseBundle: TransactionResponse = await res.json()

  const ok = responseBundle.entry.every((e) =>
    e.response.status.startsWith('2')
  )
  if (!ok) {
    throw new Error(
      'Hearth was unable to create/update all the entires in the bundle'
    )
  }

  return responseBundle
}

export async function getPractitionerRoleFromToken(
  token: string
): Promise<BundleEntry<PractitionerRole>> {
  const tokenPayload = getTokenPayload(token)
  const userDetails = await getUser(tokenPayload.sub, { Authorization: token })
  const practitionerId = userDetails.practitionerId
  const practitionerRoleBundle = (await getPractitionerRoleByPractitionerId(
    practitionerId as UUID
  )) as Bundle<PractitionerRole>

  const practitionerRoleResource = practitionerRoleBundle.entry[0].resource
  return {
    fullUrl:
      `/fhir/PractitionerRole/${practitionerRoleResource.id}/_history/${practitionerRoleResource.meta?.versionId}` as URLReference,
    resource: practitionerRoleResource
  }
}

function findSavedReference(
  temporaryReference: URNReference,
  resourceBundle: Bundle,
  responseBundle: TransactionResponse
): ResourceIdentifier | null {
  const indexInResponseBundle = resourceBundle.entry.findIndex(
    (entry) => entry.fullUrl === temporaryReference
  )
  if (indexInResponseBundle === -1) {
    return null
  }
  return urlReferenceToResourceIdentifier(
    responseBundle.entry[indexInResponseBundle].response.location
  ) as ResourceIdentifier
}

function toSavedComposition(
  composition: Composition,
  id: UUID,
  resourceBundle: Bundle,
  responseBundle: TransactionResponse
): SavedComposition {
  return {
    ...composition,
    id,
    section: composition.section.map((section) => ({
      ...section,
      entry: section.entry.map((sectionEntry) => {
        if (isURNReference(sectionEntry.reference)) {
          const savedReference = findSavedReference(
            sectionEntry.reference,
            resourceBundle,
            responseBundle
          )
          if (!savedReference) {
            throw Error(
              `No response found for "${`${section.title} -> ${sectionEntry.reference}`} in the following transaction: ${JSON.stringify(
                responseBundle
              )}"`
            )
          }
          return {
            ...sectionEntry,
            reference: savedReference
          }
        }
        return {
          ...sectionEntry,
          reference: sectionEntry.reference
        }
      })
    }))
  }
}

function toSavedTask(
  task: Task & { focus: { reference: URNReference } },
  id: UUID,
  resourceBundle: Bundle,
  responseBundle: TransactionResponse
): SavedTask {
  const savedReference = findSavedReference(
    task.focus.reference,
    resourceBundle,
    responseBundle
  )
  if (!savedReference) {
    throw internal(
      `No response found for "task.focus.reference->${
        task.focus.reference
      }" in the following transaction: ${JSON.stringify(responseBundle)}`
    )
  }
  return {
    ...task,
    id,
    focus: {
      reference: savedReference
    }
  }
}

function toSavedRelatedPerson(
  relatedPersion: RelatedPerson & {
    patient: { reference: `urn:uuid:${UUID}` }
  },
  id: UUID,
  resourceBundle: Bundle,
  responseBundle: TransactionResponse
): SavedRelatedPerson {
  const savedReference = findSavedReference(
    relatedPersion.patient.reference,
    resourceBundle,
    responseBundle
  )
  if (!savedReference) {
    throw internal(
      `No response found for "relatedPersion.patient.reference->${
        relatedPersion.patient.reference
      }" in the following transaction: ${JSON.stringify(responseBundle)}`
    )
  }
  return {
    ...relatedPersion,
    id,
    patient: {
      reference: savedReference
    }
  }
}

function toSavedEncounter(
  encounter: Omit<Encounter, 'location'> & {
    location: NonNullable<Encounter['location']>
  },
  id: UUID,
  resourceBundle: Bundle,
  responseBundle: TransactionResponse
): SavedEncounter {
  return {
    ...encounter,
    id,
    location: encounter.location.map((location) => {
      if (isURNReference(location.location.reference)) {
        const savedReference = findSavedReference(
          location.location.reference,
          resourceBundle,
          responseBundle
        )
        if (!savedReference) {
          throw internal(
            `No response found for "encounter.location.location.reference->${
              location.location.reference
            }" in the following transaction: ${JSON.stringify(responseBundle)}`
          )
        }
        return {
          ...location,
          location: {
            ...location.location,
            reference: savedReference
          }
        }
      }
      return {
        ...location,
        location: {
          ...location.location,
          reference: location.location.reference
        }
      }
    })
  }
}

/*
 * Only the references in Composition->section->entry->reference,
 * RelatedPerson->patient->reference,
 * Encounter->location->location->reference
 * are being resolved, the others e.g.
 * DocumentReference->extension->valueReference->reference
 * need to be added if needed
 */
export function toSavedBundle<T extends Resource>(
  resourceBundle: Bundle<T>,
  responseBundle: TransactionResponse
): SavedBundle<T> {
  return {
    ...resourceBundle,
    entry: resourceBundle.entry.map((entry, index) => {
      if (isComposition(entry.resource)) {
        return {
          ...entry,
          fullUrl: responseBundle.entry[index].response.location,
          resource: toSavedComposition(
            entry.resource,
            urlReferenceToUUID(responseBundle.entry[index].response.location),
            resourceBundle,
            responseBundle
          )
        }
      }

      if (isEncounter(entry.resource) && entry.resource.location) {
        return {
          ...entry,
          fullUrl: responseBundle.entry[index].response.location,
          resource: toSavedEncounter(
            { ...entry.resource, location: entry.resource.location },
            urlReferenceToUUID(responseBundle.entry[index].response.location),
            resourceBundle,
            responseBundle
          )
        }
      }

      if (
        isRelatedPerson(entry.resource) &&
        entry.resource.patient &&
        isURNReference(entry.resource.patient.reference)
      ) {
        return {
          ...entry,
          fullUrl: responseBundle.entry[index].response.location,
          resource: toSavedRelatedPerson(
            {
              ...entry.resource,
              patient: { reference: entry.resource.patient.reference }
            },
            urlReferenceToUUID(responseBundle.entry[index].response.location),
            resourceBundle,
            responseBundle
          )
        }
      }

      if (
        isTask(entry.resource) &&
        entry.resource.focus?.reference &&
        isURNReference(entry.resource.focus.reference)
      ) {
        return {
          ...entry,
          fullUrl: responseBundle.entry[index].response.location,
          resource: toSavedTask(
            {
              ...(entry.resource as Task),
              focus: {
                reference: entry.resource.focus.reference
              }
            },
            urlReferenceToUUID(responseBundle.entry[index].response.location),
            resourceBundle,
            responseBundle
          )
        }
      }
      if (
        isTask(entry.resource) &&
        entry.resource.extension &&
        entry.resource.extension.some(
          (x) => x.url === 'http://opencrvs.org/specs/extension/paymentDetails'
        )
      ) {
        return {
          ...entry,
          fullUrl: responseBundle.entry[index].response.location,
          resource: {
            ...entry.resource,
            id: urlReferenceToUUID(
              responseBundle.entry[index].response.location
            ),
            extension: entry.resource.extension.map((x: any) => {
              if (
                x.url ===
                  'http://opencrvs.org/specs/extension/paymentDetails' &&
                x.valueReference &&
                x.valueReference.reference &&
                resourceBundle.entry.some(
                  (y) => y.fullUrl === x.valueReference.reference
                )
              ) {
                const newLocation = responseBundle.entry.find((y) =>
                  y.response.location.includes('PaymentReconciliation')
                )?.response.location

                if (newLocation) {
                  return {
                    ...x,
                    valueReference: {
                      ...x.valueReference,
                      reference: newLocation
                    }
                  }
                }
              }
              return x
            })
          }
        }
      }

      return {
        ...entry,
        fullUrl: responseBundle.entry[index].response.location,
        resource: {
          ...entry.resource,
          id: urlReferenceToUUID(responseBundle.entry[index].response.location)
        }
      }
    })
  } as SavedBundle<T>
}

export function mergeBundles<T extends Bundle, R extends Bundle>(
  record: T,
  newOrUpdatedResourcesBundle: R
): T {
  const existingResourceIds = record.entry.map(({ resource }) => resource.id)
  const newEntries = newOrUpdatedResourcesBundle.entry.filter(
    ({ resource }) => !existingResourceIds.includes(resource.id)
  )
  return {
    ...record,
    entry: [
      ...record.entry.map((previousEntry) => ({
        ...previousEntry,
        resource:
          newOrUpdatedResourcesBundle.entry.find(
            (newEntry) => newEntry.resource.id === previousEntry.resource.id
          )?.resource ?? previousEntry.resource
      })),
      ...newEntries
    ]
  }
}

export async function findTaskFromIdentifier(
  identifier: string
): Promise<Bundle<SavedTask>> {
  const system =
    'http://opencrvs.org/specs/id/draft-id' satisfies TaskIdentifierSystem

  const res = await fetch(
    new URL(`/fhir/Task?identifier=${system}|${identifier}`, FHIR_URL).href,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/fhir+json'
      }
    }
  )
  if (!res.ok) {
    throw new Error(
      `Fetching task history from Hearth failed with [${res.status}] body: ${res.statusText}`
    )
  }

  return res.json()
}

export async function getTaskHistory(taskId: string): Promise<Bundle<Task>> {
  const res = await fetch(
    new URL(`/fhir/Task/${taskId}/_history?_count=100`, FHIR_URL).href,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/fhir+json'
      }
    }
  )
  if (!res.ok) {
    throw new Error(
      `Fetching task history from Hearth failed with [${res.status}] body: ${res.statusText}`
    )
  }

  return res.json()
}

export async function getLocationsById(
  locationIds: Array<string>
): Promise<Bundle<Location>> {
  const res = await fetch(
    new URL(`/fhir/Location?_id=${locationIds.join(',')}`, FHIR_URL).href,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/fhir+json'
      }
    }
  )
  if (!res.ok) {
    throw new Error(
      `Fetching locations from Hearth failed with [${res.status}] body: ${res.statusText}`
    )
  }

  return res.json()
}

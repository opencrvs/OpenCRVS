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
import * as Hapi from '@hapi/hapi'
import { writePoints } from '@metrics/influxdb/client'
import {
  generateBirthRegPoint,
  generateCertificationPoint,
  generateCorrectionReasonPoint,
  generateDeathRegPoint,
  generateDeclarationStartedPoint,
  generateEventDurationPoint,
  generateInCompleteFieldPoints,
  generateMarriageRegPoint,
  generatePaymentPoint,
  generateRejectedPoints,
  generateTimeLoggedPoint
} from '@metrics/features/registration/pointGenerator'
import { badRequest, internal } from '@hapi/boom'
import { populateBundleFromPayload } from '@metrics/features/registration/utils'
import { IPoints } from '@metrics/features/registration'
import { createUserAuditPointFromFHIR } from '@metrics/features/audit/service'
import {
  MAKE_CORRECTION_EXTENSION_URL,
  findExtension,
  getActionFromTask,
  getPaymentReconciliation,
  getTask
} from '@metrics/features/registration/fhirUtils'
import { EventType } from '@metrics/config/routes'
import { fetchTaskHistory } from '@metrics/api'

export async function waitingExternalValidationHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const points = []
  try {
    points.push(
      await generateTimeLoggedPoint(request.payload as fhir.Bundle, {
        Authorization: request.headers.authorization,
        'x-correlation-id': request.headers['x-correlation-id']
      })
    )
    points.push(
      await generateEventDurationPoint(
        request.payload as fhir.Bundle,
        ['IN_PROGRESS', 'DECLARED', 'VALIDATED'],
        {
          Authorization: request.headers.authorization,
          'x-correlation-id': request.headers['x-correlation-id']
        }
      )
    )

    await writePoints(points)
  } catch (err) {
    return internal(err)
  }

  return h.response().code(200)
}

export async function markedAsDuplicate(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  await createUserAuditPointFromFHIR('MARKED_AS_DUPLICATE', request)
  return h.response().code(200)
}

export async function markedAsNotDuplicate(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  await createUserAuditPointFromFHIR('MARKED_AS_NOT_DUPLICATE', request)
  return h.response().code(200)
}

export async function sentForApprovalHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  await createUserAuditPointFromFHIR('VALIDATED', request)
  try {
    const points = await Promise.all([
      generateEventDurationPoint(
        request.payload as fhir.Bundle,
        ['IN_PROGRESS', 'DECLARED'],
        {
          Authorization: request.headers.authorization,
          'x-correlation-id': request.headers['x-correlation-id']
        }
      ),
      generateTimeLoggedPoint(request.payload as fhir.Bundle, {
        Authorization: request.headers.authorization,
        'x-correlation-id': request.headers['x-correlation-id']
      })
    ])

    await writePoints(points)
  } catch (err) {
    return internal(err)
  }

  return h.response().code(200)
}

export async function sentNotificationForReviewHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const points = []
  await createUserAuditPointFromFHIR('DECLARED', request)

  try {
    points.push(
      await generateTimeLoggedPoint(request.payload as fhir.Bundle, {
        Authorization: request.headers.authorization,
        'x-correlation-id': request.headers['x-correlation-id']
      })
    )
    points.push(
      await generateDeclarationStartedPoint(request.payload as fhir.Bundle, {
        Authorization: request.headers.authorization,
        'x-correlation-id': request.headers['x-correlation-id']
      })
    )

    await writePoints(points)
  } catch (err) {
    return internal(err)
  }

  return h.response().code(200)
}

export async function sentNotificationHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  await createUserAuditPointFromFHIR('IN_PROGRESS', request)
  try {
    const points = await generateInCompleteFieldPoints(
      request.payload as fhir.Bundle,
      {
        Authorization: request.headers.authorization,
        'x-correlation-id': request.headers['x-correlation-id']
      }
    )
    points.push(
      await generateTimeLoggedPoint(request.payload as fhir.Bundle, {
        Authorization: request.headers.authorization,
        'x-correlation-id': request.headers['x-correlation-id']
      })
    )
    points.push(
      await generateDeclarationStartedPoint(request.payload as fhir.Bundle, {
        Authorization: request.headers.authorization,
        'x-correlation-id': request.headers['x-correlation-id']
      })
    )

    await writePoints(points)
  } catch (err) {
    return internal(err)
  }

  return h.response().code(200)
}

export async function sentForUpdatesHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  await createUserAuditPointFromFHIR('REJECTED', request)
  try {
    const points: IPoints[] = []
    points.push(
      await generateRejectedPoints(request.payload as fhir.Bundle, {
        Authorization: request.headers.authorization,
        'x-correlation-id': request.headers['x-correlation-id']
      })
    )
    points.push(
      await generateTimeLoggedPoint(
        request.payload as fhir.Bundle,
        {
          Authorization: request.headers.authorization,
          'x-correlation-id': request.headers['x-correlation-id']
        },
        true
      )
    )

    points.push(
      await generateEventDurationPoint(
        request.payload as fhir.Bundle,
        ['IN_PROGRESS', 'DECLARED', 'VALIDATED', 'WAITING_VALIDATION'],
        {
          Authorization: request.headers.authorization,
          'x-correlation-id': request.headers['x-correlation-id']
        },
        true
      )
    )
    await writePoints(points)
  } catch (err) {
    return internal(err)
  }

  return h.response().code(200)
}

export async function markEventRegisteredHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const event = request.params.event as EventType
  if (event === EventType.BIRTH) {
    return markBirthRegisteredHandler(request, h)
  } else if (event === EventType.DEATH) {
    return markDeathRegisteredHandler(request, h)
  } else if (event === EventType.MARRIAGE) {
    return markMarriageRegisteredHandler(request, h)
  }
  return h.response().code(200)
}

export async function markBirthRegisteredHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  await createUserAuditPointFromFHIR('REGISTERED', request)
  try {
    const bundle = await populateBundleFromPayload(
      request.payload as fhir.Bundle | fhir.Task,
      request.headers.authorization
    )

    const points = await Promise.all([
      generateEventDurationPoint(
        bundle,
        ['IN_PROGRESS', 'DECLARED', 'VALIDATED', 'WAITING_VALIDATION'],
        {
          Authorization: request.headers.authorization,
          'x-correlation-id': request.headers['x-correlation-id']
        }
      ),
      generateBirthRegPoint(bundle, 'mark-existing-declaration-registered', {
        Authorization: request.headers.authorization,
        'x-correlation-id': request.headers['x-correlation-id']
      }),
      generateTimeLoggedPoint(bundle, {
        Authorization: request.headers.authorization,
        'x-correlation-id': request.headers['x-correlation-id']
      })
    ])

    await writePoints(points)
  } catch (err) {
    return internal(err)
  }

  return h.response().code(200)
}

export async function markDeathRegisteredHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  await createUserAuditPointFromFHIR('REGISTERED', request)

  try {
    const bundle = await populateBundleFromPayload(
      request.payload as fhir.Bundle | fhir.Task,
      request.headers.authorization
    )

    const points = await Promise.all([
      generateEventDurationPoint(
        bundle,
        ['IN_PROGRESS', 'DECLARED', 'VALIDATED', 'WAITING_VALIDATION'],
        {
          Authorization: request.headers.authorization,
          'x-correlation-id': request.headers['x-correlation-id']
        }
      ),
      generateDeathRegPoint(bundle, 'mark-existing-declaration-registered', {
        Authorization: request.headers.authorization,
        'x-correlation-id': request.headers['x-correlation-id']
      }),
      generateTimeLoggedPoint(bundle, {
        Authorization: request.headers.authorization,
        'x-correlation-id': request.headers['x-correlation-id']
      })
    ])

    await writePoints(points)
  } catch (err) {
    return internal(err)
  }

  return h.response().code(200)
}

export async function markCertifiedHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  await createUserAuditPointFromFHIR('CERTIFIED', request)
  try {
    const points = await generateEventDurationPoint(
      request.payload as fhir.Bundle,
      ['REGISTERED', 'ISSUED'],
      {
        Authorization: request.headers.authorization,
        'x-correlation-id': request.headers['x-correlation-id']
      }
    )

    await writePoints([points])
  } catch (err) {
    return internal(err)
  }

  return h.response().code(200)
}

export async function markIssuedHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  await createUserAuditPointFromFHIR('ISSUED', request)
  try {
    const points = await Promise.all([
      generatePaymentPoint(
        request.payload as fhir.Bundle,
        {
          Authorization: request.headers.authorization,
          'x-correlation-id': request.headers['x-correlation-id']
        },
        'certification'
      ),
      generateCertificationPoint(request.payload as fhir.Bundle, {
        Authorization: request.headers.authorization,
        'x-correlation-id': request.headers['x-correlation-id']
      }),
      generateEventDurationPoint(
        request.payload as fhir.Bundle,
        ['CERTIFIED'],
        {
          Authorization: request.headers.authorization,
          'x-correlation-id': request.headers['x-correlation-id']
        }
      )
    ])
    await writePoints(points)
  } catch (err) {
    return internal(err)
  }

  return h.response().code(200)
}

type TaskBundleEntry = Omit<fhir.BundleEntry, 'resource'> & {
  resource: fhir.Task
}

export async function correctionEventHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const task = getTask(request.payload as fhir.Bundle)

  if (!task) {
    return badRequest('No task found in received bundle')
  }

  const history = await fetchTaskHistory(task.id!, {
    Authorization: request.headers.authorization,
    'x-correlation-id': request.headers['x-correlation-id']
  })

  const latestCorrectionTask: TaskBundleEntry | undefined = history.entry?.find(
    (entry: TaskBundleEntry): entry is TaskBundleEntry =>
      entry.resource.businessStatus?.coding?.[0].code ===
        'CORRECTION_REQUESTED' ||
      Boolean(
        findExtension(MAKE_CORRECTION_EXTENSION_URL, entry.resource.extension!)
      )
  )

  if (!latestCorrectionTask) {
    return badRequest('No correction task found in received bundle')
  }

  if (latestCorrectionTask.resource.status === 'ready') {
    return correctionHandler(request, h)
  }
  if (latestCorrectionTask.resource.status === 'accepted') {
    return approveCorrectionHandler(request, h)
  }
  if (latestCorrectionTask.resource.status === 'rejected') {
    return rejectCorrectionHandler(request, h)
  }

  if (latestCorrectionTask.resource.status === 'requested') {
    return requestCorrectionHandler(request, h)
  }

  return badRequest('Task is in an unknown state')
}

async function correctionHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  await createUserAuditPointFromFHIR('CORRECTED', request)
  const payload = request.payload as fhir.Bundle
  const payment = getPaymentReconciliation(payload)
  try {
    const points = await Promise.all([
      ...(payment
        ? [
            generatePaymentPoint(
              payload,
              {
                Authorization: request.headers.authorization
              },
              'correction'
            )
          ]
        : []),
      generateCorrectionReasonPoint(payload, {
        Authorization: request.headers.authorization
      }),
      generateEventDurationPoint(payload, ['REGISTERED', 'CERTIFIED'], {
        Authorization: request.headers.authorization
      }),
      generateTimeLoggedPoint(payload, {
        Authorization: request.headers.authorization
      })
    ])

    await writePoints(points)
  } catch (err) {
    return internal(err)
  }
  return h.response().code(200)
}

async function approveCorrectionHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  await createUserAuditPointFromFHIR('APPROVED_CORRECTION', request)
  const payload = request.payload as fhir.Bundle
  const payment = getPaymentReconciliation(payload)

  try {
    const points = await Promise.all([
      ...(payment
        ? [
            generatePaymentPoint(
              payload,
              {
                Authorization: request.headers.authorization
              },
              'correction'
            )
          ]
        : []),
      generateCorrectionReasonPoint(payload, {
        Authorization: request.headers.authorization
      }),
      generateEventDurationPoint(payload, ['CORRECTION_REQUESTED'], {
        Authorization: request.headers.authorization
      }),
      generateTimeLoggedPoint(payload, {
        Authorization: request.headers.authorization
      })
    ])

    await writePoints(points)
  } catch (err) {
    return internal(err)
  }
  return h.response().code(200)
}
async function rejectCorrectionHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  await createUserAuditPointFromFHIR('REJECTED_CORRECTION', request)
  try {
    const points = await Promise.all([
      generateEventDurationPoint(
        request.payload as fhir.Bundle,
        ['REGISTERED', 'CERTIFIED'],
        {
          Authorization: request.headers.authorization
        }
      ),
      generateTimeLoggedPoint(request.payload as fhir.Bundle, {
        Authorization: request.headers.authorization
      })
    ])

    await writePoints(points)
  } catch (err) {
    return internal(err)
  }
  return h.response().code(200)
}

async function requestCorrectionHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  await createUserAuditPointFromFHIR('REQUESTED_CORRECTION', request)
  try {
    const points = await Promise.all([
      generateCorrectionReasonPoint(request.payload as fhir.Bundle, {
        Authorization: request.headers.authorization
      }),
      generateEventDurationPoint(
        request.payload as fhir.Bundle,
        ['REGISTERED', 'CERTIFIED'],
        {
          Authorization: request.headers.authorization
        }
      ),
      generateTimeLoggedPoint(request.payload as fhir.Bundle, {
        Authorization: request.headers.authorization
      })
    ])

    await writePoints(points)
  } catch (err) {
    return internal(err)
  }
  return h.response().code(200)
}

export async function declarationAssignedHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  await createUserAuditPointFromFHIR('ASSIGNED', request)
  return h.response().code(200)
}

export async function declarationUnassignedHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  await createUserAuditPointFromFHIR('UNASSIGNED', request)
  return h.response().code(200)
}

export async function declarationDownloadedHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  await createUserAuditPointFromFHIR('RETRIEVED', request)
  return h.response().code(200)
}

export async function declarationViewedHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  await createUserAuditPointFromFHIR('VIEWED', request)
  return h.response().code(200)
}

export async function declarationArchivedHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  await createUserAuditPointFromFHIR('ARCHIVED', request)
  return h.response().code(200)
}

export async function declarationReinstatedHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const bundle = request.payload as fhir.Bundle
  const task = getTask(bundle)
  const previousAction = getActionFromTask(task!)
  if (previousAction === 'IN_PROGRESS') {
    await createUserAuditPointFromFHIR('REINSTATED_IN_PROGRESS', request)
  }
  if (previousAction === 'DECLARED') {
    await createUserAuditPointFromFHIR('REINSTATED_DECLARED', request)
  }
  if (previousAction === 'REJECTED') {
    await createUserAuditPointFromFHIR('REINSTATED_REJECTED', request)
  }
  return h.response().code(200)
}

export async function declarationUpdatedHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  await createUserAuditPointFromFHIR('DECLARATION_UPDATED', request)
  return h.response().code(200)
}

export async function markMarriageRegisteredHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  await createUserAuditPointFromFHIR('REGISTERED', request)

  try {
    const bundle = await populateBundleFromPayload(
      request.payload as fhir.Bundle | fhir.Task,
      request.headers.authorization
    )

    const points = await Promise.all([
      generateEventDurationPoint(
        bundle,
        ['IN_PROGRESS', 'DECLARED', 'VALIDATED', 'WAITING_VALIDATION'],
        {
          Authorization: request.headers.authorization,
          'x-correlation-id': request.headers['x-correlation-id']
        }
      ),
      generateMarriageRegPoint(
        bundle,
        {
          Authorization: request.headers.authorization,
          'x-correlation-id': request.headers['x-correlation-id']
        },
        'mark-existing-declaration-registered'
      ),
      generateTimeLoggedPoint(bundle, {
        Authorization: request.headers.authorization,
        'x-correlation-id': request.headers['x-correlation-id']
      })
    ])

    await writePoints(points)
  } catch (err) {
    return internal(err)
  }

  return h.response().code(200)
}

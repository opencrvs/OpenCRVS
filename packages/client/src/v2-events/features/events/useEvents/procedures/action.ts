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

import { Mutation as TanstackMutation } from '@tanstack/query-core'
import { useMutation } from '@tanstack/react-query'
import { getMutationKey } from '@trpc/react-query'
import {
  ActionInput,
  ActionType,
  EventDocument,
  findActiveActionFields,
  getCurrentEventState,
  isFieldHiddenOrDisabled
} from '@opencrvs/commons/client'
import { api, queryClient, utils } from '@client/v2-events/trpc'
import { createTemporaryId, isTemporaryId } from './create'
import { useEventConfiguration } from '../../useEventConfiguration'
import _ from 'lodash'

async function updateLocalEvent(updatedEvent: EventDocument) {
  utils.event.get.setData(updatedEvent.id, updatedEvent)
  return utils.event.list.invalidate()
}

function waitUntilEventIsCreated<T extends { eventId: string }, R>(
  canonicalMutationFn: (params: T) => Promise<R>
): (params: T) => Promise<R> {
  return async (params) => {
    const { eventId } = params

    const localVersion = utils.event.get.getData(eventId)

    if (!localVersion || isTemporaryId(localVersion.id)) {
      // eslint-disable-next-line no-console
      console.error(
        'Event that has not been stored yet cannot be actioned upon'
      )
      throw new Error(
        'Event that has not been stored yet cannot be actioned upon'
      )
    }

    return canonicalMutationFn({ ...params, eventId: localVersion.id })
  }
}

type Mutation =
  | typeof api.event.actions.declare
  | typeof api.event.actions.notify
  | typeof api.event.actions.register
  | typeof api.event.actions.validate
  | typeof api.event.actions.printCertificate
  | typeof api.event.actions.correction.request
  | typeof api.event.actions.correction.approve
  | typeof api.event.actions.correction.reject

type Procedure =
  | typeof utils.event.actions.declare
  | typeof utils.event.actions.notify
  | typeof utils.event.actions.register
  | typeof utils.event.actions.validate
  | typeof utils.event.actions.printCertificate
  | typeof utils.event.actions.correction.request
  | typeof utils.event.actions.correction.approve
  | typeof utils.event.actions.correction.reject

/*
 * This makes sure that if you are offline and do
 * 1. Create record
 * 2. Create draft
 * 3. Declare the record
 * 4. Connect to the internet
 * The draft stage in the middle will be cancelled. This is to prevent race conditions
 * between when the backend receives the draft when it receives the declare action.
 */
function cancelOngoingDraftRequests({ eventId, draft }: ActionInput) {
  const mutationCache = queryClient.getMutationCache()

  const isDraftMutation = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutation: TanstackMutation<unknown, Error, any, unknown>
  ): mutation is TanstackMutation<unknown, Error, ActionInput, unknown> => {
    const mutationKey = mutation.options.mutationKey
    if (!mutationKey || !mutationKey[0]) {
      return false
    }
    return ['event', 'actions'].every((key) => mutationKey.flat().includes(key))
  }

  const draftMutationsForThisEvent = mutationCache
    .getAll()
    .filter(
      (mutation) =>
        isDraftMutation(mutation) &&
        mutation.state.variables?.eventId === eventId &&
        mutation.state.variables.draft
    )

  if (!draft) {
    draftMutationsForThisEvent.forEach((mutation) => {
      mutationCache.remove(mutation)
    })
  } else {
    // Keep the last draft mutation as it's this current request
    draftMutationsForThisEvent.slice(0, -1).forEach((mutation) => {
      mutationCache.remove(mutation)
    })
  }
}

function updateEventOptimistically<T extends ActionInput>(
  actionType: 'DECLARE'
) {
  return (variables: T) => {
    cancelOngoingDraftRequests(variables)

    const localEvent = utils.event.get.getData(variables.eventId)
    if (!localEvent) {
      return
    }
    const optimisticEvent: EventDocument = {
      ...localEvent,
      actions: [
        ...localEvent.actions,
        {
          id: createTemporaryId(),
          type: actionType,
          data: variables.data,
          draft: false,
          createdAt: new Date().toISOString(),
          createdBy: '@todo',
          createdAtLocation: '@todo'
        }
      ]
    }

    utils.event.list.setData(undefined, (eventIndices) =>
      eventIndices
        ?.filter((ei) => ei.id !== optimisticEvent.id)
        .concat(getCurrentEventState(optimisticEvent))
    )
  }
}

utils.event.actions.declare.setMutationDefaults(({ canonicalMutationFn }) => ({
  retry: true,
  retryDelay: 10000,
  mutationFn: waitUntilEventIsCreated(canonicalMutationFn),
  onSuccess: updateLocalEvent,
  onMutate: (params) => updateEventOptimistically('DECLARE')(params)
}))

utils.event.actions.register.setMutationDefaults(({ canonicalMutationFn }) => ({
  retry: true,
  retryDelay: 10000,
  mutationFn: waitUntilEventIsCreated(canonicalMutationFn),
  onSuccess: updateLocalEvent
}))

utils.event.actions.notify.setMutationDefaults(({ canonicalMutationFn }) => ({
  retry: true,
  retryDelay: 10000,
  mutationFn: waitUntilEventIsCreated(canonicalMutationFn),
  onSuccess: updateLocalEvent
}))

utils.event.actions.validate.setMutationDefaults(({ canonicalMutationFn }) => ({
  retry: true,
  retryDelay: 10000,
  mutationFn: waitUntilEventIsCreated(canonicalMutationFn),
  onSuccess: updateLocalEvent
}))

utils.event.actions.printCertificate.setMutationDefaults(
  ({ canonicalMutationFn }) => ({
    retry: true,
    retryDelay: 10000,
    mutationFn: waitUntilEventIsCreated(canonicalMutationFn),
    onSuccess: updateLocalEvent
  })
)

utils.event.actions.correction.request.setMutationDefaults(
  ({ canonicalMutationFn }) => ({
    retry: true,
    retryDelay: 10000,
    mutationFn: waitUntilEventIsCreated(canonicalMutationFn),
    onSuccess: updateLocalEvent
  })
)

utils.event.actions.correction.approve.setMutationDefaults(
  ({ canonicalMutationFn }) => ({
    retry: true,
    retryDelay: 10000,
    mutationFn: waitUntilEventIsCreated(canonicalMutationFn),
    onSuccess: updateLocalEvent
  })
)

utils.event.actions.correction.reject.setMutationDefaults(
  ({ canonicalMutationFn }) => ({
    retry: true,
    retryDelay: 10000,
    mutationFn: waitUntilEventIsCreated(canonicalMutationFn),
    onSuccess: updateLocalEvent
  })
)

export function useEventAction<P extends Procedure, M extends Mutation>(
  procedure: P,
  mutation: M
) {
  // TODO CIHAN tää kaivetaa jostai?
  const { eventConfiguration } = useEventConfiguration('tennis-club-membership')

  const mutationDefaults = procedure.getMutationDefaults()

  if (!mutationDefaults?.mutationFn) {
    throw new Error(
      'No mutation fn found for operation. This should never happen'
    )
  }

  const mutationFn = waitUntilEventIsCreated<any, any>(
    mutationDefaults.mutationFn
  )

  function stripForm(params: any) {
    console.log('strip form here?')

    // TODO CIHAN kaiva action type jostai?
    const fields =
      findActiveActionFields(eventConfiguration, ActionType.DECLARE) ?? []

    console.log(fields)
    console.log(params.data)

    const strippedData = _.omitBy(params.data, (_, key) => {
      const field = fields.find((f) => f.id === key)

      if (!field) {
        return true
      }

      return isFieldHiddenOrDisabled(field, params.data)
    })

    console.log(strippedData)

    return mutationFn({
      ...params,
      data: { ...params.data, form: strippedData }
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useMutation<any, any, any, any>({
    ...mutationDefaults,
    mutationKey: getMutationKey(mutation),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: stripForm
  }) as ReturnType<M['useMutation']>
}

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

import React, { useState } from 'react'
import { defineMessages, useIntl } from 'react-intl'
import { useNavigate } from 'react-router-dom'
import { Spinner } from '@opencrvs/components'
import { AppBar } from '@opencrvs/components/lib/AppBar'
import { Button } from '@opencrvs/components/lib/Button'
import { Content, ContentSize } from '@opencrvs/components/lib/Content'
import { ErrorText } from '@opencrvs/components/lib/ErrorText'
import { Frame } from '@opencrvs/components/lib/Frame'
import { Icon } from '@opencrvs/components/lib/Icon'
import { RadioButton } from '@opencrvs/components/lib/Radio'
import { Stack } from '@opencrvs/components/lib/Stack'
import { ROUTES } from '@client/v2-events/routes'
import { useEventConfigurations } from './useEventConfiguration'
import { useEventFormData } from './useEventFormData'
import { useEventFormNavigation } from './useEventFormNavigation'
import { createTemporaryId } from './useEvents/procedures/create'
import { useEvents } from './useEvents/useEvents'

const messages = defineMessages({
  registerNewEventTitle: {
    id: 'v2.register.selectVitalEvent.registerNewEventTitle',
    defaultMessage: 'New declaration',
    description: 'The title that appears on the select vital event page'
  },
  registerNewEventHeading: {
    id: 'v2.register.selectVitalEvent.registerNewEventHeading',
    defaultMessage: 'What type of event do you want to declare?',
    description: 'The section heading on the page'
  },
  continueButton: {
    defaultMessage: 'Continue',
    description: 'Continue Button Text',
    id: 'v2.buttons.continue'
  },
  errorMessage: {
    id: 'v2.register.selectVitalEvent.errorMessage',
    defaultMessage: 'Please select the type of event',
    description: 'Error Message to show when no event is being selected'
  },
  exitButton: {
    defaultMessage: 'EXIT',
    description: 'Label for Exit button on EventTopBar',
    id: 'v2.buttons.exit'
  }
})

const constantsMessages = defineMessages({
  skipToMainContent: {
    defaultMessage: 'Skip to main content',
    description:
      'Label for a keyboard accessibility link which skips to the main content',
    id: 'v2.constants.skipToMainContent'
  }
})

function EventSelector() {
  const intl = useIntl()
  const navigate = useNavigate()
  const [eventType, setEventType] = useState('')
  const [noEventSelectedError, setNoEventSelectedError] = useState(false)
  const eventConfigurations = useEventConfigurations()
  const events = useEvents()
  const clearForm = useEventFormData((state) => state.clear)
  const createEvent = events.createEvent()

  function handleContinue() {
    if (eventType === '') {
      return setNoEventSelectedError(true)
    }
    const transactionId = createTemporaryId()

    createEvent.mutate({
      type: eventType,
      transactionId
    })

    clearForm()

    navigate(
      ROUTES.V2.EVENTS.DECLARE.buildPath({
        eventId: transactionId
      })
    )
  }

  return (
    <>
      {noEventSelectedError && (
        <ErrorText id="require-error">
          {intl.formatMessage(messages.errorMessage)}
        </ErrorText>
      )}
      <Stack
        alignItems="left"
        direction="column"
        gap={16}
        id="select_vital_event_view"
      >
        {eventConfigurations.map((event) => (
          <RadioButton
            key={`${event.id}event`}
            id={`select_${event.id}_event`}
            label={intl.formatMessage(event.label)}
            name={`${event.id}event`}
            selected={eventType === event.id ? event.id : ''}
            size="large"
            value={event.id}
            onChange={() => {
              setEventType(event.id)
              setNoEventSelectedError(false)
            }}
          />
        ))}

        <Button
          key="select-vital-event-continue"
          fullWidth
          id="continue"
          size="large"
          type="primary"
          onClick={handleContinue}
        >
          {intl.formatMessage(messages.continueButton)}
        </Button>
      </Stack>
    </>
  )
}

export function EventSelection() {
  const intl = useIntl()
  const { goToHome } = useEventFormNavigation()

  return (
    <Frame
      header={
        <AppBar
          desktopLeft={<Icon name="Draft" size="large" />}
          desktopRight={
            <Button
              id="goBack"
              size="small"
              type="secondary"
              onClick={goToHome}
            >
              <Icon name="X" />
              {intl.formatMessage(messages.exitButton)}
            </Button>
          }
          desktopTitle={intl.formatMessage(messages.registerNewEventTitle)}
          mobileLeft={<Icon name="Draft" size="large" />}
          mobileRight={
            <Button size="medium" type="icon" onClick={goToHome}>
              <Icon name="X" />
            </Button>
          }
          mobileTitle={intl.formatMessage(messages.registerNewEventTitle)}
        />
      }
      skipToContentText={intl.formatMessage(
        constantsMessages.skipToMainContent
      )}
    >
      <Content
        size={ContentSize.SMALL}
        title={intl.formatMessage(messages.registerNewEventHeading)}
      >
        <React.Suspense fallback={<Spinner id="event-selector-spinner" />}>
          <EventSelector />
        </React.Suspense>
      </Content>
    </Frame>
  )
}

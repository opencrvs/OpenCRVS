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
import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { Container, BodyContent } from '@opencrvs/components/lib/layout'
import {
  WrappedComponentProps as IntlShapeProps,
  MessageDescriptor,
  injectIntl
} from 'react-intl'
import { Event } from '@client/forms'
import { constantsMessages, buttonMessages } from '@client/i18n/messages'
import { EventTopBar } from '@opencrvs/components/lib/interface'
import { messages } from '@client/i18n/messages/views/eventInfo'
import styled from '@client/styledComponents'
import {
  TertiaryButton,
  ICON_ALIGNMENT,
  PrimaryButton
} from '@opencrvs/components/lib/buttons'
import { BackArrow } from '@opencrvs/components/lib/icons'
import { BulletList } from '@opencrvs/components/lib/typography'
import { connect } from 'react-redux'
import {
  goBack,
  goToBirthInformant,
  goToDeathInformant,
  goToHome
} from '@client/navigation'
import {
  storeApplication,
  IApplication,
  createApplication
} from '@client/applications'

interface IDispatchProps {
  goBack: typeof goBack
  goToHome: typeof goToHome
  storeApplication: typeof storeApplication
  goToBirthInformant: typeof goToBirthInformant
  goToDeathInformant: typeof goToDeathInformant
}
type IFullProps = RouteComponentProps<{ eventType: Event }> &
  IntlShapeProps &
  IDispatchProps

const Title = styled.h4`
  ${({ theme }) => theme.fonts.h4Style};
  color: ${({ theme }) => theme.colors.copy};
  margin-top: 16px;
  margin-bottom: 24px;
`

function EventInfoComponet(props: IFullProps) {
  const {
    match: {
      params: { eventType }
    },
    intl
  } = props
  let topBarTitle: MessageDescriptor
  let listItems: string[]

  function handleContinue() {
    let application: IApplication
    switch (eventType) {
      case Event.BIRTH:
        application = createApplication(Event.BIRTH)
        props.storeApplication(application)
        props.goToBirthInformant(application.id)

        break
      case Event.DEATH:
        application = createApplication(Event.DEATH)
        props.storeApplication(application)
        props.goToDeathInformant(application.id)
        break
      default:
        throw new Error(`Unknown eventType ${eventType}`)
    }
  }
  switch (eventType) {
    case Event.BIRTH:
      topBarTitle = constantsMessages.newBirthRegistration
      listItems = messages.birthBulletListItems.map(message =>
        intl.formatMessage(message.index)
      )
      break
    case Event.DEATH:
      topBarTitle = constantsMessages.newDeathRegistration
      listItems = messages.deathBulletListItems.map(message =>
        intl.formatMessage(message.index)
      )
      break
    default:
      topBarTitle = constantsMessages.newBirthRegistration
      listItems = messages.birthBulletListItems.map(message =>
        intl.formatMessage(message.index)
      )
  }

  return (
    <Container id={`${eventType}-info-container`}>
      <EventTopBar
        title={intl.formatMessage(topBarTitle)}
        goHome={props.goToHome}
      />
      <BodyContent>
        <TertiaryButton
          align={ICON_ALIGNMENT.LEFT}
          icon={() => <BackArrow />}
          onClick={props.goBack}
        >
          {intl.formatMessage(buttonMessages.back)}
        </TertiaryButton>
        <Title>{intl.formatMessage(messages.title, { eventType })}</Title>
        <BulletList id={`${eventType}-info-bullet-list`} items={listItems} />
        <PrimaryButton id="continue" onClick={handleContinue}>
          {intl.formatMessage(buttonMessages.continueButton)}
        </PrimaryButton>
      </BodyContent>
    </Container>
  )
}

export const EventInfo = connect(null, {
  goBack,
  goToHome,
  storeApplication,
  goToBirthInformant,
  goToDeathInformant
})(injectIntl(EventInfoComponet))

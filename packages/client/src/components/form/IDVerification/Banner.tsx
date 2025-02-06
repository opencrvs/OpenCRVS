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
import React from 'react'
import { BannerType, IFormFieldValue } from '@client/forms'
import { useIntl } from 'react-intl'
import { Banner, Button, Text, ResponsiveModal } from '@opencrvs/components'
import { messages } from '@client/i18n/messages/views/id-verification'
import { useModal } from '@client/hooks/useModal'
import { buttonMessages } from '@client/i18n/messages'
import { VerificationPill } from './VerificationPill'
import { StatusIcon } from './StatusIcon'

const ConfirmationModal: React.FC<{
  close: (result: boolean) => void
  type: BannerType
}> = ({ close, type }) => {
  const intl = useIntl()
  return (
    <ResponsiveModal
      id="assignment"
      show
      title={intl.formatMessage(messages[type].resetConfirmation.title)}
      actions={[
        <Button
          key="cancel-btn"
          id="cancel"
          type="tertiary"
          onClick={() => close(false)}
        >
          {intl.formatMessage(buttonMessages.cancel)}
        </Button>,
        <Button
          key="confirm-btn"
          id="confirm"
          type="negative"
          onClick={() => close(true)}
        >
          {intl.formatMessage(buttonMessages.continueButton)}
        </Button>
      ]}
      autoHeight
      responsive={false}
      preventClickOnParent
      handleClose={() => close(false)}
    >
      {intl.formatMessage(messages[type].resetConfirmation.description)}
    </ResponsiveModal>
  )
}

export const IDVerificationBanner = ({
  type,
  idFieldName,
  setFieldValue
}: {
  type: BannerType
  setFieldValue: (name: string, value: IFormFieldValue) => void
  idFieldName: string
}) => {
  const intl = useIntl()
  const [modal, openModal] = useModal()
  const handleReset = async () => {
    const confirm = await openModal((close) => (
      <ConfirmationModal close={close} type={type} />
    ))
    if (confirm) {
      setFieldValue(idFieldName, '')
    }
  }
  if (type === 'authenticated') {
    return (
      <Banner.Container>
        <Banner.Header type="active">
          <VerificationPill type={type} />
          <StatusIcon type={type} />
        </Banner.Header>
        <Banner.Body>
          <Text variant="reg16" element="span">
            {intl.formatMessage(messages.authenticated.description)}
          </Text>
        </Banner.Body>
        <Banner.Footer justifyContent="flex-end">
          <Button type="secondary" onClick={handleReset}>
            {intl.formatMessage(messages.actions.revoke)}
          </Button>
        </Banner.Footer>
        {modal}
      </Banner.Container>
    )
  } else if (type === 'verified') {
    return (
      <Banner.Container>
        <Banner.Header type="default">
          <VerificationPill type={type} />
          <StatusIcon type={type} />
        </Banner.Header>
        <Banner.Body>
          <Text variant="reg16" element="span">
            {intl.formatMessage(messages.verified.description)}
          </Text>
        </Banner.Body>
        <Banner.Footer justifyContent="flex-end">
          <Button type="secondary" onClick={handleReset}>
            {intl.formatMessage(messages.actions.revoke)}
          </Button>
        </Banner.Footer>
        {modal}
      </Banner.Container>
    )
  } else if (type === 'failed') {
    return (
      <Banner.Container>
        <Banner.Header type="inactive">
          <VerificationPill type={type} />
          <StatusIcon type={type} />
        </Banner.Header>
        <Banner.Body>
          <Text variant="reg16" element="span">
            {intl.formatMessage(messages.failed.description)}
          </Text>
        </Banner.Body>
        <Banner.Footer justifyContent="flex-end">
          <Button type="secondary" onClick={handleReset}>
            {intl.formatMessage(messages.actions.reset)}
          </Button>
        </Banner.Footer>
        {modal}
      </Banner.Container>
    )
  } else return null
}

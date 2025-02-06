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
import { defineMessages, MessageDescriptor, useIntl } from 'react-intl'
import styled from 'styled-components'

import { formatISO } from 'date-fns'
import {
  ActionFormData,
  FieldConfig,
  FormConfig
} from '@opencrvs/commons/client'
import {
  Accordion,
  Button,
  Icon,
  Link,
  ListReview,
  ResponsiveModal,
  Stack,
  Text
} from '@opencrvs/components'

import { EventConfig, EventIndex } from '@opencrvs/commons'
import { FileOutput } from '@client/v2-events/components/forms/inputs/FileInput/FileInput'
import {
  getConditionalActionsForField,
  isFormFieldVisible
} from '@client/v2-events/components/forms/utils'
import { useTransformer } from '@client/v2-events/hooks/useTransformer'

const Deleted = styled.del`
  color: ${({ theme }) => theme.colors.negative};
`

const Row = styled.div<{
  position?: 'left' | 'center'
  background?: 'white' | 'background'
}>`
  display: flex;
  gap: 24px;
  width: 100%;
  justify-content: ${({ position }) => position || 'center'};
  background-color: ${({ theme, background }) =>
    !background || background === 'background'
      ? theme.colors.background
      : theme.colors.white};
  flex-direction: row;
  padding: 24px;
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    padding: 0;
  }
`
const HeaderContainer = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.grey300};
`
const HeaderContent = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: left;
  gap: 16px;
  align-items: center;
  ${({ theme }) => theme.fonts.h2}
  color: ${({ theme }) => theme.colors.copy};
`

const TitleContainer = styled.div`
  ${({ theme }) => theme.fonts.bold14}
  color: ${({ theme }) => theme.colors.supportingCopy};
  text-transform: uppercase;
`
const SubjectContainer = styled.div`
  ${({ theme }) => theme.fonts.h2}
  overflow-wrap: anywhere;
`

const LeftColumn = styled.div`
  flex-grow: 1;
  max-width: 840px;
  overflow: hidden;
`

const Card = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.grey300};
  background: ${({ theme }) => theme.colors.white};
  border-radius: 4px;
  margin-bottom: 40px;
  &:last-child {
    margin-bottom: 200px;
  }
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    border: 0;
    margin: 0;
  }
`

const FormData = styled.div`
  padding-top: 24px;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.copy};
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    padding: 24px;
  }
`

const ReviewContainter = styled.div`
  padding: 0px 32px;
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    padding: 0;
  }
`
const DeclarationDataContainer = styled.div``

const reviewMessages = defineMessages({
  changeButton: {
    id: 'v2.buttons.change',
    defaultMessage: 'Change',
    description: 'The label for the change button'
  },
  actionModalCancel: {
    id: 'v2.actionModal.cancel',
    defaultMessage: 'Cancel',
    description: 'The label for cancel button of action modal'
  },
  actionModalPrimaryAction: {
    id: 'v2.actionModal.PrimaryAction',
    defaultMessage: '{action, select, declare{Declare} other{{action}}}',
    description: 'The label for primary action button of action modal'
  },
  actionModalTitle: {
    id: 'v2.actionModal.title',
    defaultMessage:
      '{action, select, declare{Declare} other{{action}}} the member?',
    description: 'The title for action modal'
  },
  actionModalDescription: {
    id: 'v2.actionModal.description',
    defaultMessage:
      'The declarant will be notified of this action and a record of this decision will be recorded',
    description: 'The description for action modal'
  },
  changeModalCancel: {
    id: 'v2.changeModal.cancel',
    defaultMessage: 'Cancel',
    description: 'The label for cancel button of change modal'
  },
  changeModalContinue: {
    id: 'v2.changeModal.continue',
    defaultMessage: 'Continue',
    description: 'The label for continue button of change modal'
  },
  changeModalTitle: {
    id: 'v2.changeModal.title',
    defaultMessage: 'Edit declaration?',
    description: 'The title for change modal'
  },
  changeModalDescription: {
    id: 'v2.changeModal.description',
    defaultMessage: 'A record will be created of any changes you make',
    description: 'The description for change modal'
  }
})

interface Stringifiable {
  toString(): string
}

const FIELD_TYPE_FORMATTERS: Partial<
  Record<
    FieldConfig['type'],
    null | ((props: { value: Stringifiable }) => JSX.Element)
  >
> = {
  FILE: FileOutput
}

function DefaultOutput<T extends Stringifiable>({ value }: { value: T }) {
  return <>{value.toString() || ''}</>
}

function Output({
  field,
  value,
  previousValue,
  showPreviouslyMissingValuesAsChanged = true
}: {
  field: FieldConfig
  value: string
  previousValue?: string
  showPreviouslyMissingValuesAsChanged: boolean
}) {
  const ValueOutput = FIELD_TYPE_FORMATTERS[field.type] || DefaultOutput

  if (!value) {
    if (previousValue) {
      return <ValueOutput value={previousValue} />
    }

    return ''
  }

  if (previousValue && previousValue !== value) {
    return (
      <>
        <Deleted>
          <ValueOutput value={previousValue} />
        </Deleted>
        <br />
        <ValueOutput value={value} />
      </>
    )
  }
  if (!previousValue && value && showPreviouslyMissingValuesAsChanged) {
    return (
      <>
        <Deleted>
          <ValueOutput value={'-'} />
        </Deleted>
        <br />
        <ValueOutput value={value} />
      </>
    )
  }

  return <ValueOutput value={value} />
}

/**
 * Review component, used to display the "read" version of the form.
 * User can review the data and take actions like declare, reject or edit the data.
 */
function ReviewComponent({
  eventConfig,
  formConfig,
  previousFormValues,
  form,
  onEdit,
  children,
  title
}: {
  children: React.ReactNode
  eventConfig: EventConfig
  formConfig: FormConfig
  form: ActionFormData
  previousFormValues?: EventIndex['data']
  onEdit: ({ pageId, fieldId }: { pageId: string; fieldId?: string }) => void
  title: string
}) {
  const intl = useIntl()

  const { toString } = useTransformer(eventConfig.id)

  const stringifiedForm = toString(form)

  const showPreviouslyMissingValuesAsChanged = previousFormValues !== undefined
  const stringifiedPreviousForm = previousFormValues
    ? toString(previousFormValues)
    : {}

  return (
    <Row>
      <LeftColumn>
        <Card>
          <HeaderContainer>
            <HeaderContent>
              <Stack
                alignItems="flex-start"
                direction="column"
                gap={6}
                justify-content="flex-start"
              >
                <TitleContainer id={`header_title`}>
                  {eventConfig.label.defaultMessage}
                </TitleContainer>
                <SubjectContainer id={`header_subject`}>
                  {title}
                </SubjectContainer>
              </Stack>
            </HeaderContent>
          </HeaderContainer>
          <FormData>
            <ReviewContainter>
              {formConfig.pages.map((page) => {
                return (
                  <DeclarationDataContainer
                    key={'Section_' + page.title.defaultMessage}
                  >
                    <Accordion
                      action={
                        <Link
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit({ pageId: page.id })
                          }}
                        >
                          {intl.formatMessage(reviewMessages.changeButton)}
                        </Link>
                      }
                      expand={true}
                      label={intl.formatMessage(page.title)}
                      labelForHideAction="Hide"
                      labelForShowAction="Show"
                      name={'Accordion_' + page.id}
                    >
                      <ListReview id={'Section_' + page.id}>
                        {page.fields
                          .filter(
                            (field) =>
                              // Formatters can explicitly define themselves to be null
                              // this means a value display row in not rendered at all
                              // An example of this is FileInput, of which files we do not want to render in the value lists
                              FIELD_TYPE_FORMATTERS[field.type] !== null
                          )
                          .filter((field) => isFormFieldVisible(field, form))
                          .map((field) => {
                            const value = stringifiedForm[field.id]
                            const previousValue =
                              stringifiedPreviousForm[field.id]

                            const valueDisplay = (
                              <Output
                                field={field}
                                previousValue={previousValue}
                                showPreviouslyMissingValuesAsChanged={
                                  showPreviouslyMissingValuesAsChanged
                                }
                                value={value}
                              />
                            )

                            return (
                              <ListReview.Row
                                key={field.id}
                                actions={
                                  <Link
                                    onClick={(e) => {
                                      e.stopPropagation()

                                      onEdit({
                                        pageId: page.id,
                                        fieldId: field.id
                                      })
                                    }}
                                  >
                                    {intl.formatMessage(
                                      reviewMessages.changeButton
                                    )}
                                  </Link>
                                }
                                id={field.id}
                                label={intl.formatMessage(field.label)}
                                value={valueDisplay}
                              />
                            )
                          })}
                      </ListReview>
                    </Accordion>
                  </DeclarationDataContainer>
                )
              })}
            </ReviewContainter>
          </FormData>
        </Card>
        {children}
      </LeftColumn>
    </Row>
  )
}

const Container = styled.div`
  position: relative;
  margin-top: 48px;
  border-top: 1px solid ${({ theme }) => theme.colors.grey300};
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    max-width: 100vw;
  }
`
const Content = styled.div`
  z-index: 1;
  padding: 32px;
  position: relative;
  white-space: pre-wrap;
  color: ${({ theme }) => theme.colors.copy};
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    padding: 24px;
    padding-bottom: 32px;
  }
`
const UnderLayBackground = styled.div<{ background: string }>`
  background-color: ${({ background, theme }) => {
    if (background === 'error') {
      return theme.colors.redLighter
    }

    return theme.colors.greenLighter
  }};
`

const Title = styled.div`
  ${({ theme }) => theme.fonts.h2}
  margin-bottom: 12px;
`
const Description = styled.div`
  ${({ theme }) => theme.fonts.reg18};
  margin-bottom: 32px;
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    ${({ theme }) => theme.fonts.reg16}
  }
`

const ActionContainer = styled.div`
  display: flex;
  flex-flow: row wrap;
  align-items: center;

  button:first-child {
    margin-right: 16px;
  }

  & > button {
    margin-bottom: 8px;
  }
`

function PreviewActionComponent({
  onConfirm,
  onReject,
  messages
}: {
  onConfirm: () => void
  onReject?: () => void
  messages: {
    title: MessageDescriptor
    description: MessageDescriptor
    onConfirm: MessageDescriptor
  }
}) {
  const intl = useIntl()
  return (
    <Container>
      <UnderLayBackground background="success">
        <Content>
          <Title>{intl.formatMessage(messages.title)}</Title>
          <Description>{intl.formatMessage(messages.description)}</Description>
          <ActionContainer>
            <Button
              id="validateDeclarationBtn"
              size="large"
              type="positive"
              onClick={onConfirm}
            >
              <Icon name="Check" />
              {intl.formatMessage(messages.onConfirm)}
            </Button>
          </ActionContainer>
        </Content>
      </UnderLayBackground>
    </Container>
  )
}

function EditModal({
  copy,
  close
}: {
  copy?: {
    cancel?: MessageDescriptor
    continue?: MessageDescriptor
    title?: MessageDescriptor
    description?: MessageDescriptor
  }
  close: (result: boolean | null) => void
}) {
  const intl = useIntl()
  return (
    <ResponsiveModal
      autoHeight
      actions={[
        <Button
          key="cancel_edit"
          id="cancel_edit"
          type="tertiary"
          onClick={() => {
            close(null)
          }}
        >
          {intl.formatMessage(copy?.cancel || reviewMessages.changeModalCancel)}
        </Button>,
        <Button
          key="confirm_edit"
          id="confirm_edit"
          type="primary"
          onClick={() => {
            close(true)
          }}
        >
          {intl.formatMessage(
            copy?.continue || reviewMessages.changeModalContinue
          )}
        </Button>
      ]}
      handleClose={() => close(null)}
      responsive={false}
      show={true}
      title={intl.formatMessage(copy?.title || reviewMessages.changeModalTitle)}
    >
      <Stack>
        <Text color="grey500" element="p" variant="reg16">
          {intl.formatMessage(
            copy?.description || reviewMessages.changeModalDescription
          )}
        </Text>
      </Stack>
    </ResponsiveModal>
  )
}

function ActionModal({
  copy,
  close,
  action
}: {
  copy?: {
    cancel?: MessageDescriptor
    primaryAction?: MessageDescriptor
    title?: MessageDescriptor
    description?: MessageDescriptor
  }
  close: (result: boolean | null) => void
  action: string
}) {
  const intl = useIntl()
  return (
    <ResponsiveModal
      autoHeight
      actions={[
        <Button
          key={'cancel_' + action}
          id={'cancel_' + action}
          type="tertiary"
          onClick={() => {
            close(null)
          }}
        >
          {intl.formatMessage(copy?.cancel || reviewMessages.actionModalCancel)}
        </Button>,
        <Button
          key={'confirm_' + action}
          id={'confirm_' + action}
          type="primary"
          onClick={() => {
            close(true)
          }}
        >
          {intl.formatMessage(
            copy?.primaryAction || reviewMessages.actionModalPrimaryAction,
            {
              action
            }
          )}
        </Button>
      ]}
      handleClose={() => close(null)}
      responsive={false}
      show={true}
      title={intl.formatMessage(
        copy?.title || reviewMessages.actionModalTitle,
        { action }
      )}
    >
      <Stack>
        <Text color="grey500" element="p" variant="reg16">
          {intl.formatMessage(
            copy?.description || reviewMessages.actionModalDescription
          )}
        </Text>
      </Stack>
    </ResponsiveModal>
  )
}

export const Review = {
  Body: ReviewComponent,
  Actions: PreviewActionComponent,
  EditModal: EditModal,
  ActionModal: ActionModal
}

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
import { ResponsiveModal } from '@opencrvs/components/lib/interface'
import {
  TertiaryButton,
  DangerButton,
  SuccessButton
} from '@opencrvs/components/lib/buttons'
import { injectIntl, WrappedComponentProps } from 'react-intl'
import { buttonMessages } from '@client/i18n/messages'
import { GQLUser, GQLHumanName } from '@opencrvs/gateway/src/graphql/schema'
import { messages } from '@client/i18n/messages/views/sysAdmin'
import { createNamesMap } from '@client/utils/data-formatting'
import { LANG_EN } from '@client/utils/constants'
import { IUserAuditForm } from '@client/user/user-audit'
import { IStoreState } from '@client/store'
import { connect } from 'react-redux'
import { FormFieldGenerator } from '@client/components/form'
import styled from '@client/styledComponents'
import { IFormSectionData } from '@client/forms'
import { hasFormError } from '@client/forms/utils'
import { ErrorText } from '@opencrvs/components/lib/forms/ErrorText'
import { USER_AUDIT_ACTION } from '@client/user/queries'
import { Dispatch } from 'redux'
import {
  showUserAuditSuccessToast,
  showSubmitFormErrorToast
} from '@client/notification/actions'
import { TOAST_MESSAGES } from '@client/user/userReducer'
import { RefetchQueryDescription } from 'apollo-client/core/watchQueryOptions'
import { withApollo, WithApolloClient } from 'react-apollo'

const { useState, useEffect } = React

interface ConnectProps {
  form: IUserAuditForm
}

interface DispatchProps {
  showSuccessToast: typeof showUserAuditSuccessToast
  showErrorToast: () => void
}

interface ToggleUserActivationModalProps
  extends WrappedComponentProps,
    ConnectProps,
    DispatchProps {
  user: GQLUser | null
  show: boolean
  onConfirmRefetchQueries?: RefetchQueryDescription
  onClose: () => void
}

interface IUserAuditVariables {
  userId: string
  action: string
  reason: string
  comment: string
}

const Subtitle = styled.h2`
  ${({ theme }) => theme.fonts.bigBodyStyle};
  color: ${({ theme }) => theme.colors.copy};
  padding-bottom: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.dividerDark};
`

export enum AUDIT_ACTION {
  DEACTIVATE = 'DEACTIVATE',
  REACTIVATE = 'REACTIVATE'
}
const statusActionMap = {
  active: AUDIT_ACTION.DEACTIVATE,
  deactivated: AUDIT_ACTION.REACTIVATE
}

type AuditStatus = keyof typeof statusActionMap

function isValidAuditStatus(status: string): status is AuditStatus {
  return Object.keys(statusActionMap).includes(status)
}

let makeAllFieldsDirty: (touched: {}) => void

function UserAuditActionModalComponent(
  props: ToggleUserActivationModalProps & WithApolloClient<{}>
) {
  const { intl, user, onClose, show, form } = props
  const [formValues, setFormValues] = useState<IFormSectionData>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isErrorVisible, makeErrorVisible] = useState<boolean>(false)

  let name = ''
  let modalTitle = ''
  let modalSubtitle = ''
  const actions = [
    <TertiaryButton id="modal-cancel" onClick={onClose}>
      {intl.formatMessage(buttonMessages.cancel)}
    </TertiaryButton>
  ]

  if (user) {
    name =
      (createNamesMap(user.name as GQLHumanName[])[intl.locale] as string) ||
      (createNamesMap(user.name as GQLHumanName[])[LANG_EN] as string)
  }

  useEffect(() => {
    if (
      hasFormError(props.form.fields, formValues, undefined, { formValues })
    ) {
      setFormError(intl.formatMessage(messages.formError))
    } else {
      setFormError(null)
    }
  }, [props.form.fields, formValues, intl])

  useEffect(() => {
    function cleanUpFormState() {
      makeErrorVisible(false)
      setFormValues({})
    }

    function injectAuditActionToFormValues() {
      const action =
        user && user.status && isValidAuditStatus(user.status)
          ? statusActionMap[user.status]
          : AUDIT_ACTION.DEACTIVATE
      setFormValues({ action })
    }

    if (!props.show) {
      cleanUpFormState()
    } else {
      injectAuditActionToFormValues()
    }
  }, [props.show, user])

  function handleConfirm() {
    if (makeAllFieldsDirty) {
      const touched = props.form.fields.reduce(
        (memo, field) => ({ ...memo, [field.name]: true }),
        {}
      )
      makeAllFieldsDirty(touched)
    }
    makeErrorVisible(true)
    if (!formError) {
      const userId = (props.user && (props.user.id as string)) || ''

      props.client
        .mutate({
          mutation: USER_AUDIT_ACTION,
          variables: {
            userId,
            ...(formValues as {
              reason: string
              comment: string
              action: AUDIT_ACTION
            })
          } as IUserAuditVariables,
          refetchQueries: props.onConfirmRefetchQueries
        })
        .then(() =>
          props.showSuccessToast(name, formValues.action as AUDIT_ACTION)
        )
        .catch(() => props.showErrorToast())
      onClose()
    }
  }

  if (user && user.status === 'active') {
    actions.push(
      <DangerButton id="deactivate-action" onClick={handleConfirm}>
        {intl.formatMessage(buttonMessages.deactivate)}
      </DangerButton>
    )

    modalTitle = intl.formatMessage(messages.deactivateUserTitle, { name })
    modalSubtitle = intl.formatMessage(messages.deactivateUserSubtitle, {
      name
    })
  }

  if (user && user.status === 'deactivated') {
    actions.push(
      <SuccessButton id="reactivate-action" onClick={handleConfirm}>
        {intl.formatMessage(buttonMessages.reactivate)}
      </SuccessButton>
    )

    modalTitle = intl.formatMessage(messages.reactivateUserTitle, { name })
    modalSubtitle = intl.formatMessage(messages.reactivateUserSubtitle, {
      name
    })
  }

  return (
    <ResponsiveModal
      id="user-audit-modal"
      title={modalTitle}
      hideHeaderBoxShadow
      show={show}
      contentHeight={432}
      width={920}
      handleClose={onClose}
      responsive
      actions={actions}
    >
      <Subtitle id="modal-subtitle">{modalSubtitle}</Subtitle>
      {formError && isErrorVisible && (
        <ErrorText id="form-error">{formError}</ErrorText>
      )}
      <FormFieldGenerator
        id="user-audit-form"
        fields={form.fields}
        onChange={values => setFormValues({ ...formValues, ...values })}
        setAllFieldsDirty={false}
        draftData={{ formValues }}
        onSetTouched={onSetTouchedCallback => {
          makeAllFieldsDirty = onSetTouchedCallback
        }}
      />
    </ResponsiveModal>
  )
}

function mapStateToProps(state: IStoreState) {
  const { userAuditForm } = state.userForm
  return {
    form: userAuditForm
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    showSuccessToast: (userFullName: string, auditAction: AUDIT_ACTION) =>
      dispatch(showUserAuditSuccessToast(userFullName, auditAction)),
    showErrorToast: () =>
      dispatch(showSubmitFormErrorToast(TOAST_MESSAGES.FAIL))
  }
}

export const UserAuditActionModal = connect(
  mapStateToProps,
  mapDispatchToProps
)(injectIntl(withApollo(UserAuditActionModalComponent)))

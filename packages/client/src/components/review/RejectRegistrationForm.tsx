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
import styled from '@client/styledComponents'
import { ResponsiveModal } from '@opencrvs/components/lib/interface'
import { FormFieldGenerator } from '@client/components/form'
import { IFormSectionData, Event, Action } from '@client/forms'
import { hasFormError } from '@client/forms/utils'
import { IRejectRegistrationForm } from '@opencrvs/client/src/review/reject-registration'
import { getRejectForm } from '@opencrvs/client/src/review/selectors'
import { IStoreState } from '@opencrvs/client/src/store'
import { WrappedComponentProps as IntlShapeProps, injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { IApplication, IPayload, SUBMISSION_STATUS } from '@client/applications'
import { PrimaryButton, TertiaryButton } from '@opencrvs/components/lib/buttons'
import { goToSearchResult } from '@client/navigation'
import { buttonMessages } from '@client/i18n/messages'
import { messages } from '@client/i18n/messages/views/reject'

const Instruction = styled.div`
  margin-bottom: 28px;
`
interface IState {
  data: IFormSectionData
  enableUploadButton: boolean
}
interface IProps {
  draftId: string
  application: IApplication
  event: Event
  duplicate?: boolean
  onClose: () => void
  confirmRejectionEvent: (
    application: IApplication,
    status: string,
    action: string,
    payload: IPayload
  ) => void
}

type IFullProps = IntlShapeProps & IProps & { form: IRejectRegistrationForm }

class RejectRegistrationView extends React.Component<IFullProps, IState> {
  constructor(props: IFullProps) {
    super(props)
    this.state = {
      data: {},
      enableUploadButton: false
    }
  }

  storeData = (rejectionFormData: IFormSectionData) => {
    this.setState(
      () => ({ data: rejectionFormData }),
      () =>
        this.setState(() => ({
          enableUploadButton: this.shouldEnableUploadButton(rejectionFormData)
        }))
    )
  }

  shouldEnableUploadButton = (rejectionFormData: IFormSectionData) => {
    return (
      rejectionFormData &&
      !hasFormError(this.props.form.fields, rejectionFormData)
    )
  }

  processSubmitData = () => {
    const reasons = this.state.data.rejectionReason as string[]
    let reason
    if (reasons) {
      reason = reasons.join()
    } else {
      reason = ''
    }
    return {
      id: this.props.draftId,
      reason,
      comment: this.state.data.rejectionCommentForHealthWorker
    }
  }

  render = () => {
    const {
      application,
      form,
      intl,
      confirmRejectionEvent,
      duplicate
    } = this.props
    const payload = this.processSubmitData()
    const { fields } = form
    if (duplicate) {
      fields.map(field => {
        if (field.name === 'rejectionReason') {
          field.initialValue = ['duplicate']
        }
        return field
      })
    }

    return (
      <div id="reject-registration-form-container">
        <ResponsiveModal
          title={intl.formatMessage(messages.rejectionFormTitle)}
          show={true}
          width={918}
          contentHeight={480}
          handleClose={this.props.onClose}
          actions={[
            <TertiaryButton
              id="cancel"
              key="cancel"
              onClick={this.props.onClose}
            >
              {intl.formatMessage(buttonMessages.cancel)}
            </TertiaryButton>,
            <PrimaryButton
              id="submit_reject_form"
              onClick={() =>
                confirmRejectionEvent(
                  application,
                  SUBMISSION_STATUS.READY_TO_REJECT,
                  Action.REJECT_APPLICATION,
                  payload
                )
              }
              disabled={!this.state.enableUploadButton}
            >
              {intl.formatMessage(buttonMessages.confirm)}
            </PrimaryButton>
          ]}
        >
          <Instruction>
            {intl.formatMessage(messages.rejectionFormInstruction)}
          </Instruction>
          <FormFieldGenerator
            id="reject_form"
            fields={fields}
            onChange={this.storeData}
            setAllFieldsDirty={false}
          />
        </ResponsiveModal>
      </div>
    )
  }
}

export const RejectRegistrationForm = connect(
  (state: IStoreState) => ({
    language: state.i18n.language,
    form: getRejectForm(state)
  }),
  {
    goToSearchResult
  }
)(injectIntl(RejectRegistrationView))

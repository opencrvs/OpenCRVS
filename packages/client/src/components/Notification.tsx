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
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router'
import { messages } from '@client/i18n/messages/views/notifications'
import { WrappedComponentProps as IntlShapeProps, injectIntl } from 'react-intl'
import { getLanguage } from '@opencrvs/client/src/i18n/selectors'
import { IStoreState } from '@opencrvs/client/src/store'
import {
  Notification,
  NOTIFICATION_TYPE,
  FloatingNotification
} from '@opencrvs/components/lib/interface'
import {
  hideBackgroundSyncedNotification,
  hideConfigurationErrorNotification,
  toggleDraftSavedNotification,
  hideSubmitFormSuccessToast,
  hideSubmitFormErrorToast,
  hideUserAuditSuccessToast,
  hidePINUpdateSuccessToast
} from '@client/notification/actions'
import { TOAST_MESSAGES } from '@client/user/userReducer'
import { NotificationState } from '@client/notification/reducer'

type NotificationProps = {
  language?: string
  configurationErrorVisible: boolean
  backgroundSyncMessageVisible: boolean
  saveDraftClicked: boolean
  submitFormSuccessToast: string | null
  submitFormErrorToast: string | null
  userAuditSuccessToast: NotificationState['userAuditSuccessToast']
  showPINUpdateSuccess: boolean
}

type DispatchProps = {
  hideBackgroundSyncedNotification: typeof hideBackgroundSyncedNotification
  hideConfigurationErrorNotification: typeof hideConfigurationErrorNotification
  hideSubmitFormSuccessToast: typeof hideSubmitFormSuccessToast
  hideSubmitFormErrorToast: typeof hideSubmitFormErrorToast
  toggleDraftSavedNotification: typeof toggleDraftSavedNotification
  hideUserAuditSuccessToast: typeof hideUserAuditSuccessToast
  hidePINUpdateSuccessToast: typeof hidePINUpdateSuccessToast
}

class Component extends React.Component<
  NotificationProps & DispatchProps & IntlShapeProps & RouteComponentProps<{}>
> {
  hideBackgroundSyncedNotification = () => {
    this.props.hideBackgroundSyncedNotification()
  }

  hideConfigurationErrorNotification = () => {
    this.props.hideConfigurationErrorNotification()
  }

  hideDraftsSavedNotification = () => {
    this.props.toggleDraftSavedNotification()
  }

  hideSubmitFormSuccessToast = () => {
    this.props.hideSubmitFormSuccessToast()
  }

  hideSubmitFormErrorToast = () => {
    this.props.hideSubmitFormErrorToast()
  }

  hideUserAuditSuccessToast = () => {
    this.props.hideUserAuditSuccessToast()
  }

  render() {
    const {
      children,
      backgroundSyncMessageVisible,
      configurationErrorVisible,
      intl,
      saveDraftClicked,
      submitFormSuccessToast,
      submitFormErrorToast,
      userAuditSuccessToast,
      showPINUpdateSuccess
    } = this.props

    return (
      <div>
        {children}
        {backgroundSyncMessageVisible && (
          <Notification
            id="backgroundSyncShowNotification"
            show={backgroundSyncMessageVisible}
            callback={this.hideBackgroundSyncedNotification}
          >
            {intl.formatMessage(messages.declarationsSynced)}
          </Notification>
        )}
        {configurationErrorVisible && (
          <Notification
            type={NOTIFICATION_TYPE.ERROR}
            id="configErrorShowNotification"
            show={configurationErrorVisible}
            callback={this.hideConfigurationErrorNotification}
          >
            OpenCRVS has been only partially configured - Awaiting facilities
            and locations
          </Notification>
        )}
        {saveDraftClicked && (
          <Notification
            id="draftsSavedNotification"
            show={saveDraftClicked}
            callback={this.hideDraftsSavedNotification}
          >
            {intl.formatMessage(messages.draftsSaved)}
          </Notification>
        )}

        {submitFormSuccessToast && (
          <FloatingNotification
            id="submissionSuccessToast"
            show={Boolean(submitFormSuccessToast)}
            type={NOTIFICATION_TYPE.SUCCESS}
            callback={this.hideSubmitFormSuccessToast}
          >
            {submitFormSuccessToast === TOAST_MESSAGES.UPDATE_SUCCESS
              ? intl.formatMessage(messages.userFormUpdateSuccess)
              : intl.formatMessage(messages.userFormSuccess)}
          </FloatingNotification>
        )}

        {submitFormErrorToast && (
          <FloatingNotification
            id="submissionErrorToast"
            show={Boolean(submitFormErrorToast)}
            type={NOTIFICATION_TYPE.ERROR}
            callback={this.hideSubmitFormErrorToast}
          >
            {intl.formatMessage(messages.userFormFail)}
          </FloatingNotification>
        )}
        {userAuditSuccessToast.visible && (
          <FloatingNotification
            id="userAuditSuccessToast"
            show={userAuditSuccessToast.visible}
            type={NOTIFICATION_TYPE.SUCCESS}
            callback={this.hideUserAuditSuccessToast}
          >
            {intl.formatMessage(messages.userAuditSuccess, {
              name: userAuditSuccessToast.userFullName,
              action: userAuditSuccessToast.action
            })}
          </FloatingNotification>
        )}
        {showPINUpdateSuccess && (
          <FloatingNotification
            id="PINUpdateSuccessToast"
            show={showPINUpdateSuccess}
            type={NOTIFICATION_TYPE.SUCCESS}
            callback={this.props.hidePINUpdateSuccessToast}
          >
            {intl.formatMessage(messages.updatePINSuccess)}
          </FloatingNotification>
        )}
        {/* More notification types can be added here */}
      </div>
    )
  }
}

const mapStateToProps = (store: IStoreState) => {
  return {
    language: getLanguage(store),
    backgroundSyncMessageVisible:
      store.notification.backgroundSyncMessageVisible,
    configurationErrorVisible: store.notification.configurationErrorVisible,
    saveDraftClicked: store.notification.saveDraftClicked,
    submitFormSuccessToast: store.notification.submitFormSuccessToast,
    submitFormErrorToast: store.notification.submitFormErrorToast,
    userAuditSuccessToast: store.notification.userAuditSuccessToast,
    showPINUpdateSuccess: store.notification.showPINUpdateSuccess
  }
}

export const NotificationComponent = withRouter(
  connect<NotificationProps, DispatchProps, {}, IStoreState>(mapStateToProps, {
    hideBackgroundSyncedNotification,
    hideConfigurationErrorNotification,
    hideSubmitFormSuccessToast,
    hideSubmitFormErrorToast,
    toggleDraftSavedNotification,
    hideUserAuditSuccessToast,
    hidePINUpdateSuccessToast
  })(injectIntl(Component))
)

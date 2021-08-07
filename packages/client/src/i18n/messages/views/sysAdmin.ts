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
import { defineMessages, MessageDescriptor } from 'react-intl'

interface ISysAdminMessages extends Record<string, MessageDescriptor> {
  auditReason: MessageDescriptor
  auditReasonOther: MessageDescriptor
  overviewTab: MessageDescriptor
  officesTab: MessageDescriptor
  usersTab: MessageDescriptor
  comments: MessageDescriptor
  deactivate: MessageDescriptor
  deactivateReasonNotEmployee: MessageDescriptor
  deactivateReasonInvestigated: MessageDescriptor
  deactivateUserTitle: MessageDescriptor
  deactivateUserSubtitle: MessageDescriptor
  devicesTab: MessageDescriptor
  formError: MessageDescriptor
  networkTab: MessageDescriptor
  configTab: MessageDescriptor
  systemTitle: MessageDescriptor
  editUserDetailsTitle: MessageDescriptor
  editUserCommonTitle: MessageDescriptor
  reactivate: MessageDescriptor
  reactivateUserTitle: MessageDescriptor
  reactivateUserSubtitle: MessageDescriptor
  reactivateReasonReturnedToRole: MessageDescriptor
  reactivateReasonNoLongerInvestigated: MessageDescriptor
  resendSMS: MessageDescriptor
  resendSMSSuccess: MessageDescriptor
  resendSMSError: MessageDescriptor
}

const messagesToDefine: ISysAdminMessages = {
  auditReason: {
    id: 'sysAdHome.user.audit.reason',
    defaultMessage: 'Please provide a reason: ',
    description: 'The label for form field deactivate reason'
  },
  auditReasonOther: {
    id: 'sysAdHome.user.audit.reasonOther',
    defaultMessage: 'Other (please provide a reason in the comments)',
    description: 'The label for radio option other'
  },
  overviewTab: {
    id: 'sysAdHome.overview',
    defaultMessage: 'Overview',
    description: 'The title of overview tab'
  },
  officesTab: {
    id: 'sysAdHome.offices',
    defaultMessage: 'Offices',
    description: 'The title of offices tab'
  },
  usersTab: {
    id: 'sysAdHome.users',
    defaultMessage: 'Users',
    description: 'The title of users tab'
  },
  comments: {
    id: 'sysAdHome.user.audit.comments',
    defaultMessage: 'Comments: ',
    description: 'The label for form field deactivate comments'
  },
  deactivate: {
    defaultMessage: 'Deactivate',
    description: 'Label for toggle menu option deactivate',
    id: 'sysAdHome.user.deactivate'
  },
  deactivateReasonNotEmployee: {
    id: 'sysAdHome.user.audit.deactiv.reasonNotEmp',
    defaultMessage: 'No longer an employee',
    description: 'The label for radio option not employee'
  },
  deactivateReasonInvestigated: {
    id: 'sysAdHome.user.audit.deactiv.reasonInv',
    defaultMessage:
      'Being investigated due to suspicious activity on their account',
    description: 'The label for radio option being investigated'
  },
  deactivateUserTitle: {
    id: 'sysAdHome.user.audit.deactivation.title',
    defaultMessage: 'Deactivate {name}?',
    description: 'The title of user deactivation confirmation modal'
  },
  deactivateUserSubtitle: {
    id: 'sysAdHome.user.audit.deactivation.subtitle',
    defaultMessage:
      'This will revoke {name}’s ability to login and access the system. The account can be reactivated at a later date.',
    description: 'The subtitle of user deactivation confirmation modal'
  },
  devicesTab: {
    id: 'sysAdHome.devices',
    defaultMessage: 'Devices',
    description: 'The title of devices tab'
  },
  formError: {
    id: 'sysAdHome.user.audit.form.error',
    defaultMessage: 'Please complete all mandatory fields',
    description: 'The label for form error'
  },
  networkTab: {
    id: 'sysAdHome.network',
    defaultMessage: 'Network',
    description: 'The title of network tab'
  },
  configTab: {
    id: 'sysAdHome.config',
    defaultMessage: 'Config',
    description: 'The title of config tab'
  },
  systemTitle: {
    id: 'home.header.systemTitle',
    defaultMessage: 'System',
    description: 'System title'
  },
  editUserDetailsTitle: {
    defaultMessage: 'Edit details',
    description: 'Title for edit user details',
    id: 'sysAdHome.user.header'
  },
  editUserCommonTitle: {
    defaultMessage: 'Edit user',
    description: 'Common title of form view groups when edit user',
    id: 'sysAdHome.user.edit.commonGroupTitle'
  },
  reactivateUserTitle: {
    id: 'sysAdHome.user.audit.reactivation.title',
    defaultMessage: 'Reactivate {name}?',
    description: 'The title of user reactivation confirmation modal'
  },
  reactivateUserSubtitle: {
    id: 'sysAdHome.user.audit.reactivation.subtitle',
    defaultMessage:
      'This will reactivate {name}’s ability to login and access the system.',
    description: 'The subtitle of user reactivation confirmation modal'
  },
  reactivate: {
    defaultMessage: 'Reactivate',
    description: 'Label for toggle menu option reactivate',
    id: 'sysAdHome.user.reactivate'
  },
  reactivateReasonReturnedToRole: {
    defaultMessage: 'Returned to their role',
    description: 'The label for radio option Returned to role',
    id: 'sysAdHome.user.audit.reactiv.returned'
  },
  reactivateReasonNoLongerInvestigated: {
    defaultMessage: 'No longer being investigated for suspicious activity',
    description: 'The label for radio option no longer investigated',
    id: 'sysAdHome.user.audit.reactiv.noLongerInv'
  },
  resendSMS: {
    defaultMessage: 'Resend SMS invite',
    description: 'The label for menu option resend SMS',
    id: 'sysAdHome.resendSMS'
  },
  resendSMSSuccess: {
    defaultMessage: 'Invite sent',
    description: 'The label for success notification of resend sms invite',
    id: 'sysAdHome.resendSMSSuccess'
  },
  resendSMSError: {
    defaultMessage: 'Invite could not be sent',
    description: 'The label for error notification of resend sms invite',
    id: 'sysAdHome.resendSMSError'
  }
}

export const messages: ISysAdminMessages = defineMessages(messagesToDefine)

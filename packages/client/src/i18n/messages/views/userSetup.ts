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

interface IUserSetupMessages extends Record<string, MessageDescriptor> {
  confirmPassword: MessageDescriptor
  hasCases: MessageDescriptor
  hasNumber: MessageDescriptor
  header: MessageDescriptor
  instruction: MessageDescriptor
  labelAssignedOffice: MessageDescriptor
  labelBanglaName: MessageDescriptor
  labelEnglishName: MessageDescriptor
  match: MessageDescriptor
  minLength: MessageDescriptor
  mismatch: MessageDescriptor
  newPassword: MessageDescriptor
  passwordRequired: MessageDescriptor
  setupCompleteTitle: MessageDescriptor
  userSetupInstruction: MessageDescriptor
  userSetupIntroduction: MessageDescriptor
  userSetupRevieTitle: MessageDescriptor
  userSetupReviewHeader: MessageDescriptor
  userSetupReviewInstruction: MessageDescriptor
  userSetupWelcomeTitle: MessageDescriptor
  validationMsg: MessageDescriptor
  waiting: MessageDescriptor
  assignedOffice: MessageDescriptor
  roleType: MessageDescriptor
  phoneNumber: MessageDescriptor
  userName: MessageDescriptor
  startDate: MessageDescriptor
  auditSectionTitle: MessageDescriptor
  auditActionColumnTitle: MessageDescriptor
  auditTrackingIDColumnTitle: MessageDescriptor
  auditEventTypeColumnTitle: MessageDescriptor
  auditDateColumnTitle: MessageDescriptor
  noAuditFound: MessageDescriptor
  inProgressAuditAction: MessageDescriptor
  declaredAuditAction: MessageDescriptor
  validatedAuditAction: MessageDescriptor
  waitingForValidationAuditAction: MessageDescriptor
  registeredAuditAction: MessageDescriptor
  rejectedAuditAction: MessageDescriptor
  certifiedAuditAction: MessageDescriptor
  showMoreAuditList: MessageDescriptor
}

const messagesToDefine: IUserSetupMessages = {
  confirmPassword: {
    defaultMessage: 'Confirm new password',
    description: 'Confirm password label',
    id: 'password.label.confirm'
  },
  hasCases: {
    defaultMessage: 'Contain upper and lower cases',
    description: 'Password validation',
    id: 'password.cases'
  },
  hasNumber: {
    defaultMessage: 'At least one number',
    description: 'Password validation',
    id: 'password.number'
  },
  header: {
    defaultMessage: 'Choose a new password',
    description: 'New Password header',
    id: 'misc.newPass.header'
  },
  instruction: {
    defaultMessage:
      'We recommend you create a unique password - one that you don’t use for another website or app. Note. You can’t reuse your old password once you change it.',
    description: 'New Password instruction',
    id: 'misc.newPass.instruction'
  },
  labelAssignedOffice: {
    defaultMessage: 'Assigned office',
    description: 'Assigned office',
    id: 'settings.user.label.assignedOffice'
  },
  labelBanglaName: {
    defaultMessage: 'Bengali name',
    id: 'settings.user.label.nameBN'
  },
  labelEnglishName: {
    defaultMessage: 'English name',
    id: 'settings.user.label.nameEN'
  },
  match: {
    defaultMessage: 'Passwords match',
    description: 'Password validation',
    id: 'password.match'
  },
  minLength: {
    defaultMessage: '{min} characters minimum',
    description: 'Password validation',
    id: 'password.minLength'
  },
  mismatch: {
    defaultMessage: 'Passwords do not match',
    description: 'Password validation',
    id: 'password.mismatch'
  },
  newPassword: {
    defaultMessage: 'New password:',
    description: 'New password label',
    id: 'password.label.new'
  },
  passwordRequired: {
    defaultMessage: 'New password is not valid',
    description: 'New password required',
    id: 'error.required.password'
  },
  setupCompleteTitle: {
    defaultMessage: 'Account setup complete',
    description: 'Title for the setup complete page',
    id: 'userSetup.complete.title'
  },
  userSetupInstruction: {
    defaultMessage:
      'Now login to your account with your username and newly created password',
    description: 'Instruction for the setup complete',
    id: 'userSetup.complete.instruction'
  },
  userSetupIntroduction: {
    defaultMessage:
      'You just a few steps away from completing your account set up.',
    description: 'Instruction for the account setup langing page',
    id: 'userSetup.landing.instruction'
  },
  userSetupRevieTitle: {
    defaultMessage: 'Your details',
    description: 'User setup review page title',
    id: 'userSetup.review.title'
  },
  userSetupReviewHeader: {
    defaultMessage: 'Confirm your details',
    description: 'User setup review page subtitle',
    id: 'userSetup.review.header'
  },
  userSetupReviewInstruction: {
    defaultMessage:
      'Check the details below to confirm your account details are correct. and make annecessary changes to confirm your account details are correct.',
    description: 'User setup review page instruction',
    id: 'userSetup.instruction'
  },
  userSetupWelcomeTitle: {
    defaultMessage: 'Welcome to OpenCRVS',
    description: 'Title for the landing page',
    id: 'userSetup.landing.title'
  },
  validationMsg: {
    defaultMessage: 'Password must have:',
    description: 'Password validation message',
    id: 'password.validation.msg'
  },
  waiting: {
    defaultMessage: 'Setting up your account',
    description:
      'The message that displays when the user is waiting for the account to be created',
    id: 'userSetup.waiting'
  },
  assignedOffice: {
    defaultMessage: 'Assigned registration office',
    description: 'Title for assigned office field',
    id: 'user.profile.assignedOffice'
  },
  roleType: {
    defaultMessage: 'Role/Type',
    description: 'Title for roleType field',
    id: 'user.profile.roleType'
  },
  phoneNumber: {
    defaultMessage: 'Phone number',
    description: 'Title for phoneNumber field',
    id: 'user.profile.phoneNumber'
  },
  userName: {
    defaultMessage: 'Username',
    description: 'Title for userName field',
    id: 'user.profile.userName'
  },
  startDate: {
    defaultMessage: 'Start date',
    description: 'Title for startDate field',
    id: 'user.profile.startDate'
  },
  auditSectionTitle: {
    defaultMessage: 'Audit',
    description: 'Title for audit section',
    id: 'user.profile.sectionTitle.audit'
  },
  auditActionColumnTitle: {
    defaultMessage: 'Action',
    description: 'Title for audit action column',
    id: 'user.profile.audit.column.action'
  },
  auditTrackingIDColumnTitle: {
    defaultMessage: 'Tracking ID',
    description: 'Title for audit tracking id column',
    id: 'user.profile.audit.column.trackingId'
  },
  auditEventTypeColumnTitle: {
    defaultMessage: 'Event type',
    description: 'Title for audit event type column',
    id: 'user.profile.audit.column.eventType'
  },
  auditDateColumnTitle: {
    defaultMessage: 'Date',
    description: 'Title for audit date column',
    id: 'user.profile.audit.column.date'
  },
  noAuditFound: {
    defaultMessage: 'No audits to display',
    description: 'Text for audit list',
    id: 'user.profile.audit.list.noDataFound'
  },
  inProgressAuditAction: {
    defaultMessage: 'Sent application for review - incomplete',
    description: 'Description for incomplete application',
    id: 'user.profile.audit.description.inProgress'
  },
  declaredAuditAction: {
    defaultMessage: 'Sent application for review - complete',
    description: 'Description for complete application',
    id: 'user.profile.audit.description.declared'
  },
  validatedAuditAction: {
    defaultMessage: 'Sent application for approval',
    description: 'Description for validated application',
    id: 'user.profile.audit.description.validated'
  },
  waitingForValidationAuditAction: {
    defaultMessage: 'Sent application for external system validation',
    description: 'Description for waiting for external validation application',
    id: 'user.profile.audit.description.waiting_validation'
  },
  registeredAuditAction: {
    defaultMessage: 'Registered vital event',
    description: 'Description for registered application',
    id: 'user.profile.audit.description.registered'
  },
  rejectedAuditAction: {
    defaultMessage: 'Sent application for updates',
    description: 'Description for rejected application',
    id: 'user.profile.audit.description.rejected'
  },
  certifiedAuditAction: {
    defaultMessage: 'Printed certificate',
    description: 'Description for certified application',
    id: 'user.profile.audit.description.certified'
  },
  showMoreAuditList: {
    defaultMessage: 'Show next {pageSize} of {totalItems}',
    description: 'Label for show more link',
    id: 'user.profile.auditList.showMore'
  }
}

export const messages: IUserSetupMessages = defineMessages(messagesToDefine)

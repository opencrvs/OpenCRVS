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

interface IButtonsMessages extends Record<string, MessageDescriptor> {
  back: MessageDescriptor
  apply: MessageDescriptor
  cancel: MessageDescriptor
  change: MessageDescriptor
  confirm: MessageDescriptor
  continueButton: MessageDescriptor
  createUser: MessageDescriptor
  deactivate: MessageDescriptor
  delete: MessageDescriptor
  edit: MessageDescriptor
  editRegistration: MessageDescriptor
  exitButton: MessageDescriptor
  finish: MessageDescriptor
  forgotPassword: MessageDescriptor
  forgottenPIN: MessageDescriptor
  goToHomepage: MessageDescriptor
  login: MessageDescriptor
  logout: MessageDescriptor
  next: MessageDescriptor
  no: MessageDescriptor
  preview: MessageDescriptor
  print: MessageDescriptor
  register: MessageDescriptor
  reject: MessageDescriptor
  rejectApplication: MessageDescriptor
  retry: MessageDescriptor
  review: MessageDescriptor
  save: MessageDescriptor
  saveExitButton: MessageDescriptor
  deleteApplication: MessageDescriptor
  closeApplication: MessageDescriptor
  reactivate: MessageDescriptor
  search: MessageDescriptor
  select: MessageDescriptor
  send: MessageDescriptor
  sendForReview: MessageDescriptor
  sendIncomplete: MessageDescriptor
  sendForApproval: MessageDescriptor
  settings: MessageDescriptor
  start: MessageDescriptor
  status: MessageDescriptor
  update: MessageDescriptor
  upload: MessageDescriptor
  verify: MessageDescriptor
  yes: MessageDescriptor
  approve: MessageDescriptor
  editRecord: MessageDescriptor
}

const messagesToDefine: IButtonsMessages = {
  approve: {
    id: 'buttons.approve',
    defaultMessage: 'Approve',
    description: 'Approve button text'
  },
  apply: {
    defaultMessage: 'Apply',
    description: 'Apply button label',
    id: 'buttons.apply'
  },
  back: {
    defaultMessage: 'Back',
    description: 'Back button',
    id: 'buttons.back'
  },
  cancel: {
    defaultMessage: 'Cancel',
    description: 'Cancel button text in the modal',
    id: 'buttons.cancel'
  },
  change: {
    defaultMessage: 'Change',
    description: 'Change action',
    id: 'buttons.change'
  },
  confirm: {
    defaultMessage: 'Confirm',
    description: 'Confirm button text',
    id: 'buttons.confirm'
  },
  continueButton: {
    defaultMessage: 'Continue',
    description: 'Continue Button Text',
    id: 'buttons.continue'
  },
  createUser: {
    defaultMessage: 'Create user',
    description: 'Label for submit button of user creation form',
    id: 'user.form.buttons.submit'
  },
  deactivate: {
    defaultMessage: 'Deactivate',
    description: 'Label for confirmation modal for user deactivation',
    id: 'team.user.buttons.deactivate'
  },
  delete: {
    defaultMessage: 'Delete',
    description: 'Delete button',
    id: 'buttons.delete'
  },
  edit: {
    defaultMessage: 'Edit',
    description: 'Edit button text',
    id: 'buttons.edit'
  },
  editRegistration: {
    defaultMessage: 'Edit Registration',
    description: 'Edit registration button text',
    id: 'buttons.editRegistration'
  },
  exitButton: {
    defaultMessage: 'EXIT',
    description: 'Label for Exit button on EventTopBar',
    id: 'buttons.exit'
  },
  finish: {
    defaultMessage: 'Finish',
    description: 'The label for finish printing certificate button',
    id: 'buttons.finish'
  },
  forgotPassword: {
    defaultMessage: 'Forgot password',
    description: 'The label for forgot password button',
    id: 'buttons.forgotPassword'
  },
  forgottenPIN: {
    defaultMessage: 'Forgotten pin',
    description: 'The label for forgotten pin button',
    id: 'buttons.forgottenPIN'
  },
  goToHomepage: {
    defaultMessage: 'Go to Homepage',
    description: 'Label for Go to Homepage button',
    id: 'buttons.goToHomePage'
  },
  login: {
    defaultMessage: 'Login',
    description: 'Login button on session expire modal',
    id: 'buttons.login'
  },
  logout: {
    defaultMessage: 'Logout',
    description: 'logout title',
    id: 'buttons.logout'
  },
  next: {
    defaultMessage: 'Next',
    description: 'The label for next button',
    id: 'buttons.next'
  },
  no: {
    defaultMessage: 'No',
    description: 'No button text',
    id: 'buttons.no'
  },
  preview: {
    defaultMessage: 'Preview',
    description: 'Preview button',
    id: 'buttons.preview'
  },
  print: {
    defaultMessage: 'Print',
    description: 'Print button text',
    id: 'buttons.print'
  },
  register: {
    defaultMessage: 'Register',
    description: 'Label for button on register confirmation modal',
    id: 'buttons.register'
  },
  reject: {
    defaultMessage: 'Reject',
    description: 'A label for reject link',
    id: 'buttons.reject'
  },
  rejectApplication: {
    defaultMessage: 'Reject Application',
    description: 'Reject application button text',
    id: 'buttons.rejectApplication'
  },
  retry: {
    defaultMessage: 'Retry',
    description: 'The title of retry button for failed application',
    id: 'buttons.retry'
  },
  review: {
    defaultMessage: 'Review',
    description: 'Review button text',
    id: 'buttons.review'
  },
  save: {
    defaultMessage: 'Save',
    description: 'Save Button Text',
    id: 'buttons.save'
  },
  saveExitButton: {
    defaultMessage: 'Save & Exit',
    description: 'Save & Exit Button Text',
    id: 'buttons.saveAndExit'
  },
  deleteApplication: {
    defaultMessage: 'Delete Application',
    description: 'Delete application button text',
    id: 'buttons.deleteApplication'
  },
  closeApplication: {
    defaultMessage: 'Close Application',
    description: 'Close application button text',
    id: 'buttons.closeApplication'
  },
  reactivate: {
    defaultMessage: 'Reactivate',
    description: 'Label for confirmation modal for user reactivation',
    id: 'team.user.buttons.reactivate'
  },
  search: {
    defaultMessage: 'Search',
    description: 'The title of search input submit button',
    id: 'buttons.search'
  },
  select: {
    defaultMessage: 'Select',
    description: 'The select title',
    id: 'buttons.select'
  },
  send: {
    defaultMessage: 'Send',
    description: 'Submit button on submit modal',
    id: 'buttons.send'
  },
  sendForReview: {
    defaultMessage: 'Send For Review',
    description: 'Submit Button Text',
    id: 'buttons.sendForReview'
  },
  sendIncomplete: {
    defaultMessage: 'Send incomplete',
    description: 'Title for Incomplete submit button',
    id: 'buttons.sendIncomplete'
  },
  sendForApproval: {
    defaultMessage: 'Send For Approval',
    description: 'Title for complete submit button',
    id: 'buttons.sendForApproval'
  },
  settings: {
    defaultMessage: 'Settings',
    description: 'Menu item settings',
    id: 'buttons.settings'
  },
  start: {
    defaultMessage: 'Start',
    description: 'Label of start button',
    id: 'buttons.start'
  },
  status: {
    defaultMessage: 'Status',
    description: 'Label of status button',
    id: 'buttons.status'
  },
  update: {
    defaultMessage: 'Update',
    description: 'The title of update button for draft application',
    id: 'buttons.update'
  },
  upload: {
    defaultMessage: 'Upload',
    description: 'Upload buttton',
    id: 'buttons.upload'
  },
  verify: {
    defaultMessage: 'Verify',
    description: 'Label for verify password button',
    id: 'buttons.verify'
  },
  yes: {
    defaultMessage: 'Yes',
    description: 'Yes button text',
    id: 'buttons.yes'
  },
  editRecord: {
    id: 'buttons.editRecord',
    defaultMessage: 'Edit record',
    description: 'Edit record button text on review certificate'
  }
}

export const buttonMessages: IButtonsMessages = defineMessages(messagesToDefine)

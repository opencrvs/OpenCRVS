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

interface ICertificateMessages extends Record<string, MessageDescriptor> {
  certificateCollectionTitle: MessageDescriptor
  addAnotherSignature: MessageDescriptor
  certificateConfirmationTxt: MessageDescriptor
  certificateIsCorrect: MessageDescriptor
  certificateReceiptHeader: MessageDescriptor
  certificateReceiptSubHeader: MessageDescriptor
  collectPayment: MessageDescriptor
  dateOfBirth: MessageDescriptor
  familyName: MessageDescriptor
  familyNameInEng: MessageDescriptor
  father: MessageDescriptor
  firstName: MessageDescriptor
  firstNameInEng: MessageDescriptor
  idCheckDialogCancel: MessageDescriptor
  idCheckDialogConfirm: MessageDescriptor
  idCheckDialogDescription: MessageDescriptor
  idCheckDialogTitle: MessageDescriptor
  idCheckTitle: MessageDescriptor
  idCheckVerify: MessageDescriptor
  idCheckWithoutVerify: MessageDescriptor
  informant: MessageDescriptor
  informantHasReviewedInformaiton: MessageDescriptor
  manualPaymentMethod: MessageDescriptor
  mother: MessageDescriptor
  nationality: MessageDescriptor
  next: MessageDescriptor
  noLabel: MessageDescriptor
  number: MessageDescriptor
  other: MessageDescriptor
  payment: MessageDescriptor
  paymentInstruction: MessageDescriptor
  paymentAmount: MessageDescriptor
  paymentMethod: MessageDescriptor
  person1: MessageDescriptor
  person2: MessageDescriptor
  preview: MessageDescriptor
  print: MessageDescriptor
  printCertificate: MessageDescriptor
  printReceipt: MessageDescriptor
  receiptIssuedAt: MessageDescriptor
  receiptIssuer: MessageDescriptor
  receiptPaidAmount: MessageDescriptor
  receiptService: MessageDescriptor
  selectSignature: MessageDescriptor
  service: MessageDescriptor
  amountDue: MessageDescriptor
  typeOfID: MessageDescriptor
  whoToCollect: MessageDescriptor
  confirmAndPrint: MessageDescriptor
  reviewTitle: MessageDescriptor
  reviewDescription: MessageDescriptor
  modalTitle: MessageDescriptor
  modalBody: MessageDescriptor
  toastMessage: MessageDescriptor
  otherCollectorFormTitle: MessageDescriptor
  otherCollectorFormParagraph: MessageDescriptor
  certificateCollectorError: MessageDescriptor
  certificateOtherCollectorInfoError: MessageDescriptor
  certificateOtherCollectorAffidavitFormTitle: MessageDescriptor
  certificateOtherCollectorAffidavitError: MessageDescriptor
  certificateOtherCollectorAffidavitFormParagraph: MessageDescriptor
  noSignedAffidavitAvailable: MessageDescriptor
  noAffidavitModalTitle: MessageDescriptor
  noAffidavitModalDescription: MessageDescriptor
  signedAffidavitFileLabel: MessageDescriptor
}

const messagesToDefine: ICertificateMessages = {
  addAnotherSignature: {
    defaultMessage: 'Add another',
    id: 'print.certificate.addAnotherSignature'
  },
  certificateCollectionTitle: {
    defaultMessage: 'Certificate collection',
    description: 'The title of print certificate action',
    id: 'print.certificate.section.title'
  },
  certificateConfirmationTxt: {
    defaultMessage: 'Edit',
    description: 'Edit',
    id: 'certificate.confirmCorrect'
  },
  certificateIsCorrect: {
    defaultMessage: 'Is the {event} certificate correct?',
    description:
      'Question asking the user if the information on the  certificate is correct',
    id: 'certificate.isCertificateCorrect'
  },
  certificateReceiptHeader: {
    defaultMessage: 'Receipt for {event} Certificate of',
    description: 'Receipt header for payment on certificate',
    id: 'certificate.receipt.header'
  },
  certificateReceiptSubHeader: {
    defaultMessage: '{event} Registration after {DOBDiff} of {DOE}',
    description: 'Subheader for receipt on payment on certificate',
    id: 'certificate.receipt.subheader'
  },
  collectPayment: {
    defaultMessage:
      'Please collect the payment, print the receipt and hand it over to the payee.',
    description: 'The label for collect payment paragraph',
    id: 'print.certificate.collectPayment'
  },
  dateOfBirth: {
    defaultMessage: 'Date of Birth',
    description: 'Parent Date of Birth',
    id: 'certificate.parent.details.label.dateOfBirth'
  },
  familyName: {
    defaultMessage: 'Last Name',
    description: 'Parent last name',
    id: 'certificate.parent.details.label.familyName'
  },
  familyNameInEng: {
    defaultMessage: 'Last Name(in english)',
    description: 'Parent last name',
    id: 'certificate.parent.details.label.familyNameInEng'
  },
  father: {
    defaultMessage: 'Father',
    description:
      'The label for select value when father is the collector of certificate',
    id: 'print.certificate.collector.father'
  },
  firstName: {
    defaultMessage: 'First Name(s)',
    description: 'Parent first names',
    id: 'certificate.parent.details.label.firstName'
  },
  firstNameInEng: {
    defaultMessage: 'First Name(s)(in english)',
    description: 'Parent first names',
    id: 'certificate.parent.details.label.firstNameInEng'
  },
  idCheckDialogCancel: {
    defaultMessage: 'Cancel',
    description:
      'The for the dialog when details of the collector not verified',
    id: 'print.cert.coll.id.actions.cancel'
  },
  idCheckDialogConfirm: {
    defaultMessage: 'SEND',
    description:
      'The for the dialog when details of the collector not verified',
    id: 'print.cert.coll.id.actions.send'
  },
  idCheckDialogDescription: {
    defaultMessage:
      'Please be aware that if you proceed, you will be responsible for issuing a certificate without the necessary proof of ID from the collector',
    description:
      'The description for the dialog when details of the collector not verified',
    id: 'print.cert.coll.id.description'
  },
  idCheckDialogTitle: {
    defaultMessage: 'Continue without proof of ID?',
    description:
      'The title for the dialog when details of the collector not verified',
    id: 'print.certificate.collector.idCheckDialog.title'
  },
  idCheckTitle: {
    defaultMessage: 'Check proof of ID. Does it match the following details?',
    description: 'The title for id check component',
    id: 'print.certificate.collector.idCheck.title'
  },
  idCheckVerify: {
    defaultMessage: 'Yes',
    description: 'The label for id check component action when verify details',
    id: 'print.cert.coll.idCheck.actions.ver'
  },
  idCheckWithoutVerify: {
    defaultMessage: 'No',
    description:
      'The label for id check component action when does not verify details',
    id: 'print.cert.coll.idCheck.actions.noVer'
  },
  informant: {
    defaultMessage: 'Informant',
    description:
      'The label for select value when informant is the collector of certificate',
    id: 'print.certificate.collector.informant'
  },
  informantHasReviewedInformaiton: {
    defaultMessage:
      'The informant has reviewed and confirmed that the information on the certificate is correct.',
    id: 'print.certificate.userReviewed'
  },
  manualPaymentMethod: {
    defaultMessage: 'Manual',
    description: 'The label for select option for manual payment method',
    id: 'print.certificate.manualPaymentMethod'
  },
  mother: {
    defaultMessage: 'Mother',
    description:
      'The label for select value when mother is the collector of certificate',
    id: 'print.certificate.collector.mother'
  },
  nationality: {
    defaultMessage: 'Nationality',
    description: 'Parent Nationality',
    id: 'certificate.parent.details.label.nationality'
  },
  next: {
    defaultMessage: 'Next',
    description: 'The label for next button',
    id: 'buttons.next'
  },
  noLabel: {
    defaultMessage: ' ',
    id: 'print.certificate.noLabel'
  },
  number: {
    defaultMessage: 'Number',
    description: 'Parent number',
    id: 'certificate.parent.details.label.number'
  },
  other: {
    defaultMessage: 'Other',
    description:
      'The label for select value when the collector of certificate is other person',
    id: 'print.certificate.collector.other'
  },
  payment: {
    defaultMessage: 'Payment is required',
    description: 'The title for payment section',
    id: 'print.certificate.payment'
  },
  paymentInstruction: {
    defaultMessage:
      'Please collect the payment, print the receipt and hand it over to the payee.',
    description: 'Description for payment section',
    id: 'print.certificate.paymentInstruction'
  },
  paymentAmount: {
    defaultMessage: '{paymentAmount}',
    description: 'The label for payment amount subsection',
    id: 'print.certificate.paymentAmount'
  },
  paymentMethod: {
    defaultMessage: 'Payment method',
    description: 'The label for payment method select',
    id: 'print.certificate.paymentMethod'
  },
  person1: {
    defaultMessage: 'UP Secretary Shakib al hasan',
    id: 'print.certificate.signature.person1'
  },
  person2: {
    defaultMessage: 'Local Registrar Mohammad Ashraful',
    id: 'print.certificate.signature.person2'
  },
  preview: {
    defaultMessage: 'Certificate Preview',
    description: 'The title for certificate preview form',
    id: 'print.certificate.certificatePreview'
  },
  print: {
    defaultMessage: 'Print certificate',
    description: 'The title of review button in list expansion actions',
    id: 'print.certificate.form.title'
  },
  printCertificate: {
    defaultMessage: 'Print',
    description: 'The title of review button in list expansion actions',
    id: 'print.certificate.form.name'
  },
  printReceipt: {
    defaultMessage: 'Print receipt',
    description: 'The label for print receipt button',
    id: 'print.certificate.printReceipt'
  },
  receiptIssuedAt: {
    defaultMessage: 'Issued at:',
    description: 'Receipt on payment on certificate issued at label',
    id: 'certificate.receipt.issuedAt'
  },
  receiptIssuer: {
    defaultMessage: 'By: {role}, {name}\n Date of payment: {dateOfPayment}',
    description: 'Issuer information for receipt of certificate payment label',
    id: 'certificate.receipt.issuer'
  },
  receiptPaidAmount: {
    defaultMessage: 'Amount paid:\n\n',
    description: 'Amount paid for certificate label',
    id: 'certificate.receipt.amount'
  },
  receiptService: {
    defaultMessage: 'Service:',
    description: 'Service received for receipt label',
    id: 'certificate.receipt.service'
  },
  selectSignature: {
    defaultMessage: 'Select e-signatures',
    description: 'The label for choose signature select',
    id: 'print.certificate.selectSignature'
  },
  service: {
    defaultMessage:
      'Service: <strong>Birth registration after {service, plural, =0 {0 month} one {1 month} other{{service} months}} of D.o.B.</strong><br/>Amount Due:',
    description: 'The label for service paragraph',
    id: 'print.certificate.serviceMonth'
  },
  amountDue: {
    defaultMessage: 'Amount Due:',
    description: 'The label for due amount',
    id: 'certificate.receipt.amountDue'
  },
  typeOfID: {
    defaultMessage: 'Type of ID',
    description: 'Parent Type of ID',
    id: 'certificate.parent.details.label.typeOfID'
  },
  whoToCollect: {
    defaultMessage: 'Who is collecting the certificate?',
    description: 'The label for collector of certificate select',
    id: 'print.certificate.collector.whoToCollect'
  },
  confirmAndPrint: {
    defaultMessage: 'Continue and print',
    description: 'The text for Confirm & print button',
    id: 'print.certificate.button.confirmPrint'
  },
  reviewTitle: {
    defaultMessage: 'Are all the details on the {event} certificate correct?',
    description: 'Certificate review title',
    id: 'print.certificate.review.title'
  },
  reviewDescription: {
    defaultMessage:
      'Please confirm that the applicant has reviewed that the information on the certificate is correct and that it is ready to print.',
    description: 'Certificate review description',
    id: 'print.certificate.review.description'
  },
  modalTitle: {
    id: 'print.certificate.review.modal.title',
    defaultMessage: 'Print Certificate?',
    description: 'Print certificate modal title text'
  },
  modalBody: {
    id: 'print.certificate.review.modal.body',
    defaultMessage:
      'A PDF of the certificate will open in a new tab - please print from there',
    description: 'Print certificate modal body text'
  },
  toastMessage: {
    id: 'print.certificate.toast.message',
    defaultMessage: 'Certificate is ready to print',
    description: 'Floating Toast message upon certificate ready to print'
  },
  otherCollectorFormTitle: {
    defaultMessage: 'What is their ID and name?',
    description: 'Title for other collector form',
    id: 'print.certificate.collector.other.title'
  },
  otherCollectorFormParagraph: {
    defaultMessage:
      'Because there are no details of this person on record, we need to capture their details:',
    description: 'Paragraph for other collector form',
    id: 'print.certificate.collector.other.paragraph'
  },
  certificateCollectorError: {
    defaultMessage: 'Please select who is collecting the certificate',
    description: 'Form level error for collector form',
    id: 'print.certificate.collector.form.error'
  },
  certificateOtherCollectorInfoError: {
    defaultMessage: 'Complete all the mandatory fields',
    description: 'Form level error for other collector information form',
    id: 'print.certificate.collector.other.form.error'
  },
  certificateOtherCollectorAffidavitFormTitle: {
    defaultMessage: 'Attach a signed affidavit',
    description: 'Form title for other collector affidavit form',
    id: 'print.cert.coll.other.aff.form.title'
  },
  certificateOtherCollectorAffidavitError: {
    defaultMessage:
      'Attach a signed affidavit or click the checkbox if they do not have one.',
    description: 'Form level error for other collector affidavit form',
    id: 'print.cert.coll.other.aff.error'
  },
  certificateOtherCollectorAffidavitFormParagraph: {
    defaultMessage:
      'This document should clearly prove that the individual has the authority to collect the certificate',
    description: 'Form paragraph for other collector affidavit form',
    id: 'print.cert.coll.other.aff.paragraph'
  },
  noSignedAffidavitAvailable: {
    defaultMessage: "They don't have a signed affidavit",
    description: 'Label for no affidavit checkbox',
    id: 'print.cert.coll.other.aff.check'
  },
  noAffidavitModalTitle: {
    defaultMessage: 'Continue without signed affidavit?',
    description:
      'Modal title for other coller form submission without signed affidavit',
    id: 'print.cert.coll.other.aff.title'
  },
  noAffidavitModalDescription: {
    defaultMessage:
      'Please be aware that if you proceed, you will be responsible for issuing a certificate without necessary evidence from the collector',
    description:
      'Modal description for other coller form submission without signed affidavit',
    id: 'print.cert.coll.other.aff.description'
  },
  signedAffidavitFileLabel: {
    defaultMessage: 'Signed affidavit',
    description: 'File label for signed affidavit',
    id: 'print.cert.coll.other.aff.label'
  }
}

interface IDynamicCertificateMessages {
  [key: string]: MessageDescriptor
}

const dynamicMessagesToDefine = {
  birthService: {
    id: 'print.certificate.birthService',
    defaultMessage:
      'Service: <strong>Birth registration after {service} of D.o.B.</strong><br/>Amount Due:',
    description: 'Amount due on certificate for birth label'
  },
  deathService: {
    id: 'print.certificate.deathService',
    defaultMessage:
      'Service: <strong>Death registration after {service} of D.o.D.</strong><br/>Amount Due:',
    description: 'Amount due on certificate for death label'
  },
  birthServiceAfter: {
    id: 'certificate.receipt.birthService.after',
    defaultMessage: 'Birth registration after 5 years of date of birth',
    description: 'Amount due on certificate for birth label'
  },
  deathServiceAfter: {
    id: 'certificate.receipt.deathService.after',
    defaultMessage: 'Death registration after 5 years of date of death',
    description: 'Amount due on certificate for death label'
  },
  birthServiceBetween: {
    id: 'certificate.receipt.birthService.between',
    defaultMessage:
      'Birth registration between 45 days and 5 years of date of birth',
    description: 'Amount due on certificate for birth label'
  },
  deathServiceBetween: {
    id: 'certificate.receipt.deathService.between',
    defaultMessage:
      'Death registration between 45 days and 5 years of date of death',
    description: 'Amount due on certificate for death label'
  }
}

export const messages: ICertificateMessages = defineMessages(messagesToDefine)
export const dynamicMessages: IDynamicCertificateMessages = defineMessages(
  dynamicMessagesToDefine
)

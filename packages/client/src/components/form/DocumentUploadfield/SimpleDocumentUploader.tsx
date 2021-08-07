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
import { ImageUploader } from '@opencrvs/components/lib/forms'
import { ErrorText } from '@opencrvs/components/lib/forms/ErrorText'
import { DocumentPreview } from '@client/components/form/DocumentUploadfield/DocumentPreview'
import { IFormFieldValue, IAttachmentValue } from '@client/forms'
import Jimp from 'jimp'
import * as React from 'react'
import { WrappedComponentProps as IntlShapeProps, injectIntl } from 'react-intl'
import styled from 'styled-components'
import { DocumentListPreview } from './DocumentListPreview'
import { buttonMessages, formMessages as messages } from '@client/i18n/messages'
import { getBase64String, ErrorMessage } from './DocumentUploaderWithOption'

const DocumentUploader = styled(ImageUploader)`
  color: ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.white};
  border: ${({ theme }) => `2px solid ${theme.colors.primary}`};
  box-shadow: 0px 2px 6px rgba(53, 67, 93, 0.32);
  border-radius: 2px;
  ${({ theme }) => theme.fonts.buttonStyle};
  height: 40px;
  text-transform: initial;
  padding: 0px 25px;

  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    margin-left: 0px;
    margin-top: 10px;
  }
`

const FieldDescription = styled.div`
  margin-top: -8px;
  margin-bottom: 24px;
`

type IFullProps = {
  name: string
  label: string
  files?: IAttachmentValue
  description?: string
  allowedDocType?: string[]
  error?: string
  disableDeleteInPreview?: boolean
  onComplete: (files: IAttachmentValue | {}) => void
} & IntlShapeProps

type IState = {
  error: string
  previewImage: IAttachmentValue | null
}

class SimpleDocumentUploaderComponent extends React.Component<
  IFullProps,
  IState
> {
  constructor(props: IFullProps) {
    super(props)
    this.state = {
      error: '',
      previewImage: null
    }
  }

  handleFileChange = (uploadedImage: File) => {
    if (!uploadedImage) {
      return
    }
    const allowedDocType = this.props.allowedDocType
    getBase64String(uploadedImage).then(data => {
      let base64String = data as string
      base64String = base64String.split('base64,')[1]
      Jimp.read(new Buffer(base64String, 'base64'))
        .then(buffer => {
          if (
            allowedDocType &&
            allowedDocType.length > 0 &&
            !allowedDocType.includes(buffer.getMIME())
          ) {
            throw new Error('File type not supported')
          }
          return data as string
        })
        .then(buffer => {
          this.props.onComplete({
            type: uploadedImage.type,
            data: buffer
          })
          this.setState({
            error: ''
          })
        })
        .catch(() => {
          allowedDocType &&
            allowedDocType.length > 0 &&
            this.setState({
              error: this.props.intl.formatMessage(messages.fileUploadError, {
                type: allowedDocType.join()
              })
            })
        })
    })
  }

  selectForPreview = (previewImage: IFormFieldValue) => {
    this.setState({ previewImage: previewImage as IAttachmentValue })
  }

  closePreviewSection = () => {
    this.setState({ previewImage: null })
  }

  onDelete = (image: IFormFieldValue) => {
    this.props.onComplete('')
    this.closePreviewSection()
  }

  render() {
    const {
      label,
      intl,
      files,
      description,
      error,
      disableDeleteInPreview
    } = this.props
    const errorMessage = this.state.error || error || ''

    return (
      <>
        {description && <FieldDescription>{description}</FieldDescription>}
        <ErrorMessage>
          {errorMessage && (
            <ErrorText id="field-error">{errorMessage}</ErrorText>
          )}
        </ErrorMessage>
        {(!files || !files.data) && (
          <DocumentUploader
            id="upload_document"
            title={intl.formatMessage(messages.addFile)}
            handleFileChange={this.handleFileChange}
          />
        )}
        <DocumentListPreview
          attachment={files}
          onSelect={this.selectForPreview}
          label={label}
        />
        {this.state.previewImage && (
          <DocumentPreview
            previewImage={this.state.previewImage}
            disableDelete={disableDeleteInPreview}
            title={intl.formatMessage(buttonMessages.preview)}
            goBack={this.closePreviewSection}
            onDelete={this.onDelete}
          />
        )}
      </>
    )
  }
}

export const SimpleDocumentUploader = injectIntl<'intl', IFullProps>(
  SimpleDocumentUploaderComponent
)

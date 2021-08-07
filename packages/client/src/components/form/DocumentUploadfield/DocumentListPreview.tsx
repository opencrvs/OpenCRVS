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
import styled from 'styled-components'
import { PaperClip } from '@opencrvs/components/lib/icons'
import { IFileValue, IAttachmentValue } from '@client/forms'
import { Spinner } from '@opencrvs/components/lib/interface'
import { withTheme, ITheme } from '@client/styledComponents'
import { ISelectOption } from '@opencrvs/components/lib/forms'
const Wrapper = styled.div`
  ${({ theme }) => theme.fonts.bodyStyle};
`
const PreviewLink = styled.div<{ disabled?: boolean }>`
  ${({ theme }) => theme.fonts.bodyBoldStyle};
  color: ${({ disabled, theme }) =>
    disabled ? theme.colors.disabled : theme.colors.primary};
  font-style: normal;
  text-decoration-line: underline;
  padding: 5px 10px;
  margin: 10px 0px;
  display: flex;
  cursor: pointer;
  background: ${({ theme }) => theme.colors.background};
  span {
    margin-left: 8px;
  }

  &:hover span {
    text-decoration: underline;
  }
`

const ProcessingSpinner = styled(Spinner)`
  margin-left: auto;
`

type IProps = {
  id?: string
  documents?: IFileValue[] | null
  processingDocuments?: Array<{ label: string }>
  attachment?: IAttachmentValue
  label?: string
  theme: ITheme
  onSelect: (document: IFileValue | IAttachmentValue) => void
  dropdownOptions?: ISelectOption[]
}

class DocumentListPreviewComponent extends React.Component<IProps> {
  getFormattedLabelForDocType = (docType: string) => {
    const matchingOptionForDocType =
      this.props.dropdownOptions &&
      this.props.dropdownOptions.find(option => option.value === docType)
    return matchingOptionForDocType && matchingOptionForDocType.label
  }
  render() {
    const {
      id,
      documents,
      processingDocuments,
      label,
      attachment,
      theme
    } = this.props
    return (
      <Wrapper id={`preview-list-${id}`}>
        {documents &&
          documents.map((document: IFileValue, key: number) => (
            <PreviewLink
              id={`document_${(document.optionValues[1] as string).replace(
                /\s/g,
                ''
              )}_link`}
              key={key}
              onClick={_ => this.props.onSelect(document)}
            >
              <PaperClip />
              <span>
                {this.getFormattedLabelForDocType(
                  document.optionValues[1] as string
                ) || document.optionValues[1]}
              </span>
            </PreviewLink>
          ))}
        {processingDocuments &&
          processingDocuments.map(({ label }) => (
            <PreviewLink disabled={true} key={label}>
              <PaperClip stroke={theme.colors.disabled} />
              <span>{this.getFormattedLabelForDocType(label) || label}</span>
              <ProcessingSpinner
                size={24}
                id={`document_${label}_processing`}
              />
            </PreviewLink>
          ))}
        {attachment && attachment.data && label && (
          <PreviewLink onClick={_ => this.props.onSelect(attachment)}>
            <PaperClip />
            <span>{this.getFormattedLabelForDocType(label) || label}</span>
          </PreviewLink>
        )}
      </Wrapper>
    )
  }
}

export const DocumentListPreview = withTheme(DocumentListPreviewComponent)

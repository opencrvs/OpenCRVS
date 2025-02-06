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
import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { ITextInputProps, TextInput } from '../TextInput/TextInput'
import { InputLabel } from '../InputField/InputLabel'

const DateWrapper = styled.div`
  width: 100%;
  display: flex;
  gap: 8px;
`
export const NoticeWrapper = styled.div`
  padding-bottom: 16px;
`
type IProps = {
  id: string
  disabled?: boolean
  meta?: { touched: boolean; error: string }
  focusInput?: boolean
  notice?: string
  ignorePlaceHolder?: boolean
  onChange: (dateString: string) => void
}

interface IState {
  dd: string
  mm: string
  yyyy: string
}

export type IDateFieldProps = IProps & Omit<ITextInputProps, 'onChange'>

const MAX_DAY_NUMBER = 31
const MAX_YEAR_NUMBER = 2100
const MAX_MONTH_NUMBER = 12

export const DateField = ({
  id,
  disabled,
  meta,
  focusInput,
  notice,
  ignorePlaceHolder,
  value: initialValue,
  onChange,
  ...props
}: IDateFieldProps) => {
  const [date, setDate] = useState<IState>({ yyyy: '', mm: '', dd: '' })
  const ddRef = useRef<HTMLInputElement>(null)
  const mmRef = useRef<HTMLInputElement>(null)
  const yyyyRef = useRef<HTMLInputElement>(null)
  const { dd, mm, yyyy } = date

  useEffect(() => {
    if (typeof initialValue === 'string') {
      const dateSegmentVals = initialValue?.split('-') || []
      setDate({
        yyyy: dateSegmentVals[0] || '',
        mm: dateSegmentVals[1] || '',
        dd: dateSegmentVals[2] || ''
      })
    }
  }, [initialValue])

  const change = (event: React.ChangeEvent<HTMLInputElement>) => {
    const segmentType = String(event.target.id.split('-').pop())
    const val = event.target.value

    if (['dd', 'mm', 'yyyy'].includes(segmentType)) {
      switch (segmentType) {
        case 'dd':
          if (val.length > 2 || Number(val) > MAX_DAY_NUMBER) {
            return
          }
          if (val.length > 1 && mmRef.current) {
            mmRef.current.focus()
          }
          break
        case 'mm':
          if (val.length > 2 || Number(val) > MAX_MONTH_NUMBER) {
            return
          }
          if (val.length > 1 && yyyyRef.current) {
            yyyyRef.current.focus()
          }
          break
        case 'yyyy':
          if (
            val.length > 4 ||
            Number(val) > MAX_YEAR_NUMBER ||
            (val.length === 2 && Number(val) < 19)
          ) {
            return
          }
          break
      }

      const updatedValue = { ...date, [segmentType]: val }
      setDate(updatedValue)

      if (yyyy === '' && mm === '' && dd === '') {
        return onChange('')
      }
      onChange(`${updatedValue.yyyy}-${updatedValue.mm}-${updatedValue.dd}`)
    }
  }

  return (
    <>
      <DateWrapper id={id}>
        {notice && (
          <NoticeWrapper>
            <InputLabel id={`${id}_notice`}>{notice}</InputLabel>
          </NoticeWrapper>
        )}
        <TextInput
          {...props}
          id={`${id}-dd`}
          ref={ddRef}
          error={Boolean(meta && meta.error)}
          isDisabled={disabled}
          touched={meta && meta.touched}
          focusInput={focusInput}
          type="number"
          placeholder={ignorePlaceHolder ? '' : 'dd'}
          min={1}
          max={31}
          value={dd}
          onChange={change}
          onWheel={(event: React.WheelEvent<HTMLInputElement>) => {
            event.currentTarget.blur()
          }}
        />
        <TextInput
          {...props}
          id={`${id}-mm`}
          ref={mmRef}
          error={Boolean(meta && meta.error)}
          isDisabled={disabled}
          touched={meta && meta.touched}
          focusInput={false}
          type="number"
          placeholder={ignorePlaceHolder ? '' : 'mm'}
          maxLength={2}
          min={1}
          max={12}
          value={mm}
          onChange={change}
          onWheel={(event: React.WheelEvent<HTMLInputElement>) => {
            event.currentTarget.blur()
          }}
        />
        <TextInput
          {...props}
          id={`${id}-yyyy`}
          ref={yyyyRef}
          error={Boolean(meta && meta.error)}
          isDisabled={disabled}
          touched={meta && meta.touched}
          focusInput={false}
          type="number"
          placeholder={ignorePlaceHolder ? '' : 'yyyy'}
          maxLength={4}
          min={1900}
          value={yyyy}
          onChange={change}
          onWheel={(event: React.WheelEvent<HTMLInputElement>) => {
            event.currentTarget.blur()
          }}
        />
      </DateWrapper>
    </>
  )
}

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
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import { resolve } from 'url'
import * as Sentry from '@sentry/browser'

export interface ICodeVerifyData {
  nonce: string
  code: string
}

export interface IAuthenticationData {
  username: string
  password: string
}

export const client = axios.create({
  baseURL: window.config.AUTH_API_URL
})

export interface IAuthenticateResponse {
  nonce: string
  token?: string
  mobile: string
}

export enum QUESTION_KEYS {
  BIRTH_TOWN = 'BIRTH_TOWN',
  HIGH_SCHOOL = 'HIGH_SCHOOL',
  MOTHER_NAME = 'MOTHER_NAME',
  FAVORITE_TEACHER = 'FAVORITE_TEACHER',
  FAVORITE_MOVIE = 'FAVORITE_MOVIE',
  FAVORITE_SONG = 'FAVORITE_SONG',
  FAVORITE_FOOD = 'FAVORITE_FOOD',
  FIRST_CHILD_NAME = 'FIRST_CHILD_NAME'
}

export interface ITokenResponse {
  token: string
}

function request<T>(options: AxiosRequestConfig) {
  const onSuccess = (response: AxiosResponse<T>) => {
    return response.data
  }

  const onError = (error: AxiosError) => {
    if (error.response) {
      // Request was made but server responded with something
      // other than 2xx
    } else {
      // Something else happened while setting up the request
      console.error('Error Message:', error.message)
      Sentry.captureException(error)
    }

    throw error
  }

  return client(options)
    .then(onSuccess)
    .catch(onError)
}

const authenticate = (data: IAuthenticationData) => {
  return request<IAuthenticateResponse>({
    url: resolve(window.config.AUTH_API_URL, 'authenticate'),
    method: 'POST',
    data
  })
}

const resendSMS = (nonce: string, retrievalFlow = false) => {
  return request({
    url: resolve(window.config.AUTH_API_URL, '/resendSms'),
    method: 'POST',
    data: { nonce, retrievalFlow }
  })
}

const verifyCode = (data: ICodeVerifyData): Promise<IAuthenticateResponse> => {
  return request({
    url: resolve(window.config.AUTH_API_URL, 'verifyCode'),
    method: 'POST',
    data
  })
}

interface IUserVerifyResponse {
  nonce: string
  securityQuestionKey?: string
}

const verifyUser = (
  mobile: string,
  retrieveFlow: string
): Promise<IUserVerifyResponse> => {
  return request({
    url: resolve(window.config.AUTH_API_URL, 'verifyUser'),
    method: 'POST',
    data: { mobile, retrieveFlow }
  })
}

interface IVerifyNumberResponse {
  nonce: string
  securityQuestionKey: string
}

const verifyNumber = (
  nonce: string,
  code: string
): Promise<IVerifyNumberResponse> => {
  return request({
    url: resolve(window.config.AUTH_API_URL, 'verifyNumber'),
    method: 'POST',
    data: { nonce, code }
  })
}

export type IVerifySecurityAnswerResponse = { nonce: string } & (
  | {
      matched: false
      securityQuestionKey: QUESTION_KEYS
    }
  | { matched: true }
)

const verifySecurityAnswer = (
  nonce: string,
  answer: string
): Promise<IVerifySecurityAnswerResponse> => {
  return request({
    url: resolve(window.config.AUTH_API_URL, 'verifySecurityAnswer'),
    method: 'POST',
    data: { nonce, answer }
  })
}

const changePassword = (nonce: string, newPassword: string): Promise<void> => {
  return request({
    url: resolve(window.config.AUTH_API_URL, 'changePassword'),
    method: 'POST',
    data: { nonce, newPassword }
  })
}

const sendUserName = (nonce: string): Promise<void> => {
  return request({
    url: resolve(window.config.AUTH_API_URL, 'sendUserName'),
    method: 'POST',
    data: { nonce }
  })
}

export const authApi = {
  request,
  authenticate,
  verifyCode,
  resendSMS,
  verifyNumber,
  verifyUser,
  verifySecurityAnswer,
  changePassword,
  sendUserName
}

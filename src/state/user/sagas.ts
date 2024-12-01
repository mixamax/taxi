import { ActionTypes as ConfigActionTypes } from './../config/constants'
import { all, put } from 'redux-saga/effects'
import { setLoginModal, setMessageModal, setRefCodeModal } from '../modals/actionCreators'
import { ActionTypes } from './constants'
import { uploadRegisterFiles, uploadFiles } from './helpers'
import { call, takeEvery } from '../../tools/sagaUtils'
import { t, TRANSLATION } from '../../localization'
import * as API from './../../API'
import { PromiseReturn, TAction } from '../../types'
import { EStatuses, EUserRoles, ITokens, IUser } from '../../types/types'
import history from '../../tools/history'
import { setUser } from './actionCreators'
import { clearOrders } from '../orders/actionCreators'
import SITE_CONSTANTS from '../../siteConstants'

export const saga = function* () {
  yield all([
    takeEvery(ActionTypes.LOGIN_REQUEST, loginSaga),
    takeEvery(ActionTypes.GOOGLE_LOGIN_REQUEST, googleLoginSaga),
    takeEvery(ActionTypes.REGISTER_REQUEST, registerSaga),
    takeEvery(ActionTypes.LOGOUT_REQUEST, logoutSaga),
    takeEvery(ActionTypes.REMIND_PASSWORD_REQUEST, remindPasswordSaga),
    takeEvery(ActionTypes.INIT_USER, initUserSaga),
  ])
}

function* loginSaga(data: TAction) {
  yield put({ type: ActionTypes.LOGIN_START })
  try {
    const result = yield* call<PromiseReturn<ReturnType<typeof API.login>>>(API.login, data.payload)

    if (!result) throw new Error('Wrong login response')

    if(result.data !== null && result.data === 'code sent') {
      yield put({ type: ActionTypes.LOGIN_WHATSAPP })
      return
    }

    if (result.user === null) throw new Error('Wrong login response')

    localStorage.setItem('tokens', JSON.stringify(result.tokens))

    if(result.user.u_role === EUserRoles.Client || result.user.u_role === EUserRoles.Agent) {
      history.push('/passenger-order')
    } else if(result.user.u_role === EUserRoles.Driver) {
      history.push('/driver-order')
    }

    yield put({
      type: ActionTypes.LOGIN_SUCCESS,
      payload: result,
    })
    yield put(setLoginModal(false))
  } catch (error) {
    console.error(error)
    yield put({ type: ActionTypes.LOGIN_FAIL })
  }
}

function* googleLoginSaga(data: TAction) {
  yield put({ type: ActionTypes.GOOGLE_LOGIN_START })
  try {

    const result = yield* call<PromiseReturn<ReturnType<typeof API.googleLogin>>>(API.googleLogin, data.payload)

    if (!result) throw new Error('Wrong login response')
    console.log("GFP-POINT-01: Saving tokens from goole auth to localStorage", result)
    localStorage.setItem('tokens', JSON.stringify(result.tokens))

    if(result.user.u_role === EUserRoles.Client || result.user.u_role === EUserRoles.Agent) {
      history.push('/passenger-order')
    } else if(result.user.u_role === EUserRoles.Driver) {
      history.push('/driver-order')
    }

    yield put({
      type: ActionTypes.GOOGLE_LOGIN_SUCCESS,
      payload: result,
    })
    yield put(setLoginModal(false))
    yield put(setRefCodeModal({ isOpen: false }))
  } catch (error) {
    console.error(error)
    yield put({ type: ActionTypes.GOOGLE_LOGIN_FAIL })
  }
}

function* registerSaga(data: TAction) {
  yield put({ type: ActionTypes.REGISTER_START })
  try {
    const { uploads, u_details, ...payload } = data.payload
    let response = yield* call<any>(API.register, { ...payload, st: 1 })
    const tokens = {
      token: response.token,
      u_hash: response.u_hash
    }
    localStorage.setItem('tokens', JSON.stringify(tokens))

    if (data.payload?.u_role === 2) {
      if (uploads) {
        yield* call<any>(uploadRegisterFiles, { filesToUpload: uploads, response, u_details })
      } else {
        const { passport_photo, driver_license_photo, license_photo, ...details } = u_details
        const files = { passport_photo, driver_license_photo, license_photo }
        const t = { ...tokens, u_id: response.u_id }
        yield* call<any>(uploadFiles, { files, u_details: details, tokens: t })
      }
    }
    yield put({ type: ActionTypes.REGISTER_SUCCESS, payload: response })
    yield* call(initUserSaga)
    yield put(setLoginModal(false))

    const isCarError = response?.car?.status === 'error'
    const messageStatus = isCarError ? EStatuses.Warning : EStatuses.Success
    const messageText = isCarError ? TRANSLATION.REGISTER_CAR_FAIL : TRANSLATION.SUCCESS_REGISTER_MESSAGE
    yield put(setMessageModal({
      isOpen: true,
      status: messageStatus,
      message: t(messageText)
    }))
  } catch (error) {
    console.error(error)
    yield put({ type: ActionTypes.REGISTER_FAIL, payload: error })
  }
}

function* logoutSaga() {
  yield put({ type: ActionTypes.LOGOUT_START })
  try {
    localStorage.removeItem('user')
    localStorage.removeItem('tokens')

    yield* call(API.logout)
    yield put({ type: ActionTypes.LOGOUT_SUCCESS })
    yield put(clearOrders())
  } catch (error) {
    console.error(error)
    yield put({ type: ActionTypes.LOGOUT_FAIL })
  }
}

function* remindPasswordSaga(data: TAction) {
  yield put({ type: ActionTypes.REMIND_PASSWORD_START })
  try {
    yield* call(API.remindPassword, data.payload)
    yield put({ type: ActionTypes.REMIND_PASSWORD_SUCCESS })
  } catch (error) {
    yield put({ type: ActionTypes.REMIND_PASSWORD_FAIL })
  }
}

function* initUserSaga() {
  try {
    const tokens: ITokens = JSON.parse(localStorage.getItem('tokens') || '{}')
    if (!tokens.token || !tokens.u_hash) return
    yield put({ type: ActionTypes.SET_TOKENS, payload: tokens })

    const user = yield* call<IUser | null>(API.getAuthorizedUser)
    if (user?.u_lang) yield put({
      type: ConfigActionTypes.SET_LANGUAGE,
      payload: SITE_CONSTANTS.LANGUAGES.find(i => i.id.toString() === user?.u_lang),
    })
    yield put(setUser(user))
  } catch (error) {
    yield put({ type: ActionTypes.REMIND_PASSWORD_FAIL })
  }
}

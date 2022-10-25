import { ActionTypes as ConfigActionTypes } from './../config/constants'
import { all, put } from 'redux-saga/effects'
import { setLoginModal } from '../modals/actionCreators'
import { ActionTypes } from './constants'
import { call, takeEvery } from '../../tools/sagaUtils'
import * as API from './../../API'
import { PromiseReturn, TAction } from '../../types'
import { EUserRoles, ITokens, IUser } from '../../types/types'
import history from '../../tools/history'
import { setUser } from './actionCreators'
import { clearOrders } from '../orders/actionCreators'
import SITE_CONSTANTS from '../../siteConstants'

export const saga = function* () {
  yield all([
    takeEvery(ActionTypes.LOGIN_REQUEST, loginSaga),
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

function* registerSaga(data: TAction) {
  yield put({ type: ActionTypes.REGISTER_START })
  try {
    let response = yield* call<any>(API.register, data.payload)
    yield put({ type: ActionTypes.REGISTER_SUCCESS, payload: response })
  } catch (error) {
    console.error(error)
    yield put({ type: ActionTypes.REGISTER_FAIL })
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

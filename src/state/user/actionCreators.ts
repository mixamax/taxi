import { ActionTypes, IUserState } from './constants'
import * as API from './../../API'

export const register = (payload: Parameters<typeof API.register>[0]) => {
  return { type: ActionTypes.REGISTER_REQUEST, payload }
}

export const login = (payload: Parameters<typeof API.login>[0]) => {
  return { type: ActionTypes.LOGIN_REQUEST, payload }
}

export const googleLogin = (payload: Parameters<typeof API.googleLogin>[0]) => {
  return { type: ActionTypes.GOOGLE_LOGIN_REQUEST, payload }
}

export const logout = () => {
  return { type: ActionTypes.LOGOUT_REQUEST }
}

export const remindPassword = (payload: Parameters<typeof API.remindPassword>[0]) => {
  return { type: ActionTypes.REMIND_PASSWORD_REQUEST, payload }
}

// export const clearMessages = () => {
//   return { type: ActionTypes.CLEAR_MESSAGES }
// }

// export const parseSavedUser = () => {
//   return { type: ActionTypes.PARSE_SAVED_USER_REQUEST }
// }

export const setTab = (payload: IUserState['tab']) => {
  return { type: ActionTypes.SET_TAB, payload }
}

export const setStatus = (payload: IUserState['status']) => {
  return { type: ActionTypes.SET_STATUS, payload }
}

export const setMessage = (payload: IUserState['message']) => {
  return { type: ActionTypes.SET_MESSAGE, payload }
}

export const initUser = () => {
  return { type: ActionTypes.INIT_USER }
}

export const setUser = (payload: IUserState['user']) => {
  return { type: ActionTypes.SET_USER, payload }
}
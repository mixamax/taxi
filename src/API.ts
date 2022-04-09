import { LANGUAGES } from './constants/languages'
import { EOrderTypes, ESuggestionType, IAddressPoint, ISuggestion, IRouteInfo } from './types/types'
import { Stringify, ValueOf } from './types/index'
import { apiMethod, IApiMethodArguments, IResponseFields, addToFormData } from './tools/api'
import axios from 'axios'
import {
  EBookingDriverState,
  EPaymentWays,
  IBookingAddresses,
  IBookingCoordinates,
  IBookingCoordinatesLatitude,
  IBookingCoordinatesLongitude,
  ICar,
  IOrder,
  IPlaceResponse,
  ITokens,
  IUser,
} from './types/types'
import Config from './config'
import { convertCar, convertOrder, convertUser, getHints, reverseConvertOrder } from './tools/utils'
import { t, TRANSLATION } from './localization'
import { ERegistrationType } from './state/user/constants'
import { userSelectors } from './state/user'
import store from './state'
import { configSelectors } from './state/config'
import SITE_CONSTANTS from './siteConstants'
import getCountryISO3 from './tools/countryISO2To3'

export enum EBookingActions {
  SetConfirmState = 'set_confirm_state',
  SetWaitingTime = 'set_waiting_time',
  SetPerformer = 'set_performer',
  SetArriveState = 'set_arrive_state',
  SetStartState = 'set_start_state',
  SetCompleteState = 'set_complete_state',
  SetCancelState = 'set_cancel_state',
  SetRate = 'set_rate',
  SetTips = 'set_tips',
  Edit = 'edit',
}

const _register = (
  { formData }: IApiMethodArguments,
  data: {
    name: IUser['u_name'],
    phone: IUser['u_phone'],
    email?: IUser['u_email'],
    role: IUser['u_role'],
    ref_code?: string
  },
): Promise<{
  u_id: IUser['u_id'],
  email_status: boolean,
  string: string
} | null> => {
  addToFormData(formData, {
    u_name: data.name,
    u_phone: data.phone,
    u_email: data.email,
    u_role: data.role,
    ref_code: data.ref_code,
  })

  return axios.post(`${Config.API_URL}/register`, formData)
    .then(res => res.data)
    .then(res => res.status === 'error' ? Promise.reject() : res.data)
}
/**
 * @returns email_status - if email is specified
 * @returns string - password if email is not specified
 */
export const register = apiMethod<typeof _register>(_register, { authRequired: false })

const _login = (
  { formData }: IApiMethodArguments,
  data: {
    login: IUser['u_email'] | IUser['u_phone'],
    password: string,
    type: ERegistrationType
  },
): Promise<{user: IUser, tokens: ITokens} | null> => {
  addToFormData(formData, {
    ...data,
  })

  return axios.post(`${Config.API_URL}/auth`, formData)
    .then(res => res.data)
    .then(res => {
      if (!res?.auth_hash) {
        return Promise.reject()
      }
      const tokenFormData = new FormData()
      addToFormData(tokenFormData, {
        auth_hash: res?.auth_hash,
      })
      return axios.post(`${Config.API_URL}/token`, tokenFormData)
        .then(tokenRes => tokenRes.data.data)
        .then(tokenRes => ({
          user: convertUser(res.auth_user),
          tokens: {
            token: tokenRes.token,
            u_hash: tokenRes.u_hash,
          },
        }))
    })
}
export const login = apiMethod<typeof _login>(_login, { authRequired: false })

const _logout = (
  { formData }: IApiMethodArguments,
): Promise<any> => {
  return axios.post(`${Config.API_URL}/logout`)
}
export const logout = apiMethod<typeof _logout>(_logout, { authRequired: false })

const _checkConfig = (
  { formData }: IApiMethodArguments,
  config: string,
): Promise<any> => {
  return axios.get(`${Config.API_URL}`, { params: { config } })
}
export const checkConfig = apiMethod<typeof _checkConfig>(_checkConfig, { authRequired: false })

const _postDrive = (
  { formData }: IApiMethodArguments,
  data: IOrder,
): Promise<IResponseFields & {
  b_id: IOrder['b_id'],
  b_driver_code: IOrder['b_driver_code']
}> => {
  addToFormData(formData, {
    data: JSON.stringify(reverseConvertOrder(data)),
  })

  return axios.post(`${Config.API_URL}/drive`, formData)
    .then(res => res.data)
}
export const postDrive = apiMethod<typeof _postDrive>(_postDrive)

const _cancelDrive = (
  { formData }: IApiMethodArguments,
  id: IOrder['b_id'],
  reason?: IOrder['b_cancel_reason'],
) => {
  addToFormData(formData, {
    action: EBookingActions.SetCancelState,
    reason,
  })

  return axios.post(`${Config.API_URL}/drive/get/${id}`, formData)
    .then(res => res.data)
}
export const cancelDrive = apiMethod<typeof _cancelDrive>(_cancelDrive)

const _getCar = (
  { formData }: IApiMethodArguments,
  id: ICar['c_id'],
): Promise<ICar | null> => {
  return axios.post(`${Config.API_URL}/car/${id}`, formData)
    .then(res => res.data.data)
    .then(res => (res.car && res.car[id] && convertCar(res.car[id])) || null)
}
export const getCar = apiMethod<typeof _getCar>(_getCar)

const _getOrders = (
  { formData }: IApiMethodArguments,
  type: EOrderTypes = EOrderTypes.Active,
): Promise<IOrder[]> => {
  const userID = userSelectors.user(store.getState())?.u_id

  addToFormData(formData, {
    array_type: 'list',
  })

  const hiddenOrders = JSON.parse(localStorage.getItem('hiddenOrders') || '{}')
  const userHiddenOrders = hiddenOrders && userID && hiddenOrders[userID]

  let URLAdditionalPath
  switch (type) {
    case EOrderTypes.Active:
      URLAdditionalPath = ''
      break
    case EOrderTypes.Ready:
      URLAdditionalPath = '/now'
      break
    case EOrderTypes.History:
      URLAdditionalPath = '/archive'
      break
    default:
      return Promise.reject()
  }

  return axios.post(`${Config.API_URL}/drive${URLAdditionalPath}`, formData)
    .then(res => res.data)
    .then(res =>
      (res.data.booking && res.data.booking.filter(
        (item: IOrder) => !(userHiddenOrders && userHiddenOrders.includes(item.b_id)),
      )) || [],
    )
    .then(res => res.map((item: any) => convertOrder(item)))
    .then(res =>
      res.sort(
        (a: IOrder, b: IOrder) => a.b_start_datetime < b.b_start_datetime ? 1 : -1,
      ),
    )
}
export const getOrders = apiMethod<typeof _getOrders>(_getOrders)

const _getOrder = (
  { formData }: IApiMethodArguments,
  id: IOrder['b_id'],
): Promise<IOrder | null> => {
  return axios.post(`${Config.API_URL}/drive/get/${id}`, formData)
    .then(res => res.data.data)
    .then(res => (res.booking && res.booking[id] && convertOrder(res.booking[id])) || null)
}
export const getOrder = apiMethod<typeof _getOrder>(_getOrder)

const _editOrder = (
  { formData }: IApiMethodArguments,
  id: IOrder['b_id'],
  data: IBookingAddresses & Stringify<IBookingCoordinates>,
): Promise<IResponseFields> => {
  addToFormData(formData, {
    action: EBookingActions.Edit,
    data: JSON.stringify(data),
  })

  return axios.post(`${Config.API_URL}/drive/get/${id}`, formData)
    .then(res => res.data)
}
export const editOrder = apiMethod<typeof _editOrder>(_editOrder)

const _getUserCar = (
  { formData }: IApiMethodArguments,
  id: IUser['u_id'],
): Promise<ICar | null> => {
  addToFormData(formData, {
    array_type: 'list',
  })

  return axios.post(`${Config.API_URL}/user/${id}/car`, formData)
    .then(res => res.data.data)
    .then(res => (res.car && res.car[0]) || null)
}
export const getUserCar = apiMethod<typeof _getUserCar>(_getUserCar)

const _takeOrder = (
  { formData }: IApiMethodArguments,
  id: IOrder['b_id'],
  options: {
    votingNumber: number
    performers_price: number
  },
  candidate?: boolean,
): Promise<{
  /** Индекс водителя */
  c_index: string,
  /** Текущее число машин поездки с booking_driver_states=3,4,5,6 */
  current_cars_count: string,
  /** Необходимое число машин поездки */
  b_cars_count: string,
  /** Если изменился статус поезки */
  b_state?: '1->2' | null
}> => {
  const userID = userSelectors.user(store.getState())?.u_id
  if (!userID) Promise.reject(t(TRANSLATION.WRONG_USER_ROLE))

  return getUserCar(userID as string)
    .then(car => {
      if(!car) return Promise.reject(t(TRANSLATION.NOT_LINKED_CAR))

      addToFormData(formData, {
        action: EBookingActions.SetPerformer,
        performer: candidate ? '0' : '1',
        b_driver_code: options.votingNumber,
        data: JSON.stringify({
          c_id: car.c_id,
          c_payment_way: EPaymentWays.Cash,
          c_options: { performers_price: options.performers_price },
        }),
      })

      return axios.post(`${Config.API_URL}/drive/get/${id}`, formData)
        .then(res => res.data)
        .then(res => res.status === 'error' ? Promise.reject(res.message) : res)
    })
}
export const takeOrder = apiMethod<typeof _takeOrder>(_takeOrder)

const _chooseCandidate = (
  { formData }: IApiMethodArguments,
  id: IOrder['b_id'],
  user?: IUser['u_id'],
): Promise<any> => {
  const userID = userSelectors.user(store.getState())?.u_id
  if (!userID) Promise.reject(t(TRANSLATION.WRONG_USER_ROLE))

  addToFormData(formData, {
    action: EBookingActions.SetPerformer,
    performer: '1',
    u_id: user,
  })

  return axios.post(`${Config.API_URL}/drive/get/${id}`, formData)
    .then(res => res.data)
    .then(res => res.status === 'error' ? Promise.reject() : res)
}
export const chooseCandidate = apiMethod<typeof _chooseCandidate>(_chooseCandidate)

const _setOrderState = (
  { formData }: IApiMethodArguments,
  id: IOrder['b_id'],
  state: EBookingDriverState,
) => {
  let action
  switch (state) {
    case EBookingDriverState.Arrived:
      action = EBookingActions.SetArriveState
      break
    case EBookingDriverState.Started:
      action = EBookingActions.SetStartState
      break
    case EBookingDriverState.Finished:
      action = EBookingActions.SetCompleteState
      break
    default:
      return Promise.reject()
  }

  addToFormData(formData, {
    action,
  })

  return axios.post(`${Config.API_URL}/drive/get/${id}`, formData)
    .then(res => res.data)
    .then(res => res.status === 'error' ? Promise.reject() : res)
}
export const setOrderState = apiMethod<typeof _setOrderState>(_setOrderState)

const _setOrderRating = (
  { formData }: IApiMethodArguments,
  id: IOrder['b_id'],
  value: number,
) => {
  addToFormData(formData, {
    action: EBookingActions.SetRate,
    value,
  })

  return axios.post(`${Config.API_URL}/drive/get/${id}`, formData)
    .then(res => res.data)
}
/**
 * @param value rating from 1 till 5
 */
export const setOrderRating = apiMethod<typeof _setOrderRating>(_setOrderRating)

const _getUser = (
  { formData }: IApiMethodArguments,
  id: IUser['u_id'],
): Promise<IUser | null> => {
  return axios.post(`${Config.API_URL}/user/${id}`, formData)
    .then(res => res.data.data)
    .then(res => convertUser(res.user[id]) || null)
}
export const getUser = apiMethod<typeof _getUser>(_getUser)

const _getAuthorizedUser = (
  { formData }: IApiMethodArguments,
): Promise<IUser | null> => {
  return axios.post(`${Config.API_URL}/user/authorized`, formData)
    .then(res => res.data.data)
    .then(res => convertUser(Object.values(res.user)[0] as IUser) || null)
}
export const getAuthorizedUser = apiMethod<typeof _getAuthorizedUser>(_getAuthorizedUser)

const _editUser = (
  { formData }: IApiMethodArguments,
  data: Partial<IUser>,
) => {
  addToFormData(formData, { data: JSON.stringify(data) })

  return axios.post(`${Config.API_URL}/user`, formData)
    .then(res => res.data)
}
export const editUser = apiMethod<typeof _editUser>(_editUser)

const _setOutDrive = (
  { formData }: IApiMethodArguments,
  isFinished: boolean,
  addresses?: {
    fromAddress?: string,
    fromLatitude?: string,
    fromLongitude?: string,
    toAddress?: string,
    toLatitude?: string,
    toLongitude?: string,
  },
  passengers?: IOrder['b_passengers_count'],
): Promise<IResponseFields> => {
  addToFormData(formData, {
    'data': JSON.stringify(
      isFinished ?
        {
          out_drive: '0',
        } :
        {
          out_drive: '1',
          out_s_address: addresses?.fromAddress,
          out_s_latitude: addresses?.fromLatitude?.toString(),
          out_s_longitude: addresses?.fromLongitude?.toString(),
          out_address: addresses?.toAddress,
          out_latitude: addresses?.toLatitude?.toString(),
          out_longitude: addresses?.toLongitude?.toString(),
          out_passengers: passengers,
        },
    ),
  })

  return axios.post(`${Config.API_URL}/user`, formData)
    .then(res => res.data)
}
export const setOutDrive = apiMethod<typeof _setOutDrive>(_setOutDrive)

const _remindPassword = (
  { formData }: IApiMethodArguments,
  email: IUser['u_email'],
) => {
  addToFormData(formData, {
    u_email: email,
  })

  return axios.post(`${Config.API_URL}/remind`, formData)
    .then(res => res.data)
    .then(res => res.status === 'error' ? Promise.reject() : res)
}
export const remindPassword = apiMethod<typeof _remindPassword>(_remindPassword, { authRequired: false })

const _setWaitingTime = (
  { formData }: IApiMethodArguments,
  id: IOrder['b_id'],
  previous: number,
  additional: number = 180,
) => {
  addToFormData(formData, {
    action: EBookingActions.SetWaitingTime,
    previous,
    additional,
  })

  return axios.post(`${Config.API_URL}/drive/get/${id}`, formData)
    .then(res => res.data)
}
/**
 * Adds time to wait
 * @param previous actual waiting time
 */
export const setWaitingTime = apiMethod<typeof _setWaitingTime>(_setWaitingTime)

export const reverseGeocode = (
  lat: ValueOf<Stringify<IBookingCoordinatesLatitude>>,
  lng: ValueOf<Stringify<IBookingCoordinatesLongitude>>,
): Promise<IPlaceResponse> => {
  const language = configSelectors.language(store.getState())

  return axios.get(
    'https://nominatim.openstreetmap.org/reverse',
    {
      params: {
        lat,
        lon: lng,
        format: 'json',
        'accept-language': LANGUAGES[language].code,
      },
    },
  )
    .then(res => res.data)
}


export const geocode = (
  query: string,
): Promise<IPlaceResponse | null> => {
  const language = configSelectors.language(store.getState())

  return axios.get(
    'https://nominatim.openstreetmap.org/search',
    {
      params: {
        q: query,
        limit: 1,
        format: 'json',
        'accept-language': LANGUAGES[language].code,
      },
    },
  )
    .then(res =>
      res.data[0] &&
      ({ ...res.data[0], lat: parseFloat(res.data[0].lat), lon: parseFloat(res.data[0].lon) }),
    )
}


const orsToken = '5b3ce3597851110001cf6248b6254554dbfc488a8585d67081a4000f'

export const makeRoutePoints = (from: IAddressPoint, to: IAddressPoint): Promise<IRouteInfo> => {
  const convertPoint = (point: IAddressPoint) => `${point.longitude},${point.latitude}`

  return axios.get(
    'https://api.openrouteservice.org/v2/directions/driving-car',
    {
      params: {
        api_key: orsToken,
        start: convertPoint(from),
        end: convertPoint(to),
      },
    },
  )
    .then(res => res.data)
    .then(res => {
      const hours = Math.round(res.features[0].properties.summary.duration / (60 * 60))
      const minutes = Math.round((res.features[0].properties.summary.duration - (hours * 60)) / 60)
      return {
        distance: parseFloat((res.features[0].properties.summary.distance / 1000).toFixed(2)),
        time: {
          hours,
          minutes,
        },
        points: res.features[0].geometry
          .coordinates.map((item: [number, number]) => [item[1], item[0]]),
      }
    })
}

export const notifyPosition = (point: IAddressPoint) => {
  const userID = userSelectors.user(store.getState())?.u_id

  axios.post('http://jecat.ru/car_api/api/notifypos.php', {
    driver: userID,
    lat: point.latitude,
    lon: point.longitude,
    time: new Date().getTime() / 1000,
  })
}

export const getPointSuggestions = async(targetString?: string, isIntercity?: boolean): Promise<ISuggestion[]> => {
  const commonSuggestions: ISuggestion[] =
    getHints(targetString)
      .map(item => ({
        type: ESuggestionType.PointUserTop,
        point: {
          address: item,
        },
      }))
      .concat(
        getHints(targetString)
          .map(item => ({
            type: ESuggestionType.PointUnofficial,
            point: {
              address: item,
            },
          })),
      )
  if (!targetString) {
    return commonSuggestions
  }

  try {
    const language = configSelectors.language(store.getState())

    let coords: [number, number],
      country: string | undefined

    try {
      coords = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            resolve([coords.latitude, coords.longitude])
          },
          error => reject(error),
          { enableHighAccuracy: true },
        )
      })
    } catch (error) {
      coords = SITE_CONSTANTS.DEFAULT_POSITION
    }

    if (isIntercity) {
      try {
        country = getCountryISO3(
          (
            await reverseGeocode(coords[0].toString(), coords[1].toString())
          ).address.country_code,
        ) || SITE_CONSTANTS.DEFAULT_COUNTRY
      } catch (error) {
        country = SITE_CONSTANTS.DEFAULT_COUNTRY
      }
    }

    const officialSuggestions = await axios.get(
      'https://geocode.search.hereapi.com/v1/autosuggest',
      {
        params: {
          q: targetString.toString(),
          at: isIntercity ? `${coords[0]},${coords[1]}` : undefined,
          in: isIntercity ? `countryCode:${country}` : `circle:${coords};r=${SITE_CONSTANTS.SEARCH_RADIUS * 1000}`,
          apiKey: 'cBumVVL0YkHvynJZNIL3SRtUfgxnEtPpXhvUVcE6Uh0',
          lang: LANGUAGES[language].code,
          limit: 3,
        },
      },
    )
      .then(res => res.data)

    return officialSuggestions.items ?
      commonSuggestions.concat(
        officialSuggestions.items
          .map((item: any): ISuggestion | null => {
            if (item.position) {
              return {
                type: ESuggestionType.PointOfficial,
                point: {
                  latitude: item.position.lat,
                  longitude: item.position.lng,
                  address: item.address.label,
                },
                distance: item.distance,
              }
            }
            return null
          })
          .filter((item: ISuggestion | null) => item),
      ) :
      commonSuggestions
  } catch (error) {
    console.error(error)
    return commonSuggestions
  }
}

export const activateChatServer = () => {
  return axios.get('http://jecat.1gb.ru/wschat/checksrv.php', {
    params: {
      s: 1,
    },
  })
    .catch(error => console.error(error))
}
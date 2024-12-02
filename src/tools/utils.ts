import { ECarClasses, EStatuses, IOrder, TAvailableModes, TMoneyModes, IDriver, ICar, IUser, IAddressPoint, TBlockObject, ITrip } from '../types/types'
import moment, { Moment } from 'moment'
import SITE_CONSTANTS/**, { MAP_MODE } */ from '../siteConstants'
import { t, TRANSLATION } from '../localization'
import { ISelectOption } from '../types'
import { findBestMatch } from 'string-similarity'
import _ from 'lodash'
import images from '../constants/images'

const hints = [
  'Roman Ridge',
  'Kanda',
  'East Legon',
  'Kaneshie',
  'North Kaneshie',
  'Accra New Town',
  'Nima',
  'Kokomlemle',
  'Tesano',
  'Maamobi',
  'Alajo',
  'Christian Village',
  'Apenkwa',
  'Darkuman',
  'Awoshie',
  'Avenor',
  'Kwashieman',
  'Achimota',
  'Bubiashie',
  'Kotobabi',
  'Abelemkpe',
  'Accra',
  'Ashaiman',
  'La',
  'Tema',
  'Towns',
  'Ada Foah',
  'Adjen Kotoku',
  'Big Ada',
  'Bornikope',
  'Feyito',
  'Madina',
  'Medie',
  'Prampram',
  'Sege',
  'Teshie',
  'Tojeh',
  'Villages',
  'Afienya',
  'Akplabanya',
  'Anyamam',
  'Berekuso',
  'Bortianor',
  'Dawhenya',
  'Doryumu',
  'Goi',
  'Kokrobite',
  'Kpone',
  'Malejor',
  'Manya-Jorpanya',
  'Matsekope',
  'Obame',
  'Oblogo',
  'Oyibi',
  'Salom',
  'Toflokpo',
  'Totope',
  'Tuba',
  'Hamlets',
  'Appolonia',
  'Christiansborg',
  'Juba Villas',
  'Oshiyie',
  'Localities',
  'Arabella Residency',
  'Ayigbe Town',
  'Bankuman',
  'Bojo Beach',
  'New Barrier / Tuba Junction',
  'Nim Tree Circle',
  'Old Barrier/Kokrobite Junction',
  'Suburbs',
  'Abeka',
  'Abelenkpe',
  'Abofu',
  'Abokobi',
  'Abossey Okai',
  'Accra New Town',
  'Achimota',
  'Adabraka',
  'Adentan',
  'Adjiringanor',
  'Airport Residential Area',
  'Akweteyman',
  'Alaji',
  'Alajo',
  'Alogboshie',
  'Amasaman',
  'Ashaley Botwe',
  'Ashongman',
  'Asylum Down',
  'Awoshie',
  'Awudome Estates',
  'Ayigbe Town',
  'Bethlehem',
  'Bukom',
  'Burma Camp',
  'Cantonments',
  'Chorkor',
  'Christian Village',
  'Community 1',
  'Community 10',
  'Community 11',
  'Community 12',
  'Community 17',
  'Community 2',
  'Community 22',
  'Community 25',
  'Community 3',
  'Community 4',
  'Community 5',
  'Community 6',
  'Community 7',
  'Community 8',
  'Community 9',
  'Dansoman',
  'Darkuman',
  'Dome',
  'Dzorwulu',
  'East Airport',
  'East Legon',
  'Freetown',
  'Galiliea',
  'Gbawe',
  'Greda Estate',
  'Green Hill',
  'James Town',
  'kakasunaka No.1',
  'Kanda Estates',
  'Kaneshie',
  'Kisseman',
  'Kokomlemle',
  'Kokompe',
  'Korle Gonno',
  'Korlebu',
  'Kotobabi',
  'Kwabenya',
  'La',
  'Labone',
  'Lantemame',
  'Lapaz',
  'Lartebiokorshie',
  'Little Legon',
  'Maamobi',
  'Mallam',
  'Mallam Borla',
  'Mamprobi',
  'Masalatsi',
  'Mataheko',
  'Mataheko',
  'McCarthy Hill',
  'Mendskrom',
  'Ministries',
  'Mpoase',
  'NanaKrom',
  'Nasalat',
  'New Abelekuma',
  'New Achimota',
  'New Gbawe',
  'New Legon',
  'New Russia',
  'New Weija',
  'Nii Boi Town',
  'Nima',
  'North Dzorwolu',
  'North Industrial Area',
  'North Kaneshie',
  'North Ridge',
  'Nungua',
  'Nyamekye',
  'Nyaniba Estates',
  'Obenyade',
  'Odorkor',
]

// eslint-disable-next-line
export const phoneRegex = /^[\+]?[0-9]{1,3}[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{3,6}$/im
// eslint-disable-next-line
export const emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i

const DISTANCE_COEFFICIENT = 1.5

export const dateFormat = 'YYYY-MM-DD HH:mm:ssZ'
export const dateShowFormat = 'YYYY-MM-DD HH:mm'
export const dateFormatDate = 'YYYY-MM-DD'
export const dateFormatTime = 'HH:mm:ss'
export const dateFormatTimeShort = 'HH:mm'

export enum EPaymentType {
  Customer,
  Calculated,
}

export const cachedOrderDataStateKey = 'cachedOrderDataState'
export const cachedOrderDataValuesKey = 'cachedOrderDataValues'

/**
 * You need to pass order || ((points || distance) && startDatetime && carClass)
 */
export const getPayment = (
  order?: IOrder | null,
  points?: [IAddressPoint, IAddressPoint] | null,
  distance?: number,
  startDatetime?: IOrder['b_start_datetime'],
  carClass?: ECarClasses,
) => {
  if (order?.b_options?.customer_price && SITE_CONSTANTS.ENABLE_CUSTOMER_PRICE) {
    return { value: order.b_options.customer_price, text: '', type: EPaymentType.Customer }
  }

  const _distance = distance || calcOrderDistance(points, order)
  if (!_distance) return { value: 0, text: '0', type: EPaymentType.Calculated }

  let _orderTime = startDatetime,
    _startOfNightTime = moment(SITE_CONSTANTS.START_OF_NIGHT_TIME, 'h:mm'),
    _endOfNightTime = moment(SITE_CONSTANTS.END_OF_NIGHT_TIME, 'h:mm'),
    _midTime = moment('12:00', 'h:mm')

  if (_orderTime?.isAfter(_midTime)) {
    _endOfNightTime = _endOfNightTime.add(1, 'days')
  } else {
    _startOfNightTime = _startOfNightTime.subtract(1, 'days')
  }

  const callRate = +(window as any).data.car_classes[order?.b_car_class || carClass || ECarClasses.Any]?.courier_call_rate ?? SITE_CONSTANTS.COURIER_CALL_RATE
  const farePer1Km = +(window as any).data.car_classes[order?.b_car_class || carClass || ECarClasses.Any]?.courier_fare_per_1_km ?? SITE_CONSTANTS.COURIER_FARE_PER_1_KM

  let _value = 0,
    _text = ''
  if (_orderTime?.isAfter(_startOfNightTime) && _orderTime.isBefore(_endOfNightTime)) {
    _value = SITE_CONSTANTS.EXTRA_CHARGE_FOR_NIGHT_TIME * (callRate + (farePer1Km * _distance))
    _text =  `${SITE_CONSTANTS.EXTRA_CHARGE_FOR_NIGHT_TIME} * \
    ( ${callRate} + ${farePer1Km} * ${_distance}${t(TRANSLATION.KM)} ) = ${_value}`
  } else {
    _value = callRate + (farePer1Km * _distance)
    _text = `${callRate} + ${farePer1Km} * ${_distance}${t(TRANSLATION.KM)} = ${_value}`
  }

  return { value: _value, text: _text, type: EPaymentType.Calculated }
}

export const calcOrderDistance = (points?: (IAddressPoint | null)[] | null, order?: IOrder | null) => {
  const [from, to] =
    points ||
    [
      { latitude: order?.b_start_latitude, longitude: order?.b_start_longitude },
      { latitude: order?.b_destination_latitude, longitude: order?.b_destination_longitude },
    ]
  if (
    from && to &&
    from.latitude && from.longitude &&
    to.latitude && to.longitude
  ) {
    let _distance = distanceBetweenEarthCoordinates(
      from.latitude, from.longitude,
      to.latitude, to.longitude,
    )

    return Math.round((_distance * DISTANCE_COEFFICIENT * 100) / 100)
  } else {
    return 0
  }
}

export const convertDriver = (driver: any): IDriver => {
  return convertTypes<any, IDriver>(
    driver,
    {
      toIntKeys: [
        'c_state',
      ],
      toFloatKeys: [
        'c_latitude',
        'c_longitude',
      ],
      toDateKeys: [
        'l_datetime',
      ],
      toBooleanKeys: [
        'c_arrive_state',
      ],
    },
  )
}

export const reverseConvertDriver = (driver: IDriver): any => {
  return convertTypes<any, IDriver>(
    driver,
    {
      toStringKeys: [
        'c_latitude',
        'c_longitude',
        'c_state',
      ],
      toStringDateKeys: [
        'l_datetime',
      ],
      toIntBooleanKeys: [
        'c_arrive_state',
      ],
    },
  )
}

export const convertOrder = (order: any): IOrder => {
  return convertTypes<any, IOrder>(
    order,
    {
      toFloatKeys: [
        'b_start_latitude',
        'b_start_longitude',
        'b_destination_latitude',
        'b_destination_longitude',
        'b_passengers_count',
        'b_luggage_count',
        'b_price_estimate',
      ],
      toIntKeys: [
        'b_cars_count',
        'b_distance_estimate',
        'b_car_class',
        'b_state',
      ],
      toDateKeys: [
        'b_start_datetime',
        'b_created',
        'b_approved',
      ],
      toBooleanKeys: [
        'b_confirm_state',
        'b_voting',
      ],
      customKeys: {
        drivers: () => order.drivers?.map((item: any) => convertDriver(item)),
      },
    },
  )
}

export const convertTrip = (trip: any): ITrip => {
  return convertTypes<any, ITrip>(
    trip,
    {
      toFloatKeys: [
        't_start_latitude',
        't_start_longitude',
        't_destination_latitude',
        't_destination_longitude',
      ],
      toDateKeys: [
        't_start_datetime',
        't_complete_datetime',
        't_start_real_datetime',
        't_complete_real_datetime',
        't_edit_datetime',
        't_create_datetime',
      ],
      toBooleanKeys: [
        't_looking_for_clients',
        't_canceled',
      ],
      customKeys: {
        orders: () => trip.orders?.map((item: any) => convertOrder(item)),
      },
    },
  )
}

export const reverseConvertOrder = (order: IOrder): any => {
  return convertTypes<IOrder, any>(
    order,
    {
      toStringKeys: [
        'b_start_latitude',
        'b_start_longitude',
        'b_destination_latitude',
        'b_destination_longitude',
        'b_passengers_count',
        'b_luggage_count',
        'b_price_estimate',
        'b_cars_count',
        'b_distance_estimate',
      ],
      toStringDateKeys: [
        'b_start_datetime',
        'b_created',
        'b_approved',
      ],
      toIntBooleanKeys: [
        'b_confirm_state',
        'b_voting',
      ],
      customKeys: {
        drivers: () => order.drivers?.map(item => reverseConvertDriver(item)),
      },
    },
  )
}

export const reverseConvertTrip = (order: ITrip): any => {
  return convertTypes<ITrip, any>(
    order,
    {
      toStringKeys: [
        't_start_latitude',
        't_start_longitude',
        't_destination_latitude',
        't_destination_longitude',
      ],
      toStringDateKeys: [
        't_start_datetime',
        't_complete_datetime',
      ],
    },
  )
}

export const convertCar = (car: any): ICar => {
  return convertTypes<any, ICar>(
    car,
    {
      toIntKeys: [
        'seats',
      ],
    },
  )
}

export const convertUser = (user: any): IUser => {
  return convertTypes<any, IUser>(
    user, 
    {
      customKeys: {
        u_ban: () => convertTypes<any, IUser['u_ban']>(user.u_ban, {
          toIntKeys: ['auth', 'order', 'blog_topic', 'blog_post'],
        }),
        u_details: () => convertTypes<any, IUser['u_details']>(user.u_details, {
          toJSONKeys: ['passport_photo', 'driver_license_photo', 'license_photo'],
        }),
      },
      toIntKeys: ['u_tips', 'u_role'],
      toFloatKeys: ['out_latitude', 'out_longitude', 'out_s_latitude', 'out_s_longitude'],
      toBooleanKeys: ['u_active', 'u_phone_checked', 'out_drive'],
      toDateKeys: ['u_birthday', 'out_est_datetime'],
    },
  )
}

export const reverseConvertUser = (user: any): IUser => {
  return convertTypes<IUser, any>(
    user,
    {
      toDetailsObjectKeys: ['u_details'],
    },
  )
}

interface TConvertKeys {
  toFloatKeys?: string[],
  toIntKeys?: string[],
  toStringKeys?: string[],
  toStringObjectKeys?: string[]
  toDetailsObjectKeys?: string[]
  toDateKeys?: string[],
  toStringDateKeys?: string[],
  toBooleanKeys?: string[],
  toIntBooleanKeys?: string[],
  toJSONKeys?: string[],
  customKeys?: {[key: string]: Function}
}
const convertTypes = <T, R>(
  object: T,
  {
    toFloatKeys = [],
    toIntKeys = [],
    toStringKeys = [],
    toStringObjectKeys = [],
    toDetailsObjectKeys = [],
    toDateKeys = [],
    toStringDateKeys = [],
    toBooleanKeys = [],
    toIntBooleanKeys = [],
    toJSONKeys = [],
    customKeys = {},
  }: TConvertKeys,
) => {
  const convertedObject: any = {}

  for (let [key, value] of Object.entries(object)) {
    if (value === null) continue

    if (toFloatKeys.includes(key)) convertedObject[key] = parseFloat(value)
    else if (toIntKeys.includes(key)) convertedObject[key] = parseInt(value)
    else if (toStringKeys.includes(key)) convertedObject[key] = String(value)
    else if (toStringObjectKeys.includes(key)) convertedObject[key] = JSON.stringify(value)
    else if (toDetailsObjectKeys.includes(key)) {
      const detailsArr = []
      for (let [itemKey, itemValue] of Object.entries(value)) {
        detailsArr.push(['=', [itemKey], itemValue ?? ''])
      }
      convertedObject[key] = detailsArr
    }
    else if (toDateKeys.includes(key)) convertedObject[key] = moment(value)
    else if (toStringDateKeys.includes(key)) convertedObject[key] = value.format(dateFormat)
    else if (toBooleanKeys.includes(key)) convertedObject[key] = Boolean(parseInt(value))
    else if (toIntBooleanKeys.includes(key)) convertedObject[key] = Number(value)
    else if (toJSONKeys.includes(key)) {
      if (typeof value !== 'string') {
        convertedObject[key] = value
      } else {
        try {
          convertedObject[key] = JSON.parse(value)
        } catch (e) {
          convertedObject[key] = value
        }
      }
    }
    else if (customKeys.hasOwnProperty(key)) convertedObject[key] = customKeys[key]()
    else convertedObject[key] = value
  }

  return convertedObject as R
}

export const getEmptyPhoneValue = () => {
  return SITE_CONSTANTS.DEFAULT_PHONE_MASK.replaceAll('9', '_')
}

export const getPhoneError = (phone?: string | null, required = true) => {
  if (!phone) return null
  if (phone === getEmptyPhoneValue() || phone === '') return required ? t(TRANSLATION.REQUIRED_FIELD) : null
  if (!phone.match(phoneRegex)) return t(TRANSLATION.PHONE_PATTERN_ERROR)
  return null
}

export const getPointError = (point?: IAddressPoint | null) => {
  if (point === null) return null
  if (_.isEqual(point, {})) return t(TRANSLATION.REQUIRED_FIELD)
  return null
}

export const getCurrentLocationError = (point?: IAddressPoint | null) => {
  if (point === null) return null
  if (_.isEqual(point, {})) return t(TRANSLATION.CURRENT_LOCATION_IS_FORBIDDEN)
  return null
}

const degreesToRadians = (degrees: number): number => {
  return degrees * Math.PI / 180
}

export const distanceBetweenEarthCoordinates = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const earthRadiusKm = 6371

  let dLat = degreesToRadians(lat2-lat1),
    dLon = degreesToRadians(lon2-lon1)

  lat1 = degreesToRadians(lat1)
  lat2 = degreesToRadians(lat2)

  let a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2),
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return earthRadiusKm * c
}

export const getAngle = (from: IAddressPoint, to: IAddressPoint) => {
  if (!to.longitude || !from.longitude || !to.latitude || !from.latitude) return
  return Math.atan2(to.longitude - from.longitude, to.latitude - from.latitude) * 180 / Math.PI
}

/**
 * @param fromDate date to start from. Actual day by default
 */
export const getDayOptions = (fromDate?: Moment | null) => {
  const today = moment('00:00:00', dateFormatTime)
  const tomorrow = moment('00:00:00', dateFormatTime)
  tomorrow.date(tomorrow.date() + 1)

  let date = !fromDate ? moment('00:00:00', dateFormatTime) : fromDate.clone()
  date.hours(0)
  date.minutes(0)
  date.seconds(0)
  // date.days(date.days() + 1)

  let options: ISelectOption<string>[] = []

  if (date <= today)
    options.push({ label: t(TRANSLATION.TODAY), value: today.format(dateFormatDate) })
  if (date <= tomorrow)
    options.push({ label: t(TRANSLATION.TOMORROW), value: tomorrow.format(dateFormatDate) })

  for (let i = 1; i <= 13; i++) {
    date.days(date.days() + 1)

    let formattedDate = date.format(dateFormatDate)
    options.push({ label: formattedDate, value: formattedDate })
  }

  return options
}

/**
 * @param fromDate date to start from. Set null to start from 00:00. Actual time by default
 */
export const getTimeOptions = (fromDate?: Moment | null) => {
  let date = !fromDate ? moment('00:00:00', dateFormatTime) : fromDate.clone()
  date.minutes(
    date.minutes() < 15 ? 0 : (date.minutes() > 45 ? 60 : 30),
  )

  let options: ISelectOption<string | null>[] = [
    { label: t(TRANSLATION.NOT_IMPORTANT), value: '' },
  ]
  if (!fromDate || fromDate <= moment())
    options.unshift({ label: t(TRANSLATION.NOW), value: moment().format(dateFormatTimeShort) })

  date.minutes(date.minutes() + 30)

  const tomorrow = moment('00:00:00', dateFormatTime)
  tomorrow.date(tomorrow.date() + 1)

  while (date <= tomorrow) {
    let formattedDate = date.format(dateFormatTimeShort)
    options.push({ label: formattedDate, value: formattedDate })

    date.minutes(date.minutes() + 30)
  }

  return options
}

export const formatComment = (
  ids: IOrder['b_comments'],
  custom: IOrder['b_custom_comment'],
  userID: IUser['u_id'],
  options: IOrder['b_options'],
) => {
  if (options && options.from_tel)
    return `${t(TRANSLATION.DELIVERY)} "${options.object}"${
      options.weight ?
        ` ${t(TRANSLATION.NUMBER_TILL)} ${options.weight}${t(TRANSLATION.KG)}` :
        ''
    }${
      options.is_loading_needs ?
        `, ${t(TRANSLATION.BOXING_REQUIRED, { toLower: true })}` :
        ''
    }${
      userID ?
        `, ${t(TRANSLATION.CLIENT, { toLower: true })} - ${userID}` :
        ''
    }`

  if (ids)
    return `${
      ids
        .filter(item => parseInt(item) < 99)
        .map(item => t(TRANSLATION.BOOKING_COMMENTS[item]))
        .join(', ')
    }${
      custom ?
        `, ${custom}` :
        ''
    }${
      userID ?
        `, ${t(TRANSLATION.CLIENT, { toLower: true })} - ${userID}` :
        ''
    }`

  return `${custom ? `${custom}, ` : ''}${userID ? `${t(TRANSLATION.CLIENT, { toLower: true })} - ${userID}` : ''}`
}

export const getHints = (text?: string) => {
  if (!text) return []
  // const words = [...text.matchAll(/[,\s]*([\w-]+)/g)]
  // const last = words[words.length - 1][1]
  const parts = text.split(',')
  const last = parts[parts.length - 1]
  return findBestMatch(last, hints)
    .ratings
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3)
    .filter(item => item.rating !== 0)
    .map(item => text.replace(last.trim(), item.target))
}

export const shortenAddress = (address: string, splitter?: string) => {
  if (!splitter) {
    return address
  }
  return address.slice(0, address.indexOf(splitter) + splitter.length)
}

export const getStatusClassName = (status: EStatuses) => {
  switch(status) {
    case EStatuses.Fail: return 'fail'
    case EStatuses.Success: return 'success'
    case EStatuses.Loading: return 'loading'
    case EStatuses.Warning: return 'warning'
    default: return 'default'
  }
}

// TODO add api keys
export const getTileServerUrl = () => {
  // switch (SITE_CONSTANTS.MAP_MODE) {
  //   case MAP_MODE.GOOGLE:
  //     return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
  //   case MAP_MODE.OSM:
  //     return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  //   case MAP_MODE.YANDEX:
  //     return 'https://vec03.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}'
  //   default:
  //     return ''
  // }
  return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
}

export const getAttribution = () => {
  // switch (SITE_CONSTANTS.MAP_MODE) {
  //   case MAP_MODE.OSM:
  //     return 'Map data &copy; <a href="https://www.openstreetmap.org/">
  //OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>,
  //Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
  //   case MAP_MODE.YANDEX:
  //     return '<a http="yandex.ru" target="_blank">Яндекс</a>'
  //   default:
  //     return ''
  // }
  return 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
}

export function addHiddenOrder(orderID?: IOrder['b_id'], userID?: IUser['u_id']) {
  if (!orderID || !userID) return
  let hiddenOrders = JSON.parse(localStorage.getItem('hiddenOrders') || '{}')
  if (hiddenOrders[userID]) {
    hiddenOrders[userID] = [...hiddenOrders[userID], orderID]
  } else {
    hiddenOrders[userID] = [orderID]
  }
  localStorage.setItem('hiddenOrders', JSON.stringify(hiddenOrders))
}

export function parseAvailableModes(modes: string) {
  return modes.split(';').reduce((acc: TAvailableModes, value) => {
    let _subModes = value.split('=')
    acc[_subModes[0]] = {}

    if (_subModes[1]) {
      acc[_subModes[0]].subs = _subModes[1].split(',')
    }

    return acc
  }, {})
}

export function parseMoneyModes(modes: string) {
  return modes.split(';').reduce((sum: TMoneyModes, item) => {
    const [main, submodes] = item.split('=')
    const [key, value] = main.split('-')
    if (value) sum[key] = Boolean(parseInt(value))

    if (submodes) {
      sum[key] = {}
      submodes.split(',').forEach(i => {
        const [k, v] = i.split('-');
        (sum[key] as any)[k] = Boolean(parseInt(v))
      })
    }

    return sum
  }, {})
}

export function parseEntries(entries: string) {
  return entries.split(';').map(item => {
    const [key, value] = item.split('-')
    return { key, value }
  })
}

export function parseLanguages(languages: any) {
  return Object.entries(languages).map(([key, value]: [string, any]) => ({
    ...value, id: key, logo: `/assets/images/default/flag-${value.logo}.svg`,
  }))
}

export const getCurrentPosition = () => new Promise<GeolocationPosition>((res, rej) => {
  navigator.geolocation.getCurrentPosition(res, rej)
})

export const getOrderIcon = (order: IOrder) => {
  if (order.b_comments?.includes('98')) return images.deliveryRed
  if (order.b_comments?.includes('97')) return images.motorcycleRed
  if (order.b_comments?.includes('96')) return images.moveColored
  if (order.b_comments?.includes('95')) return images.bigTruck
  if (order.b_voting) return images.votingRed
  return images.uGroup
}

export const getOrderCount = (order: IOrder) => {
  if (['96', '97', '98', '99'].some(i => order.b_comments?.includes(i))) return ''
  if (order.b_comments?.includes('95')) return order.b_options?.carsCount
  return order.b_passengers_count
}

const tProps = ['html', 'text', 'label', 'placeholder', 'alt']
const iProps = ['src']
const rProps = ['imageProps']
export const mapBlockObject = (rawObject: TBlockObject) => {
  const object: TBlockObject = {}
  for (let key in rawObject) {
    if (tProps.includes(key) && rawObject[key]) {
      object[key] = rawObject[key]
        .replaceAll(
          /t\(([^(^)]*?)\)/g,
          (fullMatch: string, translationParameters: string) => {
            try {
              const [key, options] = translationParameters.split(',')
              return t(TRANSLATION[key as keyof typeof TRANSLATION], options ? JSON.parse(options.trim()) : undefined)
            } catch (error) {
              console.error(error)
            }
          },
        )
      continue
    }
    if (iProps.includes(key) && rawObject[key]) {
      object[key] = rawObject[key]
        .replaceAll(
          /i\(([^(^)]*?)\)/g,
          (fullMatch: string, imageKey: keyof typeof images) => images[imageKey],
        )
      continue
    }
    if (rProps.includes(key) && rawObject[key]) {
      object[key] = mapBlockObject(rawObject[key])
      continue
    }
    object[key] = rawObject[key]
  }

  return object
}

export const getBase64 = (file: any) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => resolve(reader.result)
  reader.onerror = error => reject(error)
})
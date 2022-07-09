import React, { useState, useEffect/* , useRef */ } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { useForm } from 'react-hook-form'
import Input, { EInputTypes } from '../../components/Input'
import Separator from '../../components/separator/Separator'
import Card from '../../components/Card/Card'
import Button from '../../components/Button'
import SwitchSlider from '../../components/switch-slider/SwitchSlider'
import { class_auto } from '../../constants/classAuto'
import './styles.scss'
import { t, TRANSLATION } from '../../localization'
import SITE_CONSTANTS, { CURRENCY } from '../../siteConstants'
import Tabs from '../../components/tabs/Tabs'
import Hints from '../../components/objectHints'
import TabsSwitcher, { TABS } from '../../components/passenger-order/tabs-switcher'
import CouriersTransportTabs, { ECourierAutoTypes } from '../../components/passenger-order/delivery/CourierTransportTab'
import CostTabs, { getCosts } from '../../components/passenger-order/delivery/CostTabs'
import {
  calcOrderDistance,
  dateFormatTime,
  getDayOptions,
  getPayment,
  getPhoneError,
  getTimeOptions,
  dateFormatDate,
  dateFormat,
} from '../../tools/utils'
import { cachedOrderDataStateKey, cachedOrderDataValuesKey } from '../../tools/utils'
import images from '../../constants/images'
import moment, { Moment } from 'moment'
import { useCachedState, useWatchWithEffect, useInterval } from '../../tools/hooks'
import { IRootState } from '../../state'
import {
  /* EFileType, */EPointType, EServices, EStatuses, IElevatorState,
  IFile, IOrder, IRoom, IFurniture, TMoveFiles, TRoomFurniture, IOptions, ELogic,
} from '../../types/types'
import * as API from '../../API'
import { EBookingDriverState, ECarClasses, EPaymentWays } from '../../types/types'
import { clientOrderSelectors, clientOrderActionCreators } from '../../state/clientOrder'
import { ordersSelectors, ordersActionCreators } from '../../state/orders'
import { modalsActionCreators } from '../../state/modals'
import { userSelectors } from '../../state/user'
import _ from 'lodash'
import MoveTypeTabs, { EMoveTypes } from '../../components/passenger-order/move/MoveTypeTabs'
import Rooms from '../../components/rooms'
import Slider from '../../components/slider'
import Furniture from '../../components/furniture'
import cn from 'classnames'
import rooms from '../../constants/rooms'
import DateTimeIntervalInput from '../../components/DateTimeIntervalInput'
import BigTruckServices from '../../components/BigTruckServices'
import GroupedInputs from '../../components/GrouppedInputs/GrouppedInputs'
import PassengerMiniOrders from '../../components/passenger-order/MiniOrders'
import { ETimeTypes, IDateTime } from '../../tools/dateTime'
import { ECompareVariants } from '../../components/CompareVariants'
import LocationInput from '../../components/LocationInput'
import { IBigTruckService } from '../../constants/bigTruckServices'
import Checkbox from '../../components/Checkbox'
import RadioCheckbox from '../../components/RadioCheckbox'
import { withLayout } from '../../HOCs/withLayout'

const mapStateToProps = (state: IRootState) => ({
  seats: clientOrderSelectors.seats(state),
  from: clientOrderSelectors.from(state),
  to: clientOrderSelectors.to(state),
  comments: clientOrderSelectors.comments(state),
  time: clientOrderSelectors.time(state),
  selectedOrder: clientOrderSelectors.selectedOrder(state),
  status: clientOrderSelectors.status(state),
  message: clientOrderSelectors.message(state),
  activeOrders: ordersSelectors.activeOrders(state),
  user: userSelectors.user(state),
})

const mapDispatchToProps = {
  ...clientOrderActionCreators,
  getActiveOrders: ordersActionCreators.getActiveOrders,
  setVoteModal: modalsActionCreators.setVoteModal,
  setDriverModal: modalsActionCreators.setDriverModal,
  setMessageModal: modalsActionCreators.setMessageModal,
  setPickTimeModal: modalsActionCreators.setPickTimeModal,
  setCommentsModal: modalsActionCreators.setCommentsModal,
  setSeatsModal: modalsActionCreators.setSeatsModal,
  setOnTheWayModal: modalsActionCreators.setOnTheWayModal,
  setRatingModal: modalsActionCreators.setRatingModal,
  setCandidatesModal: modalsActionCreators.setCandidatesModal,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IFormValues {
  from_porch: string,
  from_floor: string,
  from_room: string,
  from_way: string,
  from_mission: string,
  to_porch: string,
  to_floor: string,
  to_room: string,
  to_way: string,
  to_mission: string,
  customer_price: number,
  object: string,
  is_big_size: boolean,
  cost: number,
  loading: boolean,
  steps?: string
  size?: number
  bigTruckCargoWeight?: number
  carsCount?: number
  bigTruckCarTypes?: string[] | string
  bigTruckCarLogic: ELogic
}

interface IProps extends ConnectedProps<typeof connector> {

}

let prevSelectedOrder: IOrder | null | undefined = null

const defaultOrderDataValues = {
  bigTruckCarLogic: ELogic.Nothing,
}

const defaultDateTimeIntervalValue = {
  dateType: ETimeTypes.Single,
  dateComparator: ECompareVariants.Equal,
  timeType: ETimeTypes.Single,
  timeComparator: ECompareVariants.Equal,
}

const PassengerOrder: React.FC<IProps> = ({
  seats,
  from,
  to,
  comments,
  time,
  activeOrders,
  selectedOrder: selectedOrderID,
  status,
  message,
  user,
  reset: resetClientOrder,
  setMessage,
  setStatus,
  getActiveOrders,
  setSelectedOrder,
  setVoteModal,
  setDriverModal,
  setMessageModal,
  setPickTimeModal,
  setSeatsModal,
  setCommentsModal,
  setOnTheWayModal,
  setRatingModal,
  setCandidatesModal,
}) => {
  // Cards, tabs
  const [paymentWay, setPaymentWay] = useCachedState(
    `${cachedOrderDataStateKey}.paymentWay`,
    EPaymentWays.Cash,
    Object.values(EPaymentWays),
  )
  const [carClass, setCarClass] = useCachedState(
    `${cachedOrderDataStateKey}.carClass`,
    ECarClasses.Economy,
    Object.values(ECarClasses).filter(item => typeof item === 'number') as number[],
  )
  const [tab, setTab] = useCachedState(
    `${cachedOrderDataStateKey}.tab`,
    TABS.WAITING.id,
    Object.values(TABS).map(item => item.id),
  )
  const [courierAuto, setCourierAuto] = useCachedState(
    `${cachedOrderDataStateKey}.courierAuto`,
    ECourierAutoTypes.Light,
    Object.values(ECourierAutoTypes).filter(item => typeof item === 'number'),
  )
  const [moveType, setMoveType] = useCachedState(
    `${cachedOrderDataStateKey}.moveType`,
    EMoveTypes.Apartament,
    Object.values(EMoveTypes).filter(item => typeof item === 'number') as unknown as EMoveTypes[],
  )

  // Switchers
  const [isIntercity, setIsIntercity] = useCachedState(
    `${cachedOrderDataStateKey}.isIntercity`,
    false,
  )

  // Input values
  const [fromDay, setFromDay] = useCachedState(
    `${cachedOrderDataStateKey}.fromDay`,
    undefined,
    getDayOptions().map(item => item.value),
  )
  const [toDay, setToDay] = useCachedState(
    `${cachedOrderDataStateKey}.toDay`,
    undefined,
    getDayOptions().map(item => item.value),
  )
  const [fromTimeFrom, setFromTimeFrom, { dirty: fromTimeFromDirty }] = useCachedState(
    `${cachedOrderDataStateKey}.fromTimeFrom`,
    undefined,
    getTimeOptions().map(item => item.value),
    {
      dirty: true,
    },
  )
  const [fromTimeTill, setFromTimeTill] = useCachedState(
    `${cachedOrderDataStateKey}.fromTimeTill`,
    undefined,
    getTimeOptions().map(item => item.value),
  )
  const [toTimeFrom, setToTimeFrom] = useCachedState(
    `${cachedOrderDataStateKey}.toTimeFrom`,
    undefined,
    getTimeOptions().map(item => item.value),
  )
  const [toTimeTill, setToTimeTill] = useCachedState(
    `${cachedOrderDataStateKey}.fromTimeTill`,
    undefined,
    getTimeOptions().map(item => item.value),
  )
  const [weight, setWeight] = useCachedState(
    `${cachedOrderDataStateKey}.weight`,
    undefined,
    SITE_CONSTANTS
      .PASSENGER_ORDER_CONFIG
      .values
      .weight
      .map(item => item.id),
  )
  const [cost, setCost] = useCachedState<number>(
    `${cachedOrderDataStateKey}.cost`,
    undefined,
    getCosts(),
  )
  const [phone, setPhone] = useCachedState<string | null>(
    `${cachedOrderDataStateKey}.phone`,
    null,
  )
  const [email, setEmail] = useCachedState<string | null>(
    `${cachedOrderDataStateKey}.email`,
    null,
  )
  const [cargoDescription, setCargoDescription] = useCachedState<string | undefined>(
    `${cachedOrderDataStateKey}.cargoDescription`,
  )
  const [fromPhone, setFromPhone] = useCachedState<string | null>(
    `${cachedOrderDataStateKey}.fromPhone`,
    null,
  )
  const [toPhone, setToPhone] = useCachedState<string | null>(
    `${cachedOrderDataStateKey}.toPhone`,
    null,
  )
  const [room, setRoom] = useCachedState<IRoom['id'] | null>(
    `${cachedOrderDataStateKey}.room`,
    null,
  )
  const [elevator, setElevator] = useCachedState<IElevatorState>(
    `${cachedOrderDataStateKey}.elevator`,
    { steps: {} },
  )
  const [furniture, setFurniture] = useCachedState<IFurniture>(
    `${cachedOrderDataStateKey}.furniture`,
    { room: {}, house: {} },
  )
  const [fromTimeInterval, setFromTimeInterval] = useCachedState<IDateTime>(
    `${cachedOrderDataStateKey}.fromTimeInterval`,
    defaultDateTimeIntervalValue,
  )
  const [tillTimeInterval, setTillTimeInterval] = useCachedState<IDateTime>(
    `${cachedOrderDataStateKey}.tillTimeInterval`,
    defaultDateTimeIntervalValue,
  )
  const [bigTruckServices, setBigTruckServices] = useState<IBigTruckService['id'][]>([])

  const [distance, setDistance] = useState(0)
  const [moveFiles, setMoveFiles] = useState<TMoveFiles>({})

  // const moveImagesRef = useRef<HTMLInputElement>(null)

  const roomFurniture = tab === TABS.MOVE.id && moveType === EMoveTypes.Apartament ?
    (room !== null ? furniture.house[room] : null) :
    furniture.room

  const {
    register,
    formState: { errors },
    control,
    setValue,
    handleSubmit: formHandleSubmit,
    reset,
  } = useForm<IFormValues>({
    criteriaMode: 'all',
    mode: 'onSubmit',
    defaultValues: {
      ...defaultOrderDataValues,
      ...JSON.parse(localStorage.getItem(cachedOrderDataValuesKey) || '{}'),
    },
  })

  const values = useWatchWithEffect<IFormValues>(
    {
      // TODO
      // @ts-ignore
      control,
    },
    (actualValues) => {
      localStorage.setItem(cachedOrderDataValuesKey, JSON.stringify(actualValues))
    },
  )

  const selectedOrder = activeOrders?.find(item => item.b_id === selectedOrderID)
  const selectedOrderDriver = selectedOrder?.drivers &&
    selectedOrder
      ?.drivers
      .find(item => item.c_state > EBookingDriverState.Canceled)

  useInterval(() => {
    user && getActiveOrders()
  }, 5000)

  useEffect(() => {
    if (user) getActiveOrders()
  }, [user])

  useEffect(() => {
    setDistance(calcOrderDistance([from, to]))
  }, [from, to])

  const openCurrentModal = () => {
    if (!selectedOrder) {
      setVoteModal(false)
      setDriverModal(false)
      setOnTheWayModal(false)
      return
    }

    if (selectedOrder.b_voting && !selectedOrderDriver) {
      if (
        selectedOrder.b_start_datetime &&
        ((selectedOrder.b_max_waiting || SITE_CONSTANTS.WAITING_INTERVAL) - moment().diff(selectedOrder.b_start_datetime, 'seconds')) <= 0
      ) {
        API.cancelDrive(selectedOrder.b_id)
        return API.postDrive({
          ...selectedOrder,
          b_start_datetime: moment(),
          b_payment_way: paymentWay as EPaymentWays,
          b_max_waiting: undefined,
        })
          .then(res => {
            getActiveOrders()
            setSelectedOrder(res.b_id)
            window.scroll(0, 0)
          })
          .catch(error => {
            console.error(error)
            setMessageModal({
              isOpen: true,
              status: EStatuses.Fail,
              message: error.message,
            })
          })
      } else return setVoteModal(true)
    }

    if (['96', '95'].some(item => selectedOrder?.b_comments?.includes(item)) && !selectedOrderDriver) {
      setCandidatesModal(true)
      return
    }

    if (!selectedOrderDriver || (selectedOrderDriver.c_state === EBookingDriverState.Finished)) {
      setVoteModal(false)
      setDriverModal(false)
      setOnTheWayModal(false)
      return
    }

    if ([EBookingDriverState.Performer, EBookingDriverState.Arrived].includes(selectedOrderDriver.c_state)) {
      setVoteModal(false)
      setDriverModal(true)
    } else if (selectedOrderDriver?.c_state === EBookingDriverState.Started) {
      setDriverModal(false)
      setOnTheWayModal(true)
    }
  }

  // Used to open rating modal
  useEffect(() => {
    const prevSelectedOrderDriver = prevSelectedOrder
      ?.drivers
      ?.find(item => item.c_state !== EBookingDriverState.Canceled)
    if (!prevSelectedOrderDriver) return
    if (
      prevSelectedOrderDriver.c_state <= EBookingDriverState.Started &&
      !activeOrders?.find(item => item.b_id === prevSelectedOrder?.b_id)
    ) {
      const id = prevSelectedOrder?.b_id
      API.getOrder(id as string)
        .then((res) => {
          const resDriver = res
            ?.drivers
            ?.find(item => item.c_state !== EBookingDriverState.Canceled)
          if (resDriver?.c_state === EBookingDriverState.Finished)
            setRatingModal({ isOpen: true, orderID: id })
        })
        .catch(error => console.error(error))
    }
  }, [selectedOrder])

  useEffect(() => {
    openCurrentModal()
  }, [selectedOrderID, selectedOrderDriver?.c_state])

  const handleOrderClick = (order: IOrder) => {
    if (
      selectedOrderID === order.b_id
    ) {
      openCurrentModal()
    } else setSelectedOrder(order.b_id)
  }

  // const handleMoveFilesChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (room === null) return
  //   const files = e.target.files
  //   setMoveFiles(prev => ({
  //     ...prev,
  //     [room]: (prev[room] || []).concat(files ?
  //       [...files].map(item => ({
  //         type: item.type.includes('video') ? EFileType.Video : EFileType.Image,
  //         src: URL.createObjectURL(item),
  //       })) :
  //       []),
  //   }))
  // }

  const handleDeleteMoveFile = (src: IFile['src']) => {
    if (!room) return
    setMoveFiles(prev => ({ ...prev, [room]: prev[room].filter(item => item.src !== src) }))
  }
  const handleDeleteMoveFiles = () => {
    if (!room) return
    setMoveFiles(prev => ({ ...prev, [room]: [] }))
  }

  const handleLogicChange = (type: ELogic) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === ELogic.And) {
      if (values.bigTruckCarLogic === ELogic.And) setValue('bigTruckCarLogic', ELogic.Nothing)
      else setValue('bigTruckCarLogic', ELogic.And)
    }
    if (type === ELogic.Or) {
      if (values.bigTruckCarLogic === ELogic.Or) setValue('bigTruckCarLogic', ELogic.Nothing)
      else setValue('bigTruckCarLogic', ELogic.Or)
    }
  }

  const handleSubmit = async() => {
    try {
      if (!phone || getPhoneError(phone)) {
        throw t(TRANSLATION.PHONE_PATTERN_ERROR)
      }

      if (
        (tab === TABS.DELIVERY.id || tab === TABS.MOTORCYCLE.id) &&
        (getPhoneError(fromPhone) || getPhoneError(toPhone))
      ) {
        throw t(TRANSLATION.PHONE_PATTERN_ERROR)
      }

      if (
        !from ||
        !(
          (from.latitude && from.longitude) ||
          from.address
        )
      ) {
        throw t(TRANSLATION.MAP_FROM_NOT_SPECIFIED_ERROR)
      }
      if (
        !(tab === TABS.MOVE.id && moveType === EMoveTypes.Handy) &&
        (
          !to ||
          !(
            (to.latitude && to.longitude) ||
            to.address
          )
        )
      ) {
        throw t(TRANSLATION.MAP_TO_NOT_SPECIFIED_ERROR)
      }

      const commentObj: any = {}
      commentObj['b_comments'] = comments.ids || []
      comments.custom && (commentObj['b_custom_comment'] = comments.custom)
      comments.flightNumber && (commentObj['b_flight_number'] = comments.flightNumber)
      comments.placard && (commentObj['b_placard'] = comments.placard)
      tab === TABS.DELIVERY.id && commentObj['b_comments'].push(98)
      tab === TABS.MOTORCYCLE.id && commentObj['b_comments'].push(97)
      tab === TABS.MOVE.id && commentObj['b_comments'].push(96)
      tab === TABS.WAGON.id && commentObj['b_comments'].push(95)

      let startTime: Moment
      if ([TABS.DELIVERY.id, TABS.MOVE.id].includes(tab)) {
        startTime = moment(`${fromDay} ${fromTimeFrom === 'now' ? moment().format(dateFormatTime) : (fromTimeFrom || '23:59')}`, dateFormat)
      } else if (
        tab === TABS.VOTING.id ||
        (tab === TABS.WAITING.id && time === 'now') ||
        time === 'now'
      ) {
        startTime = moment()
      } else {
        startTime = moment(time)
      }

      let options: IOptions = {
        fromShortAddress: from?.shortAddress,
        toShortAddress: to?.shortAddress,
      }
      if ([TABS.DELIVERY.id, TABS.MOTORCYCLE.id, TABS.MOVE.id].includes(tab))
        options = {
          ...options,
          courier_auto: tab === TABS.DELIVERY.id ? courierAuto : TABS.MOTORCYCLE.id,
          from_porch: values.from_porch,
          from_floor: values.from_floor,
          from_room: values.from_room,
          from_way: values.from_way,
          from_mission: values.from_mission,
          from_tel: fromPhone,
          from_day: fromDay,
          from_time_from: fromTimeFrom,
          from_time_to: fromTimeTill,
          to_porch: values.to_porch,
          to_floor: values.to_floor,
          to_room: values.to_room,
          to_way: values.to_way,
          to_mission: values.to_mission,
          to_tel: toPhone,
          to_day: toDay,
          to_time_from: toTimeFrom,
          to_time_to: toTimeTill,
          object: values.object,
          weight: tab === TABS.DELIVERY.id ? weight : undefined,
          is_big_size: values.is_big_size,
          cost: values.cost || cost,
          is_loading_needs: values.loading,
          customer_price: values.customer_price,
          moveType: moveType,
          steps: values.steps,
          elevator: elevator,
          furniture: moveType === EMoveTypes.Apartament ? furniture.house : furniture.room,
          time_is_not_important: fromTimeFrom === '',
        }

      if (tab === TABS.WAGON.id)
        options = {
          ...options,
          fromDateTimeInterval: fromTimeInterval,
          tillDateTimeInterval: tillTimeInterval,
          bigTruckCargo: cargoDescription,
          size: values.size,
          bigTruckCargoWeight: values.bigTruckCargoWeight,
          carsCount: values.carsCount,
          bigTruckCarLogic: values.bigTruckCarLogic,
          bigTruckCarTypes:
          typeof values.bigTruckCarTypes === 'string' ?
            [values.bigTruckCarTypes] :
            values.bigTruckCarTypes,
          bigTruckServices: bigTruckServices,
        }

      await API.postDrive({
        b_start_address: from.address,
        b_start_latitude: from.latitude,
        b_start_longitude: from.longitude,
        ...(
          (tab === TABS.MOVE.id && moveType === EMoveTypes.Apartament) ?
            {
              // b_destination_address: from.address,
              // b_destination_latitude: from.latitude,
              // b_destination_longitude: from.longitude,
            } :
            {
              b_destination_address: to?.address,
              b_destination_latitude: to?.latitude,
              b_destination_longitude: to?.longitude,
            }
        ),
        ...commentObj,
        b_contact: phone,
        b_start_datetime: startTime,
        b_passengers_count: seats,
        b_car_class: [TABS.DELIVERY.id, TABS.MOVE.id, TABS.WAGON.id].includes(tab) ? ECarClasses.Any : carClass,
        b_payment_way: cardPaymentEnabled ? paymentWay : EPaymentWays.Cash,
        // b_payment_card идентификатор платежной карты
        // b_tips         чаевые
        // b_cars_count   число машин
        b_max_waiting: tab === TABS.VOTING.id ?
          SITE_CONSTANTS.WAITING_INTERVAL :
          (tab === TABS.WAITING.id ? 7200 : 3600),
        b_services: tab === TABS.VOTING.id ? [EServices.Voting.toString()] : [],
        b_options: options,
      })

      getActiveOrders()

      window.scroll(0, 0)
      reset()
      localStorage.removeItem(cachedOrderDataValuesKey)
      localStorage.removeItem('to')
      resetClientOrder()
    } catch (error) {
      console.error(error)
      setStatus(EStatuses.Fail)
      if (typeof error === 'string') {
        setMessage(error)
      } else {
        setMessage(t(TRANSLATION.ERROR))
      }
    }
  }

  const handleFurnitureChange = (id: number, value: TRoomFurniture) => {
    if (room == null) return
    setFurniture(prev => {
      if (tab === TABS.MOVE.id && moveType === EMoveTypes.Apartament) {
        return ({ ...prev, house: { ...prev.house, [id]: value } })
      }
      return ({ ...prev, room: value })
    })
  }

  const handleFromDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFromDay(e.target.value)
    if (!fromTimeFromDirty) {
      setFromTimeFrom(fromTimeFromOptions[1].value)
    }
  }

  const insertCargoTypeIntoCargoDescription = (cargoType: string) => {
    setCargoDescription((cargoDescription ?? '') + cargoType + ' ')
  }

  const fromTimeFromOptions =
    getTimeOptions(moment(fromDay, dateFormatDate).days() === moment().days() ? moment() : null)

  // Used to open rating modal
  useEffect(() => {
    prevSelectedOrder = selectedOrder
  }, [selectedOrder])

  let cardPaymentEnabled = false
  const mode = SITE_CONSTANTS.MONEY_MODES[(Object.values(TABS).find(i => i.id === tab) as any).sid]
  if (typeof mode === 'object') {
    if (tab === TABS.DELIVERY.id)
      cardPaymentEnabled = mode[courierAuto]
    if (tab === TABS.MOVE.id)
      cardPaymentEnabled = mode[moveType]
  } else cardPaymentEnabled = mode

  return (
    <section>
      <PassengerMiniOrders handleOrderClick={handleOrderClick} />
      <form onSubmit={formHandleSubmit(handleSubmit)} className="input-groups">
        <TabsSwitcher tab={tab} onChange={(id: typeof tab) => setTab(id)} />
        <CouriersTransportTabs
          tab={courierAuto as ECourierAutoTypes}
          onChange={(id: typeof courierAuto) => setCourierAuto(id)}
          visible={tab === TABS.DELIVERY.id}
        />
        <MoveTypeTabs
          tab={moveType as EMoveTypes}
          onChange={(id: typeof moveType) => setMoveType(id)}
          visible={tab === TABS.MOVE.id}
        />

        {tab === TABS.MOVE.id && moveType === EMoveTypes.Apartament && (
          <>
            <Rooms furnitureState={furniture.house} value={room} onChange={setRoom} />
            <div className="move__elevator">
              {!elevator.elevator && (
                <Input
                  inputProps={{
                    type: 'number',
                    min: 0,
                    disabled: room === null,
                    value: room !== null && elevator.steps[room] !== undefined ? elevator.steps[room] : '',
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                      room !== null && setElevator(prev => ({
                        ...prev,
                        steps: { ...prev.steps, [room]: parseInt(e.target.value) },
                      })),
                  }}
                  label={t(TRANSLATION.NUMBER_OF_STEPS)}
                  error={errors.steps?.message}
                  fieldWrapperClassName={
                    cn(
                      'move__steps',
                      {
                        'move__steps--oneline': _.sum(Object.values(elevator.steps)),
                        'move__steps--disabled': room === null,
                      },
                    )
                  }
                />
              )}
              {!_.sum(Object.values(elevator.steps)) && (
                <div className={cn('move__elevator-switcher-wrapper', { 'move__elevator-switcher-wrapper--oneline': elevator.elevator })}>
                  <label
                    className="input__label"
                  >
                    {t(TRANSLATION.ELEVATOR)}
                  </label>
                  <SwitchSlider
                    isVertical={window.innerWidth < 768 && !elevator.elevator}
                    checked={!!elevator.elevator}
                    onValueChanged={
                      (value) => setElevator(prev => ({ ...prev, elevator: value }))
                    }
                    startButton={{ label: t(TRANSLATION.NO) }}
                    endButton={{ label: t(TRANSLATION.YES) }}
                  />
                </div>
              )}
              <hr className="move__elevator-hr" style={{ backgroundColor: SITE_CONSTANTS.PALETTE.primary.dark }} />
            </div>
            {/* <label
              className="move__images"
              onClick={e => {
                if (room === null) {
                  e.preventDefault()
                  e.stopPropagation()
                  setMessageModal({ isOpen: true, message: t(TRANSLATION.ONE_ROOM_ERROR) })
                }
              }}
            >
              <input
                type="file"
                multiple
                hidden
                accept="video/mp4,video/x-m4v,video/*,image/*"
                ref={moveImagesRef}
                onChange={handleMoveFilesChanged}
              />
              <Button
                type="button"
                text={t(TRANSLATION.ADD_IMAGES)}
                className="move__images-button"
                skipHandler
                imageProps={{
                  src: images.addPhoto,
                }}
              />
            </label> */}
            {room !== null && !!moveFiles[room]?.length && (
              <Slider
                files={moveFiles[room]}
                controls
                handleDelete={handleDeleteMoveFile}
                handleDeleteAll={handleDeleteMoveFiles}
                mobileFriendly
                headerLabel={t((rooms.find(i => i.id === room) as IRoom).label)}
              />
            )}
          </>
        )}

        {tab === TABS.MOVE.id && (
          <>
            <Furniture
              value={roomFurniture}
              room={room}
              listAll={moveType !== EMoveTypes.Apartament}
              key={`${room}_${moveType}`}
              handleChange={handleFurnitureChange}
              total={
                moveType === EMoveTypes.Apartament ?
                  Object.values(furniture.house).reduce((sum, i) => sum + _.sum(Object.values(i)), 0) :
                  _.sum(Object.values(furniture.room))
              }
              // roomsChoosen={Object.values(roomFurniture)
              // .reduce((sum, i) => sum + (_.sum(Object.values(i)) > 0 ? 1 : 0), 0)}
            />
            <hr className="move__separator" style={{ backgroundColor: SITE_CONSTANTS.PALETTE.primary.dark }} />
          </>
        )}

        {![TABS.WAGON.id, TABS.MOTORCYCLE.id].includes(tab) &&
          <SwitchSlider
            checked={isIntercity}
            onValueChanged={value => setIsIntercity(value)}
            startButton={{ label: t(tab === TABS.MOVE.id ? TRANSLATION.SAME_STATE : TRANSLATION.CITY) }}
            endButton={{ label: t(tab === TABS.MOVE.id ? TRANSLATION.INTERSTATE : TRANSLATION.INTERCITY) }}
            wrapperClassName="is-intercity"
          />
        }

        <LocationInput type={EPointType.From} isIntercity={isIntercity} />

        {[TABS.WAGON.id, TABS.TRIP.id].includes(tab) &&
          <DateTimeIntervalInput
            value={fromTimeInterval}
            onChange={setFromTimeInterval}
            isSimple={tab === TABS.TRIP.id}
          />
        }

        {[TABS.DELIVERY.id].includes(tab) && (
          <GroupedInputs>
            <Input
              inputProps={{
                type: 'number',
                ...register('from_porch'),
              }}
              label={t(TRANSLATION.PORCH)}
              error={errors.from_porch?.message}
            />
            <Input
              inputProps={{
                type: 'number',
                ...register('from_floor'),
              }}
              label={t(TRANSLATION.FLOOR)}
              error={errors.from_floor?.message}
            />
            <Input
              inputProps={{
                type: 'number',
                ...register('from_room'),
              }}
              label={t(TRANSLATION.ROOM)}
              error={errors.from_room?.message}
            />
          </GroupedInputs>
        )}
        {
          [TABS.DELIVERY.id, TABS.MOVE.id].includes(tab) &&
          SITE_CONSTANTS.PASSENGER_ORDER_CONFIG.visibility.fromWay &&
            <Input
              inputProps={{
                ...register('from_way'),
              }}
              label={t(tab === TABS.MOVE.id ? TRANSLATION.COMMENT : TRANSLATION.WAY)}
              error={errors.from_way?.message}
            />
        }
        {
          [TABS.DELIVERY.id].includes(tab) &&
          SITE_CONSTANTS.PASSENGER_ORDER_CONFIG.visibility.fromMission &&
            <details>
              <summary>
                {t(TRANSLATION.COURIER_MISSION)}
              </summary>
              <Input
                inputProps={{
                  placeholder: t(TRANSLATION.WRITE_COURIER_MISSION),
                  ...register('from_mission'),
                }}
                inputType={EInputTypes.Textarea}
                error={errors.from_mission?.message}
              />
            </details>
        }
        {(tab === TABS.DELIVERY.id || tab === TABS.MOTORCYCLE.id) &&
          <Input
            inputProps={{
              value: fromPhone || '',
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setFromPhone(e.target.value),
            }}
            inputType={EInputTypes.MaskedPhone}
            error={getPhoneError(fromPhone)}
          />
        }
        {tab === TABS.DELIVERY.id && (
          <>
            <Input
              inputProps={{
                value: fromDay,
                onChange: handleFromDayChange,
              }}
              inputType={EInputTypes.Select}
              options={getDayOptions()}
            />
            <GroupedInputs>
              <Input
                inputProps={{
                  value: fromTimeFrom || '',
                  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setFromTimeFrom(e.target.value),
                }}
                inputType={EInputTypes.Select}
                label={t(TRANSLATION.TIME_FROM)}
                options={fromTimeFromOptions}
              />
              <Input
                inputProps={{
                  value: fromTimeTill || '',
                  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setFromTimeTill(e.target.value),
                }}
                inputType={EInputTypes.Select}
                label={t(TRANSLATION.TIME_TILL)}
                options={getTimeOptions(fromTimeFrom ? moment(fromTimeFrom, dateFormatTime) : null)}
              />
            </GroupedInputs>
          </>
        )}
        {[TABS.MOVE.id].includes(tab) && (
          <GroupedInputs>
            <Input
              inputProps={{
                value: fromDay,
                onChange: handleFromDayChange,
                type: 'date',
              }}
              label={t(TRANSLATION.PICKUP_DATE)}
            />
            <Input
              inputProps={{
                value: fromTimeFrom || '',
                onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setFromTimeFrom(e.target.value),
              }}
              inputType={EInputTypes.Select}
              label={t(TRANSLATION.PICKUP_TIME)}
              options={fromTimeFromOptions}
            />
          </GroupedInputs>
        )}

        {
          !(tab === TABS.MOVE.id && moveType === EMoveTypes.Handy) &&
            <LocationInput type={EPointType.To} isIntercity={isIntercity} />
        }

        {[TABS.WAGON.id, TABS.TRIP.id].includes(tab) && (
          <DateTimeIntervalInput
            value={tillTimeInterval}
            onChange={setTillTimeInterval}
            isSimple={tab === TABS.TRIP.id}
          />
        )}

        {
          tab === TABS.WAGON.id &&
          <>
            <Input
              inputType={EInputTypes.Select}
              inputProps={{
                value: '-1',
                onChange:
                  (e: any) => {
                    if (e.target.value === '-1') return
                    insertCargoTypeIntoCargoDescription(t(e.target.value))
                  },
              }}
              label={t(TRANSLATION.CARGO_P)}
              options={
                [{ label: t(TRANSLATION.CHOSE), value: '-1' }]
                  .concat(
                    SITE_CONSTANTS.BIG_TRUCK_CARGO_TYPES.map(item => ({ label: t(item.value), value: item.value })),
                  )
              }
              fieldWrapperClassName="big-truck__cargo-types"
              oneline
            />
            <Input
              inputType={EInputTypes.Textarea}
              inputProps={{
                value: cargoDescription ?? '',
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCargoDescription(e.target.value),
                placeholder: t(TRANSLATION.CARGO_DESCRIPTION_PLACEHOLDER),
                rows: 4,
              }}
            />
            <GroupedInputs label={`${
              t(TRANSLATION.CARGO_VOLUME_P)
            } ${t(TRANSLATION.AND, { toLower: true })} ${
              t(TRANSLATION.CARGO_WEIGHT_P, { toLower: true })
            }`}
            >
              <Input
                inputType={EInputTypes.Default}
                inputProps={{
                  type: 'number',
                  min: 0,
                  ...register('size'),
                }}
              />
              <Input
                inputType={EInputTypes.Default}
                inputProps={{
                  type: 'number',
                  min: 0,
                  ...register('bigTruckCargoWeight'),
                }}
              />
            </GroupedInputs>
            <GroupedInputs label={t(TRANSLATION.CAR_QUANTITY_AND_CAR_TYPE)}>
              <Input
                fieldWrapperClassName="big-truck__car-count"
                inputProps={{
                  type: 'number',
                  min: 1,
                  max: 99,
                  ...register('carsCount'),
                }}
              />
              <div className="big-truck__car-types">
                <Input
                  inputType={EInputTypes.Select}
                  inputProps={{
                    ...register('bigTruckCarTypes'),
                    multiple: values.bigTruckCarLogic !== ELogic.Nothing,
                    size: 1,
                  }}
                  options={
                    SITE_CONSTANTS.BIG_TRUCK_TRANSPORT_TYPES
                      .map(item => ({ label: t(item.value), value: item.key }))
                  }
                />
                <GroupedInputs className="big-truck__logic">
                  <RadioCheckbox
                    textLabel={t(TRANSLATION.AND)}
                    checked={values.bigTruckCarLogic === ELogic.And}
                    onChange={handleLogicChange(ELogic.And)}
                  />
                  <RadioCheckbox
                    textLabel={t(TRANSLATION.OR)}
                    checked={values.bigTruckCarLogic === ELogic.Or}
                    onChange={handleLogicChange(ELogic.Or)}
                  />
                </GroupedInputs>
              </div>
            </GroupedInputs>
            <BigTruckServices
              value={bigTruckServices}
              onChange={setBigTruckServices}
            />
          </>
        }
        {
          SITE_CONSTANTS.ENABLE_CUSTOMER_PRICE && ![TABS.MOVE.id, TABS.WAGON.id, TABS.TRIP.id].includes(tab) &&
          <Input
            inputProps={{
              type: 'number',
              min: 0,
              ...register('customer_price'),
            }}
            label={`${t(TRANSLATION.CUSTOMER_PRICE)}, ${CURRENCY.SIGN}`}
            error={errors.customer_price?.message}
          />
        }
        {[TABS.DELIVERY.id].includes(tab) &&
          <GroupedInputs>
            <Input
              inputProps={{
                type: 'number',
                ...register('to_porch'),
              }}
              label={t(TRANSLATION.PORCH)}
              error={errors.to_porch?.message}
            />
            <Input
              inputProps={{
                type: 'number',
                ...register('to_floor'),
              }}
              label={t(TRANSLATION.FLOOR)}
              error={errors.to_floor?.message}
            />
            <Input
              inputProps={{
                type: 'number',
                ...register('to_room'),
              }}
              label={t(TRANSLATION.ROOM)}
              error={errors.to_room?.message}
            />
          </GroupedInputs>
        }
        {
          ([TABS.DELIVERY.id].includes(tab) || (tab === TABS.MOVE.id && moveType !== EMoveTypes.Handy)) &&
          SITE_CONSTANTS.PASSENGER_ORDER_CONFIG.visibility.toWay &&
            <Input
              inputProps={{
                ...register('to_way'),
              }}
              label={t(tab === TABS.MOVE.id ? TRANSLATION.COMMENT : TRANSLATION.WAY)}
              error={errors.to_way?.message}
            />
        }
        {
          [TABS.DELIVERY.id].includes(tab) &&
          SITE_CONSTANTS.PASSENGER_ORDER_CONFIG.visibility.toMission &&
            <details>
              <summary><span>{t(TRANSLATION.COURIER_MISSION)}</span></summary>
              <Input
                inputProps={{
                  placeholder: t(TRANSLATION.WRITE_COURIER_MISSION),
                  ...register('to_mission'),
                }}
                inputType={EInputTypes.Textarea}
                error={errors.to_mission?.message}
              />
            </details>
        }
        {
          (tab === TABS.DELIVERY.id || tab === TABS.MOTORCYCLE.id) &&
          <Input
            inputProps={{
              value: toPhone || '',
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setToPhone(e.target.value),
            }}
            inputType={EInputTypes.MaskedPhone}
            error={getPhoneError(toPhone)}
          />
        }
        {tab === TABS.DELIVERY.id && <>
          <Input
            inputProps={{
              value: toDay,
              onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setToDay(e.target.value),
            }}
            inputType={EInputTypes.Select}
            options={getDayOptions(moment(fromDay, dateFormatDate))}
          />
          <GroupedInputs>
            <Input
              inputProps={{
                value: toTimeFrom || '',
                onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setToTimeFrom(e.target.value),
              }}
              inputType={EInputTypes.Select}
              label={t(TRANSLATION.TIME_FROM)}
              options={getTimeOptions(moment(toDay, dateFormatDate).days() === moment().days() ? moment() : null)}
            />
            <Input
              inputProps={{
                value: toTimeTill || '',
                onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setToTimeTill(e.target.value),
              }}
              inputType={EInputTypes.Select}
              label={t(TRANSLATION.TIME_TILL)}
              options={getTimeOptions(toTimeFrom ? moment(toTimeFrom, dateFormatTime) : null)}
            />
          </GroupedInputs>
        </>}

        {
          (tab === TABS.DELIVERY.id || tab === TABS.MOTORCYCLE.id) &&
          <>
            <Input
              inputProps={{
                ...register('object'),
              }}
              label={t(TRANSLATION.WHAT_WE_DELIVERING)}
              error={errors.object?.message}
            />
            <Hints
              hints={[
                t(TRANSLATION.DOCUMENTS),
                t(TRANSLATION.GROCERIES),
                t(TRANSLATION.GIFT),
                t(TRANSLATION.FLOWERS),
              ]}
              onClick={item => setValue('object', item)}
            />
          </>
        }
        {
          tab === TABS.DELIVERY.id &&
          <div className='weight'>
            <Tabs
              tabs={
                SITE_CONSTANTS
                  .PASSENGER_ORDER_CONFIG
                  .values
                  .weight
                  .map(item => (
                    { ...item, label: `${t(TRANSLATION.NUMBER_TILL)} ${item.id}${t(TRANSLATION.KG)}` }
                  ))
              }
              activeTabID={weight}
              onChange={(id) => setWeight(id as typeof weight)}
            />
          </div>
        }
        {(tab === TABS.DELIVERY.id || tab === TABS.MOTORCYCLE.id) && <>
          <Checkbox
            label={t(TRANSLATION.LARGE_PACKAGE)}
            {...register('is_big_size')}
          />
          <GroupedInputs className="groupped-inputs--cost">
            {tab === TABS.DELIVERY.id ?
              (
                <Input
                  inputProps={{
                    type: 'number',
                    ...register('cost'),
                  }}
                  label={t(TRANSLATION.COST)}
                  error={errors.cost?.message}
                />
              ) :
              <CostTabs defaultValue={cost} onChange={id => setCost(id)} />
            }
            {
              distance ?
                <span className="order-payment colored">
                  {
                    tab !== TABS.DELIVERY.id &&
                    getPayment(null, null, distance, moment(fromTimeFrom, dateFormatTime), carClass).text
                  }
                </span> :
                null
            }
          </GroupedInputs>
        </>}
        {
          tab === TABS.DELIVERY.id &&
          <>
            <div className='info' style={{ color: SITE_CONSTANTS.PALETTE.primary.light }}>{t(TRANSLATION.DELIVERY_INFO)}</div>
            {/* TODO rename to boxing */}
            <Checkbox
              {...register('loading')}
              label={t(TRANSLATION.BOXING_REQUIRED)}
            />
          </>
        }
        {
          ![TABS.DELIVERY.id, TABS.MOTORCYCLE.id, TABS.MOVE.id, TABS.WAGON.id, TABS.TRIP.id].includes(tab) && <>
            <Separator text={t(TRANSLATION.AUTO_CLASS)} />
            <div className="taxi-cards">
              {
                class_auto.map(auto => {
                  const _time = typeof time === 'string' ?
                    moment() :
                    time
                  const value = getPayment(
                    null, null, distance, _time, auto.id,
                  ).value
                  const payment = `~${value.toFixed(2)}${CURRENCY.NAME}`

                  return (
                    <Card
                      key={auto.id}
                      active={auto.id === carClass}
                      src={auto.src}
                      text={t(TRANSLATION.CAR_CLASSES[auto.id])}
                      onClick={() => setCarClass(auto.id)}
                      payment={payment}
                    />
                  )
                })
              }
            </div>
            <div className="waiting-block">
              <span>
                <img src={images.carAlt} alt={t(TRANSLATION.CAR)} />
                <label className="colored">{t(TRANSLATION.FREE)}: <span>7</span></label>
              </span>
              <div className="vertical-line" />
              <span>
                <img src={images.clock} alt={t(TRANSLATION.CLOCK)} />
                <label className="colored">{t(TRANSLATION.WAITING)}: <span>5 {t(TRANSLATION.MINUTES)}</span></label>
              </span>
            </div>
          </>}
        <Separator text={t(TRANSLATION.PAYMENT_WAY)} />
        <div className="credit-cards">
          <Card
            src={images.cash}
            onClick={() => setPaymentWay(EPaymentWays.Cash)}
            text={t(TRANSLATION.PAYMENT_WAYS[1])}
            active={paymentWay === EPaymentWays.Cash || !cardPaymentEnabled}
          />
          <Card
            src={images.card}
            onClick={() => setPaymentWay(EPaymentWays.Credit)}
            text={t(TRANSLATION.PAYMENT_WAYS[2])}
            disabled={true}
          // onClick={(e) => {
          //   e.preventDefault()
          //   setCardActiveClass(2)
          //   setTieCardModal(true)
          // }}
          />
        </div>
        {![TABS.DELIVERY.id, TABS.MOTORCYCLE.id, TABS.MOVE.id, TABS.WAGON.id, TABS.TRIP.id].includes(tab) && <>
          <Separator text={t(TRANSLATION.ORDER_DETAILS)} />
          <div className="info-block">
            <div onClick={() => setPickTimeModal(true)}>
              <img
                src={images.timer}
                alt={t(TRANSLATION.CLOCK)}
              />
              <label style={{ color: SITE_CONSTANTS.PALETTE.primary.dark }}>
                {
                  typeof time === 'string' ?
                    t(TRANSLATION.NOW) :
                    time.isSame(new Date(), 'day') ?
                      `${t(TRANSLATION.TODAY)} ${time.format(dateFormatTime)}` :
                      `${t(TRANSLATION.TOMORROW)} ${time.format(dateFormatTime)}`
                }
              </label>
            </div>
            <div onClick={() => setSeatsModal(true)}>
              <img src={images.multipleUsers} alt={t(TRANSLATION.SEATS)} />
              <label style={{ color: SITE_CONSTANTS.PALETTE.primary.dark }}>
                {t(TRANSLATION.SEATS)}: <span>{seats}</span>
              </label>
            </div>
            <div onClick={() => setCommentsModal(true)}>
              <span className="comment-controls" style={{ height: '55px' }}>
                <img src={images.messageIcon} alt={t(TRANSLATION.MESSAGE)} />
              </span>
              <label style={{ color: SITE_CONSTANTS.PALETTE.primary.dark }}>
                {t(TRANSLATION.COMMENT)}
              </label>
            </div>
          </div>
        </>}

        {tab === TABS.WAGON.id && (
          <Input
            inputProps={{
              placeholder: t(TRANSLATION.EMAIL),
              type: 'email',
              value: email || '',
            }}
            defaultValue={user?.u_email}
            onChange={setEmail}
          />
        )}

        {![TABS.TRIP.id].includes(tab) && (
          <Input
            inputProps={{
              value: phone || '',
            }}
            fieldWrapperClassName="phone-input"
            inputType={EInputTypes.MaskedPhone}
            error={getPhoneError(phone)}
            buttons={[{ src: images.checkMark }]}
            defaultValue={user?.u_phone}
            onChange={setPhone}
          />
        )}

        <div className="order-vote">
          <Button
            type="submit"
            text={t(tab === TABS.VOTING.id ? TRANSLATION.VOTE : TRANSLATION.TO_ORDER, { toUpper: true })}
            status={status}
            label={message}
          />
        </div>
      </form>
    </section>
  )
}

export default withLayout(connector(PassengerOrder))

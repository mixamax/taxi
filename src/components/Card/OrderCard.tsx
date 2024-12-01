import React from 'react'
import { t, TRANSLATION } from '../../localization'
import SITE_CONSTANTS, { CURRENCY } from '../../siteConstants'
// import { Chat } from '../chat/chat.js'
// import { ChatUpdaterMode } from '../chat/messaging'
import { EBookingDriverState, IOrder, IUser } from '../../types/types'
import './styles.scss'
import images from '../../constants/images'
import { dateFormatDate, dateShowFormat, formatComment, getOrderCount, getOrderIcon, getPayment } from '../../tools/utils'
import cn from 'classnames'

interface IProps {
  user: IUser,
  order: IOrder,
  className?: string,
  style?: React.CSSProperties,
  onClick?: React.PointerEventHandler<HTMLDivElement>,
  showChat?: boolean
}

const OrderCard: React.FC<IProps> = ({
  order,
  user,
  className,
  showChat,
  style,
  onClick,
}) => {
  // const chatHostDivID = `chatDiv${order.b_id}`

  const getStatusText = () => {
    if (order.b_voting) return t(TRANSLATION.VOTER)
    return ''
  }

  const getStatusTextColor = () => {
    if (order.b_voting) return '#FFD600'
    // 'reccomended': return '#00A72F'\
    return '#000'
  }

  const driver = order.drivers?.find(item => item.c_state > EBookingDriverState.Canceled)

  return (
    <div
      className={cn('status-card colored', { 'status-card--history': order.b_canceled || order.b_completed }, className)}
      style={style}
      onClick={onClick}
    >
      {/* {showChat && user ?
        (
          <div id={chatHostDivID} className="order-chat"> */}
      {/* TODO remove ignore */}
      {/* @ts-ignore */}
      {/* <Chat
              parentID={chatHostDivID}
              chatTag={order.b_id}
              userID={user.u_id}
              myName={'me'}
              hisName={'customer'}
              mode={ChatUpdaterMode.DRIVER}
            />
          </div>
        ) :
        null} */}
      <span style={{ color: getStatusTextColor() }}>№{order.b_id} {getStatusText()}</span>
      <div>
        <span className="status-card__points">
          <div className="status-card__from">
            <span className="status-card__from-address">
              {order.b_start_address || `${order.b_start_latitude}, ${order.b_start_longitude}`}
            </span>
            <span className="status-card__time">
              <label>
                {
                  order.b_voting &&
                  driver?.c_state !== EBookingDriverState.Finished ?
                    t(TRANSLATION.NOW) :
                    order.b_start_datetime?.format(
                      order.b_options?.time_is_not_important ? dateFormatDate : dateShowFormat,
                    )
                }
              </label>
              <img src={images.clockGreen} alt={t(TRANSLATION.CLOCK)}/>
            </span>
          </div>

          <div className="status-card__to">
            <img src={images.turnBr} alt={t(TRANSLATION.TO)}/>
            <span>
              {order.b_destination_address || `${order.b_destination_latitude}, ${order.b_destination_longitude}`}
            </span>
          </div>
        </span>
      </div>
      <div className="status-card__separator separate status-card__cost">
        <span/>
        <span style={{ color: SITE_CONSTANTS.PALETTE.primary.light }}>
          {getPayment(order).value} {CURRENCY.NAME}<img src={images.cash} alt={t(TRANSLATION.CASH)}/>
        </span>
      </div>
      <div className="status-card__comments">
        <span>
          <img
            src={
              order.b_comments?.includes('97') || order.b_comments?.includes('98') ?
                (order.b_options?.from_porch ? images.deliveryRed : images.motorcycleRed) :
                images.chatIconBr
            }
            alt={t(TRANSLATION.COMMENT)}
          />
          <label>{formatComment(order.b_comments, order.b_custom_comment, order.u_id, order.b_options)}</label>
        </span>
        {
          !(order.b_comments?.includes('97') || order.b_comments?.includes('98')) &&
            <span className='status-card__seats'>
              <label>{getOrderCount(order)}</label>
              <img
                src={getOrderIcon(order)}
                alt={t(TRANSLATION.SEATS)}
              />
            </span>
        }
      </div>
      {
        driver?.c_state !== EBookingDriverState.Finished && <div className="status-card__other-info">
          <span>
            {/* TODO real time */}
            {t(TRANSLATION.APPROXIMATE_TIME)}: 1 {t(TRANSLATION.HOUR)}
            <img src={images.clockGrey} alt={t(TRANSLATION.CLOCK)}/>
          </span>
          <img src={images.stars} alt={t(TRANSLATION.STARS)}/>
        </div>
      }
    </div>
  )
}

export default OrderCard
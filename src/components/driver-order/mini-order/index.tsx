import React from 'react'
import { t, TRANSLATION } from '../../../localization'
import { CURRENCY } from '../../../siteConstants'
import './mini-order.scss'
import ChatToggler from '../../Chat/Toggler'
import { EBookingDriverState, IOrder, IUser } from '../../../types/types'
import images from '../../../constants/images'
import { EPaymentType, getOrderCount, getOrderIcon, getPayment } from '../../../tools/utils'
import cn from 'classnames'

interface IProps {
  user: IUser,
  order: IOrder,
  onClick: (event: React.MouseEvent, id: IOrder['b_id']) => any
}

const MiniOrder: React.FC<IProps> = ({
  user,
  order,
  onClick,
}) => {
  const payment = getPayment(order)

  const _onClick = (event: React.PointerEvent<HTMLDivElement>) => {
    if (onClick) {
      onClick(event, order.b_id)
    }
  }

  const borderColor = '#FFFFFF' // TODO
  const _style = { borderRight: `12px solid ${borderColor}` }
  const driver = order.drivers?.find(item => item.c_state > EBookingDriverState.Canceled)

  return (
    <div className={cn('mini-order', { 'mini-order--history': order.b_canceled || order.b_completed })} style={_style} onClick={_onClick}>
      <span className="colored">№{order.b_id}</span>
      {driver && driver.u_id === user.u_id && !(order.b_canceled || order.b_completed) ?
        <ChatToggler
          anotherUserID={order.u_id}
          orderID={order.b_id}
        /> :
        null
      }
      <img src={images.stars} alt={t(TRANSLATION.STARS)}/>
      {/** TODO time */}
      <span className="mini-order__time colored">0 {t(TRANSLATION.MINUTES)}</span>
      <span className="mini-order__icon">
        <img src={getOrderIcon(order)} alt="clients"/>
        {getOrderCount(order)}
      </span>
      <div className={'mini-order__amount amount colored' + (payment.type === EPaymentType.Customer ? ' _blue' : '')}>
        {payment.type === EPaymentType.Customer ? '⥮' : '~'}
        <div className="amount__value">{payment.value}</div>
        <div className="amount__currency">{CURRENCY.SIGN}</div>
      </div>
    </div>
  )
}

export default MiniOrder
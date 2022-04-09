import React, { useEffect, useState } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { t, TRANSLATION } from '../../localization'
import { modalsActionCreators, modalsSelectors } from '../../state/modals'
import { clientOrderSelectors } from '../../state/clientOrder'
import { IRootState } from '../../state'
import './styles.scss'
import Overlay from './Overlay'
import { IOrder, IReply, IUser } from '../../types/types'
import cn from 'classnames'
import images from '../../constants/images'
import { dateFormatDate } from '../../tools/utils'
import SITE_CONSTANTS, { CURRENCY } from '../../siteConstants'
import Button from '../Button'
import * as API from '../../API'
import ChatToggler from '../Chat/Toggler'
import { ordersSelectors } from '../../state/orders'
import { useInterval } from '../../tools/hooks'
import { userSelectors } from '../../state/user'

const mapStateToProps = (state: IRootState) => ({
  isOpen: modalsSelectors.isCandidatesModalOpen(state),
  selectedOrder: clientOrderSelectors.selectedOrder(state),
  activeOrders: ordersSelectors.activeOrders(state),
  user: userSelectors.user(state),
})

const mapDispatchToProps = {
  setCandidatesModal: modalsActionCreators.setCandidatesModal,
  setMessageModal: modalsActionCreators.setMessageModal,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {
}

const CandidatesModal: React.FC<IProps> = ({
  isOpen,
  selectedOrder,
  activeOrders,
  user,
  setCandidatesModal,
  setMessageModal,
}) => {
  const [activeCandidate, setActiveCandidate] = useState<IUser['u_id'] | null>(null)
  const [order, setOrder] = useState<IOrder | null>(null)

  useEffect(() => {
    if (user && isOpen && selectedOrder) {
      API.getOrder(selectedOrder)
        .then(setOrder)
    }
  }, [selectedOrder, isOpen])

  useInterval(() => {
    if (user && isOpen && selectedOrder) {
      API.getOrder(selectedOrder)
        .then(setOrder)
    }
  }, 3000)

  const handleCandidateClick = (candidate: IUser['u_id']) => {
    setActiveCandidate(prev => prev === candidate ? null : candidate)
  }

  const handleChoseClick = () => {
    if (!selectedOrder || !activeCandidate) return
    API.chooseCandidate(selectedOrder, activeCandidate)
      .then(() => {
        setCandidatesModal(false)
        setMessageModal({ isOpen: true, message: 'Candidate was chosen' })
      })
  }

  return (
    <Overlay
      isOpen={isOpen && !!order?.drivers?.length}
      onClick={() => setCandidatesModal(false)}
    >
      <div
        className="modal candidates-modal"
        style={{ display: isOpen && !!order?.drivers?.length ? 'flex' : 'none' }}
      >
        <form>
          <fieldset>
            <legend>{t(TRANSLATION.RESPONDING_PERFORMERS)}</legend>
            {order?.drivers?.map(item => (
              <div
                className={
                  cn(
                    'candidate colored',
                    { 'candidate--active': item.u_id === activeCandidate },
                  )
                }
                onClick={() => handleCandidateClick(item.u_id)}
              >
                <div className="candidate__header">
                  <div className="candidate__header-avatar">
                    <img src={images.driverAvatar} alt={item.u_id} />
                  </div>
                  <div className="candidate__header-info">
                    <h6 className="candidate__header-name">{item.u_id} {item.c_id}</h6>
                    <div className="candidate__header-subinfo">
                      {/* <p className="candidate__header-registration">{t(TRANSLATION.REGISTRATION)}:
                      {item.u_registration.format(dateFormatDate)}</p> */}
                      <p className="candidate__header-replies">{t(TRANSLATION.COMMENTS)}: {/*item.u_replies?.length || */0} {t(TRANSLATION.CHOSEN)}: {/*item.u_choosen || */0}&nbsp;&nbsp;&nbsp;{t(TRANSLATION.PRICE_PERFORMER)}: {item.c_options?.performers_price}{CURRENCY.SIGN}</p>
                    </div>
                    <div
                      className={cn('candidate__header-arrow', { 'candidate__header-arrow--active': activeCandidate === item.u_id })}
                      style={{
                        borderRight: `10px solid ${SITE_CONSTANTS.PALETTE.primary.dark}`,
                        borderBottom: `10px solid ${SITE_CONSTANTS.PALETTE.primary.dark}`,
                      }}
                    />
                  </div>
                </div>
                <div className={cn('buttons candidate__buttons', { 'candidate__buttons--active': activeCandidate === item.u_id })}>
                  <Button
                    text={t(TRANSLATION.CHOSE)}
                    onClick={handleChoseClick}
                  />
                  {
                    <ChatToggler
                      anotherUserID={item.u_id}
                      orderID={order.b_id}
                    />
                  }
                </div>
                <div
                  className={cn('candidate__replies', { 'candidate__replies--active': activeCandidate === item.u_id })}
                  style={{ maxHeight: activeCandidate === item.u_id ? 600 * (/*item.u_replies?.length || */0) : 0 }}
                >
                  {/*item.u_replies?*/([] as IReply[]).map(reply => (
                    <div className="reply">
                      <div className="reply__row">
                        <div className="reply__icon"><img src={images.timer} alt={t(TRANSLATION.DATE_P)}/></div>
                        <div className="reply__content">
                          <b>{t(TRANSLATION.DATE_P)}</b>: {reply.date.format(dateFormatDate)}
                        </div>
                      </div>
                      <div className="reply__row">
                        <div className="reply__icon"><img src={images.uGroup} alt={t(TRANSLATION.CUSTOMER)}/></div>
                        <div className="reply__content">
                          <b>{t(TRANSLATION.CUSTOMER)}</b>: {reply.customerName}
                        </div>
                      </div>
                      <div className="reply__row">
                        <div className="reply__icon"><img src={images.cash} alt={t(TRANSLATION.COST)}/></div>
                        <div className="reply__content">
                          <b>{t(TRANSLATION.COST)}</b>: {reply.payment}
                        </div>
                      </div>
                      <div className="reply__row">
                        <div className="reply__icon"><img src={images.chatIconBr} alt={t(TRANSLATION.COMMENT2)}/></div>
                        <div className="reply__content">
                          <b>{t(TRANSLATION.COMMENT2)}</b>: {reply.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </fieldset>
        </form>
      </div>
    </Overlay>
  )
}

export default connector(CandidatesModal)

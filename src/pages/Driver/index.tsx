import React, { useEffect } from 'react'
import DriverOrders from './Orders'
import DriverMap from './Map'
import { t, TRANSLATION } from '../../localization'
import { connect, ConnectedProps } from 'react-redux'
import { IRootState } from '../../state'
import { useInterval, useQuery } from '../../tools/hooks'
import history from '../../tools/history'
import './styles.scss'
import { ordersSelectors, ordersActionCreators } from '../../state/orders'
import { modalsActionCreators } from '../../state/modals'
import { userSelectors } from '../../state/user'
import { EUserRoles } from '../../types/types'
import cn from 'classnames'
import ErrorFrame from '../../components/ErrorFrame'
import images from '../../constants/images'
import { withLayout } from '../../HOCs/withLayout'

const mapStateToProps = (state: IRootState) => ({
  activeOrders: ordersSelectors.activeOrders(state),
  readyOrders: ordersSelectors.readyOrders(state),
  historyOrders: ordersSelectors.historyOrders(state),
  user: userSelectors.user(state),
})

const mapDispatchToProps = {
  ...ordersActionCreators,
  setLoginModal: modalsActionCreators.setLoginModal
}

const connector = connect(mapStateToProps, mapDispatchToProps)

export enum EDriverTabs {
  Map = 'map',
  Lite = 'lite',
  Detailed = 'detailed'
}

interface IProps extends ConnectedProps<typeof connector> {

}

const Driver: React.FC<IProps> = ({
  activeOrders,
  readyOrders,
  historyOrders,
  user,
  getActiveOrders,
  getHistoryOrders,
  getReadyOrders,
  setLoginModal
}) => {
  const { tab = EDriverTabs.Lite } = useQuery()

  useInterval(() => {
    user && getActiveOrders()
  }, 2000)

  useInterval(() => {
    user && getReadyOrders()
  }, 3000)

  useInterval(() => {
    user && getHistoryOrders()
  }, 10000)

  useEffect(() => {
    if (user) {
      getActiveOrders()
      getReadyOrders()
      getHistoryOrders()
    }
  }, [user])

  if (user?.u_role !== EUserRoles.Driver) {
    return <ErrorFrame
      renderImage={() => (
        <div className="errorIcon" onClick={() => setLoginModal(true)}>
          <img src={images.avatar} alt={t(TRANSLATION.ERROR)} style={{ marginTop: '50px' }}/>
        </div>
      )}
      title={t(TRANSLATION.UNAUTHORIZED_ACCESS)}
    />
  }

  return (
    <>
      <div className="driver-tabs">
        <button
          onClick={() => history.push(`?tab=${EDriverTabs.Lite}`)}
          className={cn('driver-tabs__tab', { 'driver-tabs__tab--active': tab === EDriverTabs.Lite })}
        >
          {t(TRANSLATION.LIGHT)}
        </button>
        <button
          onClick={() => history.push(`?tab=${EDriverTabs.Detailed}`)}
          className={cn('driver-tabs__tab', { 'driver-tabs__tab--active': tab === EDriverTabs.Detailed })}
        >
          {t(TRANSLATION.ALL)}
        </button>
        <button
          onClick={() => history.push(`?tab=${EDriverTabs.Map}`)}
          className={cn('driver-tabs__tab', { 'driver-tabs__tab--active': tab === EDriverTabs.Map })}
        >
          {t(TRANSLATION.MAP)}
        </button>
      </div>
      {(tab === EDriverTabs.Lite || tab === EDriverTabs.Detailed) &&
        <DriverOrders
          user={user}
          type={tab}
          activeOrders={activeOrders}
          readyOrders={readyOrders}
          historyOrders={historyOrders}
        />}
      {tab === EDriverTabs.Map &&
        <DriverMap
          user={user}
          activeOrders={activeOrders}
          readyOrders={readyOrders}
        />}
    </>
  )
}

export default withLayout(connector(Driver))
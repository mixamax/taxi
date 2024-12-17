import React, { Suspense, lazy, useEffect } from 'react'
import { Route, Switch, Redirect, Link, useHistory } from 'react-router-dom'
import {
  configSelectors,
} from './state/config'
import { connect, ConnectedProps } from 'react-redux'
import images from './constants/images'
import { t, TRANSLATION } from './localization'
import { IRootState } from './state'
import { EStatuses, EUserRoles, IUser } from './types/types'
import { userSelectors } from './state/user'
import Sandbox from './pages/Sandbox'
import AdminPanel from './pages/AdminPanel'

const PassengerOrder = lazy(() => import('./pages/Passenger'))
const Order = lazy(() => import('./pages/Order'))
const DriverOrder = lazy(() => import('./pages/Driver'))

const mapStateToProps = (state: IRootState) => ({
  status: configSelectors.status(state),
  user: userSelectors.user(state),
})

const connector = connect(mapStateToProps)

interface IProps extends ConnectedProps<typeof connector> {

}

const AppRoutesWrapper: React.FC<IProps> = ({ status, user }) => {
  return status === EStatuses.Success ?
    <Suspense fallback={null}><AppRoutes user={user}/></Suspense> :
    <UnavailableBase/>
}

const UnavailableBase = () => {
  return <section>
    <div className="loading-frame">
      <img src={images.error} alt={t(TRANSLATION.ERROR)}/>
      <div className="loading-frame__title">{t(TRANSLATION.DATABASE_IS_UNAVAILABLE)}</div>
    </div>
  </section>
}

const HomePageRedirect = () => {
  const history = useHistory()
  useEffect(() => {
    const timer = setTimeout(() => {
      history.push('/passenger-order')
    }, 11000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <a
        href='/passenger-order'
        style={{
          background: 'linear-gradient(90deg, rgb(15, 44, 118) 0%, rgb(30, 88, 235) 100%)',
          height: 60,
          lineHeight: '60px',
          width: 300,
          color: '#fff',
          textAlign: 'center',
          fontSize: '20px',
          borderRadius: 10
        }}
      >
        Go to map +1
      </a>
    </div>
  )
}

const AppRoutes: React.FC<{user: IUser | null}> = ({ user }) => (
  <Switch>
    <Route exact path="/" component={PassengerOrder}/>
    <Route path="/passenger-order" component={PassengerOrder}/>
    <Route path="/driver-order/:id" component={Order}/>
    <Route path="/driver-order" component={DriverOrder}/>
    <Route path="/driver-order-test" component={DriverOrder}/>
    <Route path="/sandbox" component={Sandbox}/>
    <Route path="/admin" component={AdminPanel}/>
    <Redirect
      from='*'
      to={
        user?.u_role === EUserRoles.Client ?
          '/passenger-order' :
          user?.u_role === EUserRoles.Driver ? '/driver-order' : '/'
      }
    />
  </Switch>
)

export default connector(AppRoutesWrapper)

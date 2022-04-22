import React, { Suspense, lazy } from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'
import {
  configSelectors,
} from './state/config'
import { connect, ConnectedProps } from 'react-redux'
import images from './constants/images'
import { t, TRANSLATION } from './localization'
import { IRootState } from './state'
import { EStatuses, EUserRoles, IUser } from './types/types'
import { userSelectors } from './state/user'
import Test from './pages/Test'
import Sandbox from './pages/Sandbox'

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

const AppRoutes: React.FC<{user: IUser | null}> = ({ user }) => (
  <Switch>
    <Route exact path="/" component={PassengerOrder}/>
    <Route path="/test" component={Test}/>
    <Route path="/passenger-order" component={PassengerOrder}/>
    <Route path="/driver-order/:id" component={Order}/>
    <Route path="/driver-order" component={DriverOrder}/>
    <Route path="/sandbox" component={Sandbox}/>
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

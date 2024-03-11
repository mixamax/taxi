import React, { useEffect } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { useHistory } from 'react-router-dom'
import AppRoutes from './Routes'
import CancelOrderModal from './components/modals/CancelModal'
import TimerModal from './components/modals/PickTimeModal'
import CommentsModal from './components/modals/CommentsModal'
import DriverModal from './components/modals/DriverModal'
import RatingModal from './components/modals/RatingModal'
import OnTheWayModal from './components/modals/OnTheWayModal'
import TieCardModal from './components/modals/TieCardModal'
import CardDetailsModal from './components/modals/CardDetailsModal'
import VoteModal from './components/modals/VoteModal'
import PlaceModal from './components/modals/SeatsModal'
import LoginModal from './components/modals/login'
import AlarmModal from './components/modals/AlarmModal'
import MapModal from './components/modals/MapModal'
import TakePassengerModal from './components/modals/TakePassengerModal'
import CancelDriverOrderModal from './components/modals/DriverCancelModal'
import ProfileModal from './components/modals/ProfileModal'
import CandidatesModal from './components/modals/CandidatesModal'
import MessageModal from './components/modals/MessageModal'
import SITE_CONSTANTS from './siteConstants'
import MetaTags from 'react-meta-tags'
import { configSelectors } from './state/config'
import { userActionCreators, userSelectors } from './state/user'
import './App.scss'
import { IRootState } from './state'
import * as API from './API'
import { modalsSelectors } from './state/modals'
import Chat from './components/Chat'
import WACodeModal from './components/modals/login/WACodeModal'
import RefCodeModal from './components/modals/login/RefCodeModal'

const mapStateToProps = (state: IRootState) => ({
  language: configSelectors.language(state),
  configStatus: configSelectors.status(state),
  activeChat: modalsSelectors.activeChat(state),
  user: userSelectors.user(state),
})

const mapDispatchToProps = {
  initUser: userActionCreators.initUser,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {
}

const App: React.FC<IProps> = ({
  language,
  activeChat,
  user,
  configStatus,
  initUser,
}) => {
  if ((window as any).ReactNativeWebView) {
    (window as any).ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'SYSTEM', message: 'START' }),
    )
  }

  const history = useHistory()

  useEffect(() => {
    initUser()

    API.activateChatServer()
    const interval = setInterval(() => API.activateChatServer(), 30000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  const getMetaTags = () => {
    let _tags = [],
      _domain = `${window.location.protocol}//${window.location.host}/`

    _tags.push(
      SITE_CONSTANTS.OG_IMAGE && (
        <meta property="og:image" content={_domain + SITE_CONSTANTS.OG_IMAGE}/>
      ),
    )
    _tags.push(
      SITE_CONSTANTS.TW_IMAGE && (
        <meta
          property="twitter:image"
          content={_domain + SITE_CONSTANTS.TW_IMAGE}
        />
      ),
    )
    _tags.push(
      <style>{`
    .colored { 
      color: ${SITE_CONSTANTS.PALETTE.primary.dark}
    }

    section details summary {
      color: ${SITE_CONSTANTS.PALETTE.primary.dark};
    }
    section details summary::after {
      border-top: 10px solid ${SITE_CONSTANTS.PALETTE.primary.main};
    }

    .modal .active {
      color: ${SITE_CONSTANTS.PALETTE.primary.dark}
    }
    .modal form fieldset h3, .modal form fieldset h4 {
      color: ${SITE_CONSTANTS.PALETTE.primary.dark}
    }

    .phone-link {
      border-bottom: 1px solid ${SITE_CONSTANTS.PALETTE.primary.light};
    }
    .phone-link:hover {
      border-bottom-color: ${SITE_CONSTANTS.PALETTE.primary.dark};
    }
    `}</style>,
    )

    _tags = _tags.filter((item) => !!item)
    return _tags.length > 0 ? <MetaTags>{_tags}</MetaTags> : null
  }

  return (
    <React.Fragment key={`${language.id}_${configStatus}`}>
      {getMetaTags()}
      <AppRoutes/>
      {<>
        {/* <PositionTracker/> */}
        <VoteModal/>
        <TimerModal/>
        <CommentsModal/>
        <DriverModal/>
        <OnTheWayModal/>
        <CancelOrderModal/>
        <RatingModal/>
        <TieCardModal/>
        <CardDetailsModal/>
        <WACodeModal />
        <RefCodeModal />
        <PlaceModal/>
        <AlarmModal/>
        <TakePassengerModal/>
        <CancelDriverOrderModal/>
        <MapModal/>
        <LoginModal/>
        <CandidatesModal/>
        {user && <ProfileModal/>}
        {activeChat && <Chat key={activeChat}/>}
        <MessageModal/>
      </>}
    </React.Fragment>
  )
}

export default connector(App)

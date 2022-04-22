import React, { useEffect } from 'react'
import { connect, ConnectedProps } from 'react-redux'
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
import Config from './config'
import SITE_CONSTANTS from './siteConstants'
import MetaTags from 'react-meta-tags'
import { configActionCreators, configSelectors } from './state/config'
import { userActionCreators, userSelectors } from './state/user'
import './App.scss'
import { IRootState } from './state'
import * as API from './API'
import { modalsSelectors } from './state/modals'
import Chat from './components/Chat'

const mapStateToProps = (state: IRootState) => ({
  language: configSelectors.language(state),
  configStatus: configSelectors.status(state),
  activeChat: modalsSelectors.activeChat(state),
  user: userSelectors.user(state),
})

const mapDispatchToProps = {
  clearConfig: configActionCreators.clearConfig,
  checkConfig: configActionCreators.checkConfig,
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
  clearConfig,
  checkConfig,
  initUser,
}) => {
  if ((window as any).ReactNativeWebView) {
    (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: 'SYSTEM', message: 'START' }))
  }

  useEffect(() => {
    initUser()

    let _params = new URLSearchParams(window.location.search),
      _config = _params.get('config'),
      _clearConfig = _params.get('clearConfig') !== null

    if (_clearConfig) {
      clearConfig()
    } else {
      if (_config) {
        checkConfig(_config)
      }
    }

    if (!!_config) { _params.delete('config') }
    if (!!_clearConfig) { _params.delete('clearConfig') }

    if (_config || _clearConfig) {
      const _path = window.location.origin + window.location.pathname
      let _newUrl = _params.toString() ? _path + '?' + _params.toString() : _path
      window.history.replaceState({}, document.title, _newUrl)
    } else {
      let _savedConfig = Config.SavedConfig
      if (!!_savedConfig) {
        checkConfig(_savedConfig)
      } else {
        Config.setDefaultName()
      }
    }

    API.activateChatServer()
    const interval = setInterval(() => API.activateChatServer(), 30000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  const getMetaTags = () => {
    let _tags = [],
      _domain = `${window.location.protocol}//${window.location.host}/`

    _tags.push(SITE_CONSTANTS.OG_IMAGE && <meta property="og:image" content={_domain + SITE_CONSTANTS.OG_IMAGE} />)
    _tags.push(SITE_CONSTANTS.TW_IMAGE && <meta property="twitter:image" content={_domain + SITE_CONSTANTS.TW_IMAGE} />)
    _tags.push(<style>{`
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
    `}</style>)

    _tags = _tags.filter(item => !!item)
    return (_tags.length > 0) ?
      <MetaTags>
        {_tags}
      </MetaTags> :
      null
  }

  return <React.Fragment key={`${language.id}_${configStatus}`}>
    {getMetaTags()}
    <AppRoutes />
    {/* <PositionTracker/> */}
    <VoteModal />
    <TimerModal />
    <CommentsModal />
    <DriverModal />
    <OnTheWayModal />
    <CancelOrderModal />
    <RatingModal />
    <TieCardModal />
    <CardDetailsModal />
    <PlaceModal />
    <AlarmModal />
    <TakePassengerModal />
    <CancelDriverOrderModal />
    <MapModal />
    <LoginModal />
    <MessageModal />
    <CandidatesModal />
    {user && <ProfileModal />}
    {activeChat && <Chat key={activeChat} />}
  </React.Fragment>
}

export default connector(App)

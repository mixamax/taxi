import React, { useState, useEffect } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import Button from '../Button'
import './styles.scss'
import L from 'leaflet'
import SITE_CONSTANTS from '../../siteConstants'
import { t, TRANSLATION } from '../../localization'
import { IRootState } from '../../state'
import { modalsActionCreators, modalsSelectors } from '../../state/modals'
import { MapContainer, Marker, CircleMarker, TileLayer, Popup, Polyline } from 'react-leaflet'
import { EMapModalTypes } from '../../state/modals/constants'
import { clientOrderActionCreators, clientOrderSelectors } from '../../state/clientOrder'
import { orderSelectors } from '../../state/order'
import { EStatuses, IAddressPoint, IRouteInfo } from '../../types/types'
import images from '../../constants/images'
import { useInterval } from '../../tools/hooks'
import * as API from '../../API'
import _ from 'lodash'
import Overlay from './Overlay'
import { defaultMapModal } from '../../state/modals/reducer'
import { getAttribution, getTileServerUrl } from '../../tools/utils'
import cn from 'classnames'

const defaultZoom = 15

const mapStateToProps = (state: IRootState) => ({
  isOpen: modalsSelectors.isMapModalOpen(state),
  type: modalsSelectors.mapModalType(state),
  defaultCenter: modalsSelectors.mapModalDefaultCenter(state),
  clientFrom: clientOrderSelectors.from(state),
  clientTo: clientOrderSelectors.to(state),
  detailedOrderStart: orderSelectors.start(state),
  detailedOrderDestination: orderSelectors.destination(state),
  takePassengerFrom: modalsSelectors.takePassengerModalFrom(state),
  takePassengerTo: modalsSelectors.takePassengerModalTo(state),
})

const mapDispatchToProps = {
  setMapModal: modalsActionCreators.setMapModal,
  setClientFrom: clientOrderActionCreators.setFrom,
  setClientTo: clientOrderActionCreators.setTo,
  setTakePassengerModalFrom: modalsActionCreators.setTakePassengerModalFrom,
  setTakePassengerModalTo: modalsActionCreators.setTakePassengerModalTo,
  setMessageModal: modalsActionCreators.setMessageModal,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {
}

const MapModal: React.FC<IProps> = ({
  isOpen,
  type,
  defaultCenter,
  clientFrom,
  clientTo,
  detailedOrderStart,
  detailedOrderDestination,
  takePassengerFrom,
  takePassengerTo,
  setClientFrom,
  setClientTo,
  setTakePassengerModalFrom,
  setTakePassengerModalTo,
  setMapModal,
  setMessageModal,
}) => {
  const [userCoordinates, setUserCoordinates] = useState<IAddressPoint | null>(null)
  const [buttonsPopupCoordinates, setButtonPopupCoordinates] = useState<[number, number] | null>(null)
  const [routeInfo, setRouteInfo] = useState<IRouteInfo | null>(null)
  const [showRouteInfo, setShowRouteInfo] = useState(false)
  const [map, setMap] = useState<L.Map | null>(null)

  let from: IAddressPoint | null = null,
    to: IAddressPoint | null = null
  switch (type) {
    case EMapModalTypes.Client:
      from = clientFrom
      to = clientTo
      break
    case EMapModalTypes.OrderDetails:
      from = detailedOrderStart
      to = detailedOrderDestination
      break
    case EMapModalTypes.TakePassenger:
      from = takePassengerFrom || null
      to = takePassengerTo || null
      break
    default:
      console.error('Wrong map type:', type)
      break
  }

  let setFrom: ((point?: IAddressPoint | null) => any) | null = null,
    setTo: ((point?: IAddressPoint | null) => any) | null = null
  switch (type) {
    case EMapModalTypes.Client:
      setFrom = point => setClientFrom(point || null)
      setTo = point => setClientTo(point || null)
      break
    case EMapModalTypes.OrderDetails:
      break
    case EMapModalTypes.TakePassenger:
      setFrom = point => setTakePassengerModalFrom(point)
      setTo = point => setTakePassengerModalTo(point)
      break
    default:
      console.error('Wrong map type:', type)
      break
  }

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const point = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        }
        setUserCoordinates(point)
        map?.panTo([point.latitude, point.longitude])
      },
      error => console.error(error),
      { enableHighAccuracy: true },
    )
  }, [])

  useInterval(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserCoordinates({
          latitude: coords.latitude,
          longitude: coords.longitude,
        })
      },
      error => console.error(error),
      { enableHighAccuracy: true },
    )
  }, 20000)

  useEffect(() => {
    if (map) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (!(e.originalEvent?.target as HTMLDivElement)?.classList?.contains('map')) return

        const newCoords: [number, number] = [e.latlng.lat, e.latlng.lng]
        setButtonPopupCoordinates((prev) => {
          if (_.isEqual(prev, newCoords)) {
            return null
          }
          return newCoords
        })
      })
    }
  }, [map])

  useEffect(() => {
    defaultCenter && map?.panTo(defaultCenter)
  }, [defaultCenter])

  useEffect(() => {
    map?.invalidateSize()
    userCoordinates && !defaultCenter &&
      map?.panTo([userCoordinates.latitude, userCoordinates.longitude] as [number, number])
  }, [isOpen])

  const handleFromClick = (isButtonPopup?: boolean) => {
    if (!setFrom || !map) return

    if (!isButtonPopup) {
      const center = map.getCenter()
      setFrom({ latitude: center.lat, longitude: center.lng })
      return
    }

    if (!buttonsPopupCoordinates) return
    setFrom({ latitude: buttonsPopupCoordinates[0], longitude: buttonsPopupCoordinates[1] })
  }
  const handleToClick = (isButtonPopup?: boolean) => {
    if (!setTo || !map) return

    if (!isButtonPopup) {
      const center = map.getCenter()
      setTo({ latitude: center.lat, longitude: center.lng })
      return
    }

    if (!buttonsPopupCoordinates) return
    setTo({ latitude: buttonsPopupCoordinates[0], longitude: buttonsPopupCoordinates[1] })
  }
  const handleRouteClick = () => {
    if (!from || !to) return

    API.makeRoutePoints(from, to)
      .then((info) => {
        setRouteInfo(info)
        setShowRouteInfo(true)
        setTimeout(() => {
          setShowRouteInfo(false)
        }, 5000)
      })
      .catch((error) => {
        console.error(error)
        setMessageModal({ isOpen: true, message: t(TRANSLATION.ERROR), status: EStatuses.Fail })
      })
  }

  return (
    <Overlay
      isOpen={isOpen}
      onClick={() => setMapModal({ ...defaultMapModal })}
    >
      <div
        className={cn('modal map-modal', { 'map-modal--active': isOpen })}
        key={SITE_CONSTANTS.MAP_MODE}
      >
        <MapContainer
          center={defaultCenter || SITE_CONSTANTS.DEFAULT_POSITION}
          zoom={defaultZoom}
          className='map'
          // crs={SITE_CONSTANTS.MAP_MODE === MAP_MODE.YANDEX ? L.CRS.EPSG3395 : L.CRS.EPSG3857}
          whenCreated={setMap}
        >
          {
            showRouteInfo && (
              <div
                className="map-modal__route"
              >

                <b>{t(TRANSLATION.DISTANCE)}</b> {routeInfo?.distance}km<br/>
                <b>{t(TRANSLATION.EXPECTED_DURATION)}</b>&nbsp;
                {routeInfo?.time.hours && routeInfo?.time.hours > 10 ?
                  routeInfo.time.hours :
                  `0${routeInfo?.time.hours}`}:
                {routeInfo?.time.minutes && routeInfo.time.minutes > 10 ?
                  routeInfo.time.minutes :
                  `0${routeInfo?.time.minutes}`}
              </div>
            )
          }
          {
            routeInfo && (
              <Polyline positions={routeInfo.points}/>
            )
          }
          {/* {
            buttonsPopupCoordinates && <Popup position={buttonsPopupCoordinates}>
              <div>
                {!!setFrom && (
                  <Button
                    text={t(TRANSLATION.FROM)}
                    onClick={() => handleFromClick(true)}
                  />
                )}
                {!!setTo && (
                  <Button
                    text={t(TRANSLATION.TO)}
                    onClick={() => handleToClick(true)}
                  />
                )}
                {!!from && !!to && (
                  <Button
                    text={t(TRANSLATION.BUILD_THE_ROUTE)}
                    onClick={handleRouteClick}
                  />
                )}
                <Button
                  text={t(TRANSLATION.CLOSE)}
                  onClick={() => setMapModal({ isOpen: false })}
                />
              </div>
            </Popup>
          } */}
          {
            !!userCoordinates?.latitude &&
            !!userCoordinates?.longitude &&
              <CircleMarker center={[userCoordinates.latitude, userCoordinates.longitude]}/>
          }
          {!!from?.latitude && !!from?.longitude &&
          <Marker
            position={[from.latitude, from.longitude]}
            icon={new L.Icon({
              iconUrl: images.markerFrom,
              iconSize: [35, 41],
              iconAnchor: [18, 41],
              popupAnchor: [0, -35],
            })}
          >
            <Popup>{t(TRANSLATION.FROM)}{!!from.address && `: ${from.shortAddress || from.address}`}</Popup>
          </Marker>
          }
          {!!to?.latitude && !!to?.longitude &&
          <Marker
            position={[to.latitude, to.longitude]}
            icon={new L.Icon({
              iconUrl: images.markerTo,
              iconSize: [36, 41],
              iconAnchor: [18, 41],
              popupAnchor: [0, -35],
            })}
          >
            <Popup>{t(TRANSLATION.TO)}{!!to.address && `: ${to.shortAddress || to.address}`}</Popup>
          </Marker>
          }
          <img
            src="https://unpkg.com/leaflet@1.6.0/dist/images/marker-icon-2x.png"
            className="leaflet-marker-icon leaflet-zoom-animated leaflet-interactive"
            alt="Центр"
            tabIndex={0}
          />
          <div className='modal-buttons'>
            {!!setFrom && (
              <Button
                className='modal-button'
                text={t(TRANSLATION.FROM)}
                onClick={() => handleFromClick()}
              />
            )}
            {!!setTo && (
              <Button
                className='modal-button'
                text={t(TRANSLATION.TO)}
                onClick={() => handleToClick()}
              />
            )}
            {!!(from?.latitude && from?.longitude) && !!(to?.latitude && to?.longitude) && (
              <Button
                className='modal-button'
                text={t(TRANSLATION.BUILD_THE_ROUTE)}
                onClick={handleRouteClick}
              />
            )}
            <Button
              className='modal-button'
              skipHandler={true}
              text={t(TRANSLATION.CLOSE)}
              onClick={() => setMapModal({ ...defaultMapModal })}
            />
          </div>
          <TileLayer
            attribution={getAttribution()}
            url={getTileServerUrl()}
          />
        </MapContainer>
      </div>
    </Overlay>
  )
}

export default connector(MapModal)

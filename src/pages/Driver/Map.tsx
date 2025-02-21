import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './styles.scss'
import { MapContainer, Marker, TileLayer, CircleMarker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import Fullscreen from 'react-leaflet-fullscreen-plugin'
import Button from '../../components/Button'
import { t, TRANSLATION } from '../../localization'
import { useInterval } from '../../tools/hooks'
import * as API from '../../API'
import ChatToggler from '../../components/Chat/Toggler'
import { EBookingDriverState, IOrder, IUser } from '../../types/types'
import { useCachedState } from '../../tools/hooks'
import images from '../../constants/images'
import { dateFormatTime, getAngle, getAttribution, getTileServerUrl } from '../../tools/utils'
import { EDriverTabs } from '.'
import SITE_CONSTANTS from '../../siteConstants'

interface IProps {
  user: IUser,
  activeOrders: IOrder[] | null,
  readyOrders: IOrder[] | null,
}

interface IContentProps extends IProps {
  locate: boolean,
  setZoom: (zoom: number) => void
  setPosition: (position: L.LatLngExpression) => void
}

const cachedDriverMapStateKey = 'cachedDriverMapState'

const DriverOrderMapMode: React.FC<IProps> = props => {
  const [position, setPosition] = useCachedState<L.LatLngExpression | undefined>(
    `${cachedDriverMapStateKey}.position`,
  )
  const [zoom, setZoom] = useCachedState<number>(
    `${cachedDriverMapStateKey}.zoom`,
    15,
  )

  return (
    <section className="driver-order-map-mode">
      <MapContainer
        center={position ?? SITE_CONSTANTS.DEFAULT_POSITION}
        zoom={zoom}
        className='map'
        // crs={SITE_CONSTANTS.MAP_MODE === MAP_MODE.YANDEX ? L.CRS.EPSG3395 : L.CRS.EPSG3857}
      >
        <DriverOrderMapModeContent
          locate={!position}
          {...{ setPosition, setZoom }}
          {...props}
        />
      </MapContainer>
    </section>
  )
}

const DriverOrderMapModeContent: React.FC<IContentProps> = ({
  user,
  activeOrders,
  readyOrders,
  locate,
  setPosition,
  setZoom,
}) => {
  const navigate = useNavigate()
  const map = useMap()

  const [lastPositions, setLastPositions] = useState<[number, number][]>([])
  const [arrowIcon, setArrowIcon] = useState(new L.DivIcon({
    iconAnchor: [20, 40],
    popupAnchor: [0, -35],
    iconSize: [40, 40],
    shadowSize: [29, 40],
    shadowAnchor: [7, 40],
    html: `<img src='${images.mapArrow}'>`,
  }))

  useEffect(() => {
    if (map) {
      map.once('locationfound', (e: L.LocationEvent) => {
        setLastPositions([[e.latlng.lat, e.latlng.lng]])
        if (locate)
          map.setView(e.latlng)
      })
      map.once('locationerror', (e: L.ErrorEvent) => console.error(e.message))
      map.locate({
        timeout: Infinity,
        enableHighAccuracy: true,
      })

      map.on(
        'click',
        (e: L.LeafletMouseEvent) => {
          if (!(e.originalEvent?.target as HTMLDivElement)?.classList?.contains('map')) return

          if (user && window.confirm(`${t(TRANSLATION.CONFIRM_LOCATION)}?`)) {
            API.notifyPosition({ latitude: e.latlng.lat, longitude: e.latlng.lng })
          }
        },
      )
      map.on(
        'zoomend', () => {
          setZoom(map.getZoom())
        },
      )
      map.on(
        'moveend', () => {
          setPosition(map.getCenter())
        },
      )
    }
  }, [map])

  useInterval(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLastPositions(prev => {
          if (prev.length) {
            let newPositions = [
              ...prev.reverse().slice(0, 2).reverse(),
              [coords.latitude, coords.longitude],
            ]
            const p1 = newPositions[newPositions.length - 2]
            const p2 = newPositions[newPositions.length - 1]
            const angle = getAngle(
              {
                latitude: p1[0],
                longitude: p1[1],
              }, {
              latitude: p2[0],
              longitude: p2[1],
            },
            )
            setArrowIcon(new L.DivIcon({
              iconSize: [40, 40],
              html: `
                <img
                  style="transform: rotate(${angle}deg)"
                  src='${images.mapArrow}'/>
              `,
            }))
            return newPositions as typeof prev
          }
          return [[coords.latitude, coords.longitude]] as typeof prev
        })
      },
      error => console.error(error),
      { enableHighAccuracy: true },
    )
  }, 2000)

  const performingOrder = activeOrders
    ?.find(item => ([
      EBookingDriverState.Performer, EBookingDriverState.Arrived
    ] as any[]).includes(
      item.drivers?.find(item => item.u_id === user?.u_id)?.c_state)
    )

  const currentOrder = activeOrders
    ?.find(item =>
      item.drivers?.find(item => item.u_id === user?.u_id)?.c_state === EBookingDriverState.Started,
    )

  const onCompleteOrderClick = () => {
    if (!currentOrder) return

    API.setOrderState(currentOrder.b_id, EBookingDriverState.Finished)
    navigate(`/driver-order/${currentOrder.b_id}`)
  }

  return (
    <>
      <TileLayer
        attribution={getAttribution()}
        url={getTileServerUrl()}
      />
      {
        lastPositions.length &&
        lastPositions.map((item, index) => index === lastPositions.length - 1 ?
          <Marker position={item} icon={arrowIcon} key={index} /> :
          null,
        )
      }
      {
        !!lastPositions.length &&
        <Polyline positions={lastPositions} />
      }
      {
        [
          ...(readyOrders || []),
          ...(performingOrder ? [performingOrder] : []),
        ]
          .filter(item => item.b_start_latitude && item.b_start_longitude)
          .map(item => {
            const angle = getAngle(
              {
                latitude: item.b_start_latitude,
                longitude: item.b_start_longitude,
              }, {
              latitude: item.b_destination_latitude,
              longitude: item.b_destination_longitude,
            },
            )

            return (
              <Marker
                position={[item.b_start_latitude, item.b_start_longitude] as L.LatLngExpression}
                icon={new L.DivIcon({
                  iconAnchor: [20, 40],
                  popupAnchor: [0, -35],
                  iconSize: [50, 50],
                  shadowSize: [29, 40],
                  shadowAnchor: [7, 40],
                  html: `<div class='order-marker'>
                      <div class='order-marker-hint'>
                        <div class='row-info'>
                          ${item.b_destination_address}
                        </div>
                         <div class='row-info'>
                          <div>${item.b_start_datetime.format(dateFormatTime)}</div>
                          <div class='competitors-num'>${item.drivers?.length || 0}</div>
                        </div>
                        <div class='row-info'>
                          <div class='price'>${item.b_price_estimate || 0}</div>
                          <div class='tips'>${item.b_tips || 0}</div>
                          <img
                            src='${images.mapMarkerProfit}'
                          />
                          <div class='order-profit'>${item.b_passengers_count || 0}</div>
                        </div>
                      </div>
                      <img
                        src='${
                          item === performingOrder ? images.mapOrderPerforming :
                          item.b_voting ? images.mapOrderVoting :
                          images.mapOrderWating
                        }'
                      >
                    </div>`,
                })}
                eventHandlers={{
                  click: () => navigate(`/driver-order/${item.b_id}`),
                }}
                key={item.b_id}
              />
            )
          })
      }
      <Fullscreen
        position="topleft"
      />
      <button
        className='no-coords-orders'
        onClick={() => navigate(`?tab=${EDriverTabs.Detailed}`)}
      >
        {
          (
            !!readyOrders && readyOrders
              .filter(item => !item.b_start_latitude || !item.b_start_longitude)
              .length
          ) || 0
        }
      </button>
      {
        currentOrder && (
          <Button
            text={t(TRANSLATION.CLOSE_DRIVE)}
            className="finish-drive-button"
            onClick={onCompleteOrderClick}
          />
        )
      }
      {
        !!activeOrders?.length && (
          <div
            style={{
              zIndex: 400,
              position: 'absolute',
              left: '70px',
              right: '70px',
            }}
          >
            {
              activeOrders.map(order => (
                <ChatToggler
                  anotherUserID={order.u_id}
                  orderID={order.b_id}
                  key={order.b_id}
                />
              ))
            }
          </div>
        )
      }
    </>
  )
}

export default DriverOrderMapMode
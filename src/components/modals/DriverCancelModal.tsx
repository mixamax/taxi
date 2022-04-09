import React from 'react'
import { connect, ConnectedProps } from 'react-redux'
import Button from '../Button'
import history from '../../tools/history'
import './styles.scss'
import * as API from '../../API'
import { t, TRANSLATION } from '../../localization'
import { modalsActionCreators, modalsSelectors } from '../../state/modals'
import { matchPath, useLocation } from 'react-router-dom'
import { IRootState } from '../../state'
import Overlay from './Overlay'

const mapStateToProps = (state: IRootState) => ({
  isOpen: modalsSelectors.isDriverCancelModalOpen(state),
})

const mapDispatchToProps = {
  setDriverCancelModal: modalsActionCreators.setDriverCancelModal,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {
}

const CancelDriverOrderModal: React.FC<IProps> = ({
  isOpen,
  setDriverCancelModal,
}) => {
  const location = useLocation()
  const id = matchPath<{id: string}>(location.pathname, {
    path: '/driver-order/:id',
  })?.params.id

  const onCancel = () => {
    if (id) {
      API.cancelDrive(id)
      history.push('/driver-order')
    }
    setDriverCancelModal(false)
  }

  return (
    <Overlay
      isOpen={isOpen}
      onClick={() => setDriverCancelModal(false)}
    >
      <div
        className="modal your-order-modal"
      >
        <form>
          <fieldset>
            <legend>
              {t(TRANSLATION.CANCEL_ORDER)}
            </legend>
            <div className="status">
              <span>{t(TRANSLATION.CANCEL_ORDER_CONFIRMATION)}</span>
              <Button
                text={t(TRANSLATION.OK)}
                className="ok-btn"
                onClick={onCancel}
              />
            </div>
          </fieldset>
        </form>
      </div>
    </Overlay>
  )
}

export default connector(CancelDriverOrderModal)

import React, { useEffect, useState } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import Button from '../../Button'
import '../styles.scss'
import * as API from '../../../API'
import { t, TRANSLATION } from '../../../localization'
import SITE_CONSTANTS from '../../../siteConstants'
import { IRootState } from '../../../state'
import { clientOrderSelectors } from '../../../state/clientOrder'
import { ordersSelectors } from '../../../state/orders'
import moment from 'moment'
import { modalsActionCreators, modalsSelectors } from '../../../state/modals'
import { useInterval } from '../../../tools/hooks'
import images from '../../../constants/images'
import Overlay from '../Overlay'
import { EColorTypes } from '../../../types/types'
import { userSelectors } from '../../../state/user'
import Input from '../../Input'
import { defaultWACodeModal } from '../../../state/modals/reducer'

const mapStateToProps = (state: IRootState) => ({
  payload: modalsSelectors.isWACodeModalOpen(state),
  user: userSelectors.user(state),
})

const mapDispatchToProps = {
  setWACodeModal: modalsActionCreators.setWACodeModal,
  setCancelModal: modalsActionCreators.setCancelModal,

}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {
}

const WACodeModal: React.FC<IProps> = ({
  payload,
  setWACodeModal,
  setCancelModal,
}) => {

  const [code, setCode] = useState('')

  return (
    <Overlay
      isOpen={payload.isOpen}
      onClick={() => setWACodeModal({ ...defaultWACodeModal })}
    >
      <div
        className="modal whatsapp-modal"
      >
        <form>
          <fieldset>
            <div className="code-block">
              <p>Message with code sent to you. Check your Whatsapp.</p>
              <Input
                // inputProps={{
                //   ...formRegister('password'),
                //   type: isPasswordShows ? 'text' : 'password',
                //   placeholder: t(TRANSLATION.PASSWORD),
                // }}
                onChange={(e) => {
                  setCode(e)
                }}
                label={'Write your code here'}
              />

              <Button
                type={'button'}
                skipHandler={true}
                text={'Login'}
                className="whatsapp-modal-btn"
                onClick={() => {
                  let data = payload.data
                  data.password = code
                  payload.login(data)
                  setWACodeModal({ ...defaultWACodeModal })
                }}
              />
            </div>
          </fieldset>
        </form>
      </div>
    </Overlay>
  )
}

export default connector(WACodeModal)


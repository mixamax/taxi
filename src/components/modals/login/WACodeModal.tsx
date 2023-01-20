import React from 'react'
import { connect, ConnectedProps } from 'react-redux'
import Button from '../../Button'
import '../styles.scss'
import { IRootState } from '../../../state'
import { modalsActionCreators, modalsSelectors } from '../../../state/modals'
import Overlay from '../Overlay'
import { userSelectors } from '../../../state/user'
import Input from '../../Input'
import { defaultWACodeModal } from '../../../state/modals/reducer'
import * as yup from 'yup'
import { useForm, useWatch } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { t, TRANSLATION } from '../../../localization'


interface IFormValues {
  code: number,
}

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
}) => {

  const schema = yup.object({
    code: yup.number().required(),
  })


  const {
    register: formRegister,
    handleSubmit,
    formState: { errors, isDirty },
    control,
  } = useForm<IFormValues>({
    criteriaMode: 'all',
    mode: 'all',
    resolver: yupResolver(schema),
  })

  const onSubmit = (formData : IFormValues) => {
    let data = payload.data
    data.password = formData.code
    payload.login(data)
    setWACodeModal({ ...defaultWACodeModal })
  }

  return (
    <Overlay
      isOpen={payload.isOpen}
      onClick={() => setWACodeModal({ ...defaultWACodeModal })}
    >
      <div
        className="modal whatsapp-modal"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <fieldset>
            <div className="code-block">
              <p>{t(TRANSLATION.CODEINFO)}</p>
              <Input
                // inputProps={{
                //   ...formRegister('password'),
                //   type: isPasswordShows ? 'text' : 'password',
                //   placeholder: t(TRANSLATION.PASSWORD),
                // }}
                error={errors.code?.message ? t(TRANSLATION.CODEERROR) : ''}
                inputProps={{
                  ...formRegister('code'),
                }}
                label={t(TRANSLATION.CODEWRITE)}
              />

              <Button
                type={'submit'}
                skipHandler={true}
                disabled={!!Object.values(errors).length}
                text={t(TRANSLATION.SIGN_IN)}
                className="whatsapp-modal-btn"
              />
            </div>
          </fieldset>
        </form>
      </div>
    </Overlay>
  )
}

export default connector(WACodeModal)


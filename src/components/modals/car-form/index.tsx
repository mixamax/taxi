import { yupResolver } from '@hookform/resolvers/yup'
import React from 'react'
import { useForm } from 'react-hook-form'
import { connect, ConnectedProps } from 'react-redux'
import { IRootState } from '../../../state'
import { modalsActionCreators, modalsSelectors } from '../../../state/modals'
import { userSelectors } from '../../../state/user'
import Alert from '../../Alert/Alert'
import Button from '../../Button'
import Input from '../../Input'
import Overlay from '../Overlay'

// const mapStateToProps = (state: IRootState) => ({
//   isOpen: modalsSelectors.isLoginModalOpen(state),
//   user: userSelectors.user(state),
//   status: userSelectors.status(state),
//   tab: userSelectors.tab(state),
//   message: userSelectors.message(state),
// })

// const mapDispatchToProps = {
//   setLoginModal: modalsActionCreators.setLoginModal,
// }

// const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps {
}

interface IFormValues {
  car_name: string
}

const CarForm: React.FC<IProps> = () => {
  const {
    register: formRegister,
    handleSubmit,
    formState: { errors, isDirty },
    control,
    trigger,
  } = useForm<IFormValues>({
    criteriaMode: 'all',
    mode: 'all',
  })

  const onSubmit = (data: IFormValues) => {

  }

  return (
    <Overlay isOpen={true} onClick={() => {}}>
      <form className="" onSubmit={handleSubmit(onSubmit)}>
        <div className="sign-in-subform__title">Sign in</div>
        <div className="sign-in-subform__inputs">
          <Input label="Email" />
          <Input
            label="Name"
            inputProps={{
              ...formRegister('car_name'),
              placeholder: 'Test',
            }}
          />
        </div>
      </form>
    </Overlay>
  )
}

export default CarForm

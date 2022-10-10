import React, { useState, useEffect } from 'react'
import Input from '../../Input'
import { t, TRANSLATION } from '../../../localization'
import Checkbox from '../../Checkbox'
import { useForm, useWatch } from 'react-hook-form'
import Button from '../../Button'
import { connect, ConnectedProps } from 'react-redux'
import images from '../../../constants/images'
import { IRootState } from '../../../state'
import { EStatuses } from '../../../types/types'
import {
  userSelectors,
  userActionCreators,
} from '../../../state/user'
import { ERegistrationType, LOGIN_TABS_IDS } from '../../../state/user/constants'
import { emailRegex, phoneRegex } from '../../../tools/utils'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'

const mapStateToProps = (state: IRootState) => ({
  user: userSelectors.user(state),
  status: userSelectors.status(state),
  tab: userSelectors.tab(state),
  message: userSelectors.message(state),
})

const mapDispatchToProps = {
  login: userActionCreators.login,
  logout: userActionCreators.logout,
  remindPassword: userActionCreators.remindPassword,
  setStatus: userActionCreators.setStatus,
  setMessage: userActionCreators.setMessage,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IFormValues {
  login: string,
  password: string,
  type: ERegistrationType
}

interface IProps extends ConnectedProps<typeof connector> {
  isOpen: boolean,
}

const LoginForm: React.FC<IProps> = ({
  user,
  status,
  tab,
  message,
  isOpen,
  login,
  logout,
  remindPassword,
  setMessage,
  setStatus,
}) => {
  const [isPasswordShows, setIsPasswordShows] = useState(false)

  const schema = yup.object({
    type: yup.string().required(),
    login: yup.string().required().when('type', {
      is: (type: ERegistrationType) => type === ERegistrationType.Email,
      then: yup.string().required().matches(emailRegex, t(TRANSLATION.EMAIL_ERROR)),
      otherwise: yup.string().required().matches(phoneRegex, t(TRANSLATION.PHONE_PATTERN_ERROR)),
    }),
    password: yup.string().required(t(TRANSLATION.REQUIRED_FIELD)).min(4).trim(),
  })

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors, isDirty },
    control,
    trigger,
  } = useForm<IFormValues>({
    criteriaMode: 'all',
    mode: 'all',
    defaultValues: {
      login: user?.u_email || '',
      type: ERegistrationType.Email,
    },
    resolver: yupResolver(schema),
  })
  const { login: formLogin, type } = useWatch<IFormValues>({ control })

  useEffect(() => {
    if (!isOpen) {
      setStatus(EStatuses.Default)
      setMessage('')
    }
  }, [isOpen])

  useEffect(() => {
    isDirty && trigger()
  }, [type])

  useEffect(() => {
    if (status === EStatuses.Fail) {
      toast.error('Упс, что то пошло не так')
    } else if (status === EStatuses.Success) {
      toast.success('Успешно регистрирован, письмо отправлено на почту', {
        position: 'top-center',
      })
    }
  }, [status])
  if (tab !== LOGIN_TABS_IDS[0]) return null

  const onSubmit = (data: IFormValues) => {
    if (user) {
      logout()
    } else {
      login(data)
    }
  }

  return <form className="sign-in-subform" onSubmit={handleSubmit(onSubmit)}>
    <Input
      inputProps={{
        ...formRegister('login'),
        placeholder: type === ERegistrationType.Phone ? t(TRANSLATION.PHONE) : t(TRANSLATION.EMAIL),
      }}
      label={t(TRANSLATION.LOGIN)}
      error={errors.login?.message}
      key={type}
    />
    <Input
      inputProps={{
        ...formRegister('password', { required: !user ? t(TRANSLATION.REQUIRED_FIELD) : false }),
        type: isPasswordShows ? 'text' : 'password',
        placeholder: t(TRANSLATION.PASSWORD),
      }}
      label={t(TRANSLATION.PASSWORD)}
      error={errors.password?.message}
      buttons={[
        {
          src: isPasswordShows ? images.closedEye : images.openedEye,
          onClick: () => setIsPasswordShows(prev => !prev),
        },
        {
          ...(!user ?
            {
              className: 'restore-password-block__button',
              onClick: () => formLogin && remindPassword(formLogin),
              disabled: !formLogin || !!errors?.login,
              text: t(TRANSLATION.RESTORE_PASSWORD),
              skipHandler: true,
            } :
            {}
          ),
        },
      ].filter(item => Object.values(item).length)}
    />

    <Checkbox
      {...formRegister('type')}
      type="radio"
      label={t(TRANSLATION.PHONE)}
      value={ERegistrationType.Phone}
      id="phone"
    />
    <Checkbox
      {...formRegister('type')}
      type="radio"
      label={t(TRANSLATION.EMAIL)}
      value={ERegistrationType.Email}
      id="email"
    />

    <Button
      type="submit"
      text={!!user ? t(TRANSLATION.LOGOUT) : t(TRANSLATION.SIGN_IN)}
      className="login-modal_login-btn"
      skipHandler={true}
      disabled={!!Object.values(errors).length}
      status={status}
    />
  </form>
}

export default connector(LoginForm)
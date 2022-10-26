import React, { useEffect, useState } from 'react'
import Input from '../../Input'
import { t, TRANSLATION } from '../../../localization'
import Checkbox from '../../Checkbox'
import { useForm, useWatch } from 'react-hook-form'
import Button from '../../Button'
import { connect, ConnectedProps } from 'react-redux'
import images from '../../../constants/images'
import { IRootState } from '../../../state'
import { EStatuses, EUserRoles } from '../../../types/types'
import { userActionCreators, userSelectors } from '../../../state/user'
import { ERegistrationType, LOGIN_TABS_IDS } from '../../../state/user/constants'
import { emailRegex, phoneRegex } from '../../../tools/utils'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Alert from '../../Alert/Alert'
import { Intent } from '../../Alert'
import { useVisibility } from '../../../tools/hooks'
import { IResolveParams, LoginSocialGoogle } from 'reactjs-social-login'
import { GoogleLoginButton } from 'react-social-login-buttons'
import { useLocation } from 'react-router-dom'

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
  register: userActionCreators.register,
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
  register,
  login,
  logout,
  remindPassword,
  setMessage,
  setStatus,
}) => {
  const [isPasswordShows, setIsPasswordShows] = useState(false)
  const [isVisible, toggleVisibility] = useVisibility(false)
  const location = useLocation()
  const googleClientId = '936989532884-lfsquh1dkbstfoo56igklk5fds9rnv5q.apps.googleusercontent.com'

  const role = !location.pathname.includes('/driver-order') ?
    EUserRoles.Client :
    EUserRoles.Driver

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
    if (status === EStatuses.Fail || status === EStatuses.Success) {
      toggleVisibility()
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

    {
      isVisible &&
            <div className="alert-container">
              <Alert
                intent={status === EStatuses.Fail ? Intent.ERROR : Intent.SUCCESS}
                message={status === EStatuses.Fail ? t(TRANSLATION.LOGIN_FAIL) : t(TRANSLATION.LOGIN_SUCCESS)}
                onClose={toggleVisibility}
              />
            </div>
    }

    {Number(role) !== EUserRoles.Driver && (
      <LoginSocialGoogle
        client_id={googleClientId}
        onLoginStart={() => {}}
        redirect_uri={''}
        scope="openid profile email"
        discoveryDocs="claims_supported"
        access_type="offline"
        onResolve={({ provider, data }: IResolveParams) => {
          const obj = {
            u_name: data?.name,
            u_email: data?.email,
            type: ERegistrationType.Email,
          }
        }}
        onReject={err => {
          console.log(err)
        }}
      >
        <GoogleLoginButton />
      </LoginSocialGoogle>
    )}

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
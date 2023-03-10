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
import { GoogleLoginButton } from 'react-social-login-buttons'
import { useLocation } from 'react-router-dom'
import { modalsActionCreators,  modalsSelectors } from '../../../state/modals'


const mapStateToProps = (state: IRootState) => ({
  user: userSelectors.user(state),
  status: userSelectors.status(state),
  tab: userSelectors.tab(state),
  message: userSelectors.message(state),
  isWAOpen: modalsSelectors.isWACodeModalOpen,
})

const mapDispatchToProps = {
  login: userActionCreators.login,
  setLoginModal: modalsActionCreators.setLoginModal,
  googleLogin: userActionCreators.googleLogin,
  logout: userActionCreators.logout,
  remindPassword: userActionCreators.remindPassword,
  setStatus: userActionCreators.setStatus,
  setMessage: userActionCreators.setMessage,
  register: userActionCreators.register,
  setWAOpen: modalsActionCreators.setWACodeModal,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IFormValues {
    login: string | undefined,
    password: string | undefined,
    type: ERegistrationType
}

interface IProps extends ConnectedProps<typeof connector> {
    isOpen: boolean,
}


const LoginForm: React.FC<IProps> = ({
  user,
  status,
  tab,
  googleLogin,
  message,
  isOpen,
  register,
  setWAOpen,
  login,
  logout,
  remindPassword,
  setMessage,
  setStatus,
  setLoginModal,
}) => {
  const [isPasswordShows, setIsPasswordShows] = useState(false)
  const [dataToLogin, setDataToLogin] = useState({})
  const [isVisible, toggleVisibility] = useVisibility(false)
  const [isPasswordVisible, togglePasswordVisibility] = useVisibility(true)
  const location = useLocation()
  const googleClientId = '973943716904-b33r11ijgi08m5etsg5ndv409shh1tjl.apps.googleusercontent.com'

  const role = !location.pathname.includes('/driver-order') ?
    EUserRoles.Client :
    EUserRoles.Driver

  const schema = yup.object({
    type: yup.string().required(),
    login: yup.string().required().when('type', {
      is: (type: ERegistrationType) => (type === ERegistrationType.Email),
      then: yup.string().required().matches(emailRegex, t(TRANSLATION.EMAIL_ERROR)),
      otherwise: yup.string().required().matches(phoneRegex, t(TRANSLATION.PHONE_PATTERN_ERROR)),
    }),
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
    resolver: yupResolver(user ? yup.object() : schema),
  })
  const { login: formLogin, type } = useWatch<IFormValues>({ control })

  useEffect(() => {
    if (!isOpen) {
      setStatus(EStatuses.Default)
      setMessage('')
    }
    if (isOpen && isVisible) {
      toggleVisibility()
    }
  }, [isOpen])

  useEffect(() => {
    let auth_hash = getParamFromURL('auth_hash')
    if (auth_hash) {
      if (typeof auth_hash === 'string') {
        googleLogin({
          data: null,
          auth_hash: decodeURIComponent(auth_hash),
        })
      }
    } else {
      let u_email = getParamFromURL('u_email')
      let u_name = getParamFromURL('u_name')
      if (u_email && u_name) {
        if (typeof u_email === 'string' && typeof u_name === 'string') {
          googleLogin({
            data: {
              u_name: decodeURIComponent(u_name).replaceAll('+', ' '),
              u_phone: '',
              u_email: decodeURIComponent(u_email),
              type: ERegistrationType.Email,
              u_role: EUserRoles.Client,
              ref_code: '',
              u_details: {},
              st: '1',
            },
            auth_hash: null,
          })
        }
      }
    }
  }, [])

  useEffect(() => {
    isDirty && trigger()
  }, [type])

  useEffect(() => {
    if (type === ERegistrationType.Whatsapp && isPasswordVisible) {
      togglePasswordVisibility()
    } else if (!isPasswordVisible) {
      togglePasswordVisibility()
    }
  }, [type])


  useEffect(() => {
    if (((status === EStatuses.Fail || status === EStatuses.Success && user)) && type !== ERegistrationType.Whatsapp && !isVisible) {
      toggleVisibility()
    } else if (status === EStatuses.Whatsapp) {
      setLoginModal(false)
      setWAOpen({
        isOpen: true,
        login: login,
        data: dataToLogin,
      })
    }
  }, [status])

  if (tab !== LOGIN_TABS_IDS[0]) return null

  const onSubmit = (data: IFormValues) => {
    if (isVisible) toggleVisibility()
    setDataToLogin(data)
    if (user) {
      logout()
    } else {
      if (data) {
        login(data)
      }
    }
  }

  const getParamFromURL = (param: string) => {
    let results = new RegExp('[\?&]' + param + '=([^&#]*)').exec(window.location.href)
    if (results == null) {
      return null
    } else {
      return decodeURI(results[1]) || 0
    }
  }

  return <form className="sign-in-subform" onSubmit={handleSubmit(onSubmit)}>
    <Input
      inputProps={{
        ...formRegister('login'),
        placeholder: type === ERegistrationType.Phone || type === ERegistrationType.Whatsapp ? t(TRANSLATION.PHONE) : t(TRANSLATION.EMAIL),
      }}
      label={t(TRANSLATION.LOGIN)}
      error={errors.login?.message}
      key={type}
    />
    {isPasswordVisible &&
          <Input
            inputProps={{
              ...formRegister('password'),
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
                    type: 'button',
                    onClick: () => formLogin && confirm(t(TRANSLATION.PASSWORD_RESET_MESSAGE)) && remindPassword(formLogin),
                    disabled: !formLogin || !!errors?.login,
                    text: t(TRANSLATION.RESTORE_PASSWORD),
                    skipHandler: true,
                  } :
                  {}
                ),
              },
            ].filter(item => Object.values(item).length)}
          />
    }

    <Checkbox
      {...formRegister('type')}
      type="radio"
      label={t(TRANSLATION.PHONE)}
      value={ERegistrationType.Phone}
      id="phone"
      disabled
    />
    <Checkbox
      {...formRegister('type')}
      type="radio"
      label={t(TRANSLATION.EMAIL)}
      value={ERegistrationType.Email}
      id="email"
    />
    <Checkbox
      {...formRegister('type')}
      type="radio"
      label={'Whatsapp'}
      value={ERegistrationType.Whatsapp}
      id="whatsapp"
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
      // <LoginSocialGoogle
      //   client_id={googleClientId}
      //   onLoginStart={() => {}}
      //   redirect_uri={''}
      //   scope="profile email"
      //   access_type="online"
      //   onResolve={(data) => {
      //     console.log(data)
      //   // const obj = {
      //   //   u_name: data?.name,
      //   //   u_phone: '',
      //   //   u_email: 'moj14frffefff@gmail.com',          // TODO: заменить на data?.email
      //   //   type: ERegistrationType.Email,
      //   //   u_role: EUserRoles.Client,
      //   //   ref_code: '',
      //   //   u_details: {},
      //   //   st: '1',
      //   // }
      //   //googleLogin(obj)
      //   }}
      //   onReject={err => {
      //     console.log(err)
      //   }}
      // >
      <a href={`https://accounts.google.com/o/oauth2/v2/auth?response_type=code&access_type=offline&client_id=${googleClientId}&redirect_uri=https%3A%2F%2Fibronevik.ru%2Ftaxi%2Fc%2F0%2Fgoogle%2F&state&scope=email%20profile&prompt=select_account`}>
        <GoogleLoginButton />
      </a>

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
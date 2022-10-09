import React, { useState } from 'react'
import Input, { EInputTypes } from '../../Input'
import { t, TRANSLATION } from '../../../localization'
import Checkbox from '../../Checkbox'
import { emailRegex, getPhoneError } from '../../../tools/utils'
import { useForm, useWatch } from 'react-hook-form'
import Button from '../../Button'
import { IRootState } from '../../../state'
import {
  userSelectors,
  userActionCreators,
} from '../../../state/user'
import { ERegistrationType, LOGIN_TABS_IDS } from '../../../state/user/constants'
import { connect, ConnectedProps } from 'react-redux'
import cn from 'classnames'
import { EUserRoles, EWorkTypes } from '../../../types/types'
import { useLocation } from 'react-router-dom'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from "yup"

const mapStateToProps = (state: IRootState) => {
  return {
    user: userSelectors.user(state),
    status: userSelectors.status(state),
    tab: userSelectors.tab(state),
    message: userSelectors.message(state),
  }
}

const mapDispatchToProps = {
  register: userActionCreators.register,
  setStatus: userActionCreators.setStatus,
  setMessage: userActionCreators.setMessage,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IFormValues {
  u_name: string
  u_phone: string
  u_email: string
  ref_code: string
  type: ERegistrationType
  u_role: EUserRoles
  city?: string
  street?: string
  state?: string
  zip?: string
  card?: string
}

interface IProps extends ConnectedProps<typeof connector> {
  isOpen: boolean,
}

const RegisterForm: React.FC<IProps> = ({
  status,
  tab,
  message,
  register,
}) => {
  const [showRefCode, setShowRefCode] = useState(false)
  const [workType, setWorkType] = useState<EWorkTypes | null>(null)
  const location = useLocation()

  const schema = yup.object({
    type: yup.string().required(),
    u_name: yup.string().required(t(TRANSLATION.REQUIRED_FIELD)).trim(),
    u_email: yup.string().email(t(TRANSLATION.EMAIL_ERROR)).when('type', {
      is: (type: ERegistrationType) => type === ERegistrationType.Email,
      then: yup.string().required(t(TRANSLATION.REQUIRED_FIELD)).trim(),
    }).trim(),
    u_phone: yup.string().when('type', {
      is: (type: ERegistrationType) => type === ERegistrationType.Phone,
      then: yup.string().required(t(TRANSLATION.REQUIRED_FIELD)).trim(),
    }),
    street: yup.string().trim(),
    city: yup.string().trim(),
    state: yup.string().trim(),
    zip: yup.string().min(5).trim(),
    card: yup.string().min(16).max(16).trim(),
  })

  const { register: formRegister, handleSubmit, formState: { errors, isValid }, control } = useForm<IFormValues>({
    criteriaMode: 'all',
    mode: 'all',
    defaultValues: {
      type: ERegistrationType.Email,
      u_role: !location.pathname.includes('/driver-order') ? EUserRoles.Client : EUserRoles.Driver,
    },
    resolver: yupResolver(schema),
  })

  const { type, u_phone, u_role } = useWatch<IFormValues>({ control })

  if (tab !== LOGIN_TABS_IDS[1]) return null

  const onSubmit = (data: IFormValues) => {
    if (getPhoneError(u_phone, type === ERegistrationType.Phone)) return
    register({
      u_name: data.u_name,
      u_phone: data.u_phone,
      u_email: data.u_email,
      u_role: data.u_role || EUserRoles.Client,
      ref_code: data.ref_code || undefined,
      u_details: {
        city: data.city,
        street: data.street,
        state: data.state,
        zip: data.zip,
        card: data.card,
      },
    })
  }

  return <form className="sign-up-subform" onSubmit={handleSubmit(onSubmit)}>
    {
      u_role === EUserRoles.Driver && workType === null ?
        (
          <>
            <label
              className="input__label"
            >
              {t(TRANSLATION.YOUR_WORK_TYPE)}:
            </label>
            <button className="work-type__button" onClick={() => setWorkType(EWorkTypes.Self)}>
              {t(TRANSLATION.SELF_EMPLOYED)}
            </button>
            <button className="work-type__button" onClick={() => setWorkType(EWorkTypes.Company)}>
              {t(TRANSLATION.COMPANY)}
            </button>
          </>
        ) :
        (
          <>
            <Input
              inputProps={{
                ...formRegister('u_name', { required: t(TRANSLATION.REQUIRED_FIELD) }),
              }}
              label={t(workType === EWorkTypes.Company ? TRANSLATION.COMPANY_NAME : TRANSLATION.NAME)}
              error={errors.u_name?.message}
            />
            <Input
              inputProps={{
                ...formRegister('u_phone'),
              }}
              label={t(TRANSLATION.PHONE)}
              inputType={EInputTypes.MaskedPhone}
              error={getPhoneError(u_phone, type === ERegistrationType.Phone)}
            />
            <Input
              inputProps={{
                ...formRegister(
                  'u_email'
                ),
              }}
              label={t(TRANSLATION.EMAIL)}
              error={errors.u_email?.message}
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

            <Input
              inputProps={{
                ...formRegister('street'),
              }}
              label={t(TRANSLATION.STREET_ADDRESS)}
              error={errors.street?.message}
              fieldWrapperClassName="street"
            />
            <Input
              inputProps={{
                ...formRegister('city'),
              }}
              label={t(TRANSLATION.CITY)}
              error={errors.city?.message}
            />
            <Input
              inputProps={{
                ...formRegister('state'),
              }}
              label={t(TRANSLATION.STATE)}
              error={errors.state?.message}
            />
            <Input
              inputProps={{
                ...formRegister('zip'),
              }}
              label={t(TRANSLATION.ZIP_CODE)}
              error={errors.zip?.message}
            />
            <Input
              inputProps={{
                ...formRegister('card', {
                  pattern: {
                    value: /^\d{16}$/,
                    message: t(TRANSLATION.CARD_NUMBER_PATTERN_ERROR),
                  },
                }),
                placeholder: 'ХХХХ-ХХХХ-ХХХХ-ХХХХ',
              }}
              label={t(TRANSLATION.CARD_NUMBER)}
              error={errors.card?.message}
            />
            {/* <Input
              inputProps={{
                ...formRegister('role'),
                disabled: true,
              }}
              inputType={EInputTypes.Select}
              options={[
                { label: t(TRANSLATION.CLIENT), value: EUserRoles.Client },
                { label: t(TRANSLATION.DRIVER), value: EUserRoles.Driver },
                { label: t(TRANSLATION.ADMINISTRATOR), value: EUserRoles.Administrator },
              ]}
            /> */}

            <Checkbox
              type="checkbox"
              name="ref_code_toggle"
              label={t(TRANSLATION.PROMO_CODE)}
              value={showRefCode ? 'checked' : ''}
              onChange={(e) => setShowRefCode(e.target.checked)}
              wrapperAdditionalClassName="ref-code__toggler"
            />

            <Input
              inputProps={{
                ...formRegister('ref_code'),
              }}
              fieldWrapperClassName={cn('ref-code__input', { 'ref-code__input--active': showRefCode })}
            />

            <Button
              type="submit"
              text={t(TRANSLATION.SIGNUP)}
              className="login-modal_login-btn"
              skipHandler={true}
              disabled={!isValid}
              label={message && t(message)}
              status={status}
            />
          </>
        )
    }
  </form>
}

export default connector(RegisterForm)
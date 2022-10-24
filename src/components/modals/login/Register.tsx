import React, { useEffect, useState } from 'react'
import Input, { EInputTypes } from '../../Input'
import { t, TRANSLATION } from '../../../localization'
import Checkbox from '../../Checkbox'
import { getPhoneError } from '../../../tools/utils'
import { useForm, useWatch } from 'react-hook-form'
import Button from '../../Button'
import { IRootState } from '../../../state'
import { userSelectors, userActionCreators } from '../../../state/user'
import {
  ERegistrationType,
  LOGIN_TABS_IDS,
} from '../../../state/user/constants'
import { connect, ConnectedProps } from 'react-redux'
import cn from 'classnames'
import { EStatuses, EUserRoles, EWorkTypes } from '../../../types/types'
import { useLocation } from 'react-router-dom'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Alert from '../../Alert/Alert'
import { Intent } from '../../Alert'
import { useVisibility } from '../../../tools/hooks'
import { ISelectOption } from '../../../types'

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
  u_name: string;
  u_phone: string;
  u_email: string;
  ref_code: string;
  type: ERegistrationType;
  u_role: EUserRoles;
  city?: string;
  street?: string;
  state?: string;
  zip?: string;
  card?: string;
  car_name: string
  car_model: string | null
  seats: string
  car_number: string
  car_color: string
  car_classes: string
}

interface IProps extends ConnectedProps<typeof connector> {
  isOpen: boolean;
}

const RegisterForm: React.FC<IProps> = ({ status, tab, register }) => {
  const [showRefCode, setShowRefCode] = useState(false)
  const [workType, setWorkType] = useState<EWorkTypes | null>(null)
  const location = useLocation()
  const [isVisible, toggleVisibility] = useVisibility(false)

  const [data, setData] = useState<{
    car_models: any
    car_colors: any
    car_classes: any
  } | null>(null)

  const schema = yup.object({
    type: yup.string().required(),
    u_name: yup.string().required(t(TRANSLATION.REQUIRED_FIELD)).trim(),
    u_email: yup
      .string()
      .email(t(TRANSLATION.EMAIL_ERROR))
      .when('type', {
        is: (type: ERegistrationType) => type === ERegistrationType.Email,
        then: yup.string().required(t(TRANSLATION.REQUIRED_FIELD)).trim(),
      })
      .trim(),
    u_phone: yup.string().when('type', {
      is: (type: ERegistrationType) => type === ERegistrationType.Phone,
      then: yup.string().required(t(TRANSLATION.REQUIRED_FIELD)).trim(),
    }),
    street: yup.string().trim(),
    city: yup.string().trim(),
    state: yup.string().trim(),
    zip: yup.string().trim(),
    card: yup.string().min(16).max(16).trim(),
  })

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors, isValid },
    control,
  } = useForm<IFormValues>({
    criteriaMode: 'all',
    mode: 'all',
    defaultValues: {
      type: ERegistrationType.Email,
      u_role: !location.pathname.includes('/driver-order') ?
        EUserRoles.Client :
        EUserRoles.Driver,
    },
    resolver: yupResolver(schema),
  })

  const { type, u_phone, u_role } = useWatch<IFormValues>({ control })

  useEffect(() => {
    if (status === EStatuses.Fail || status === EStatuses.Success) {
      toggleVisibility()
    }
  }, [status])

  useEffect(() => {
    let newData = (window as any).data

    if (newData && (data === null || data === undefined)) {
      setData({
        car_models: newData.car_models,
        car_colors: newData.car_colors,
        car_classes: newData.car_classes,
      })
    }
  }, [])

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

  const prepareOptions = (data: any, key: string) => {
    let options: ISelectOption[] = []

    if (!data) {
      return options
    }

    Object.keys(data).forEach((datum: any) => {
      options.push({
        value: datum,
        label: t(key[datum]),
      })
    })

    return options
  }

  const seatsOptions = () => {
    return [
      {
        label: '1',
        value: 1,
      },
      {
        label: '2',
        value: 2,
      },
      {
        label: '3',
        value: 3,
      },
      {
        label: '4',
        value: 4,
      },
    ]
  }

  return (
    <form className="sign-up-subform" onSubmit={handleSubmit(onSubmit)}>
      {u_role === EUserRoles.Driver && workType === null ?
        (
          <>
            <label className="input__label">
              {t(TRANSLATION.YOUR_WORK_TYPE)}:
            </label>
            <button
              className="work-type__button"
              onClick={() => setWorkType(EWorkTypes.Self)}
            >
              {t(TRANSLATION.SELF_EMPLOYED)}
            </button>
            <button
              className="work-type__button"
              onClick={() => setWorkType(EWorkTypes.Company)}
            >
              {t(TRANSLATION.COMPANY)}
            </button>
          </>
        ) :
        (<>
          {/* <Input
            inputProps={{
              ...formRegister('u_role'),
              disabled: false,
            }}
            label={'role'}
            inputType={EInputTypes.Select}
            options={[
              { label: t(TRANSLATION.CLIENT), value: EUserRoles.Client },
              { label: t(TRANSLATION.DRIVER), value: EUserRoles.Driver },
            ]}
          /> */}

          <Input
            inputProps={{
              ...formRegister('u_name', {
                required: t(TRANSLATION.REQUIRED_FIELD),
              }),
            }}
            label={t(
              workType === EWorkTypes.Company ?
                TRANSLATION.COMPANY_NAME :
                TRANSLATION.NAME,
            )}
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
              ...formRegister('u_email'),
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

          {Number(u_role) === EUserRoles.Driver && (
            <Input
              inputProps={{
                ...formRegister('street'),
              }}
              label={t(TRANSLATION.STREET_ADDRESS)}
              error={errors.street?.message}
              fieldWrapperClassName="street"
            />
          )}

          {Number(u_role) === EUserRoles.Driver && (
            <Input
              inputProps={{
                ...formRegister('city'),
              }}
              label={t(TRANSLATION.CITY)}
              error={errors.city?.message}
            />
          )}

          {Number(u_role) === EUserRoles.Driver && (
            <Input
              inputProps={{
                ...formRegister('state'),
              }}
              label={t(TRANSLATION.STATE)}
              error={errors.state?.message}
            />
          )}

          {Number(u_role) === EUserRoles.Driver && (
            <Input
              inputProps={{
                ...formRegister('zip'),
              }}
              label={t(TRANSLATION.ZIP_CODE)}
              error={errors.zip?.message}
            />
          )}

          {Number(u_role) === EUserRoles.Driver && (
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
          )}

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
            fieldWrapperClassName={cn('ref-code__input', {
              'ref-code__input--active': showRefCode,
            })}
          />

          {Number(u_role) === EUserRoles.Driver && (
            <Input
              label='Car models'
              options={prepareOptions(data?.car_models, TRANSLATION.CAR_MODELS)}
              inputProps={{
                ...formRegister('car_model'),
                placeholder: 'Mercedes-Benz',
              }}
              inputType={EInputTypes.Select}
            />
          )}

          {Number(u_role) === EUserRoles.Driver && (
            <Input
              label={t(TRANSLATION.SEATS)}
              inputProps={{
                ...formRegister('seats'),
                placeholder: '4',
                defaultValue: 4,
              }}
              inputType={EInputTypes.Select}
              options={seatsOptions()}
            />
          )}

          {Number(u_role) === EUserRoles.Driver && (
            <Input
              label={'Car number'}
              inputProps={{ ...formRegister('car_number') }}
            />
          )}

          {Number(u_role) === EUserRoles.Driver && (
            <Input
              label={'Car color'}
              inputProps={{ ...formRegister('car_color') }}
              inputType={EInputTypes.Select}
              options={prepareOptions(data?.car_colors, TRANSLATION.CAR_COLORS)}
            />
          )}

          {Number(u_role) === EUserRoles.Driver && (
            <Input
              label={'Car classes'}
              inputProps={{ ...formRegister('car_classes') }}
              inputType={EInputTypes.Select}
              options={prepareOptions(data?.car_classes, TRANSLATION.CAR_CLASSES)}
            />
          )}


          {isVisible && (
            <div className="alert-container">
              <Alert
                intent={
                  status === EStatuses.Fail ? Intent.ERROR : Intent.SUCCESS
                }
                message={
                  status === EStatuses.Fail ?
                    t(TRANSLATION.REGISTER_FAIL) :
                    t(TRANSLATION.REGISTER_SUCCESS)
                }
                onClose={toggleVisibility}
              />
            </div>
          )}

          <Button
            type="submit"
            text={t(TRANSLATION.SIGNUP)}
            className="login-modal_login-btn"
            skipHandler={true}
            disabled={!isValid}
            status={status}
          />
        </>
        )}
    </form>
  )
}

export default connector(RegisterForm)

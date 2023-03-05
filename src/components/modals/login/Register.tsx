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
import axios from 'axios'
import { WHATSAPP_BOT_KEY, WHATSAPP_BOT_URL } from '../../../config'
import { ISelectOption } from '../../../types'

const mapStateToProps = (state: IRootState) => {
  return {
    user: userSelectors.user(state),
    status: userSelectors.status(state),
    tab: userSelectors.tab(state),
    message: userSelectors.message(state),
    response: userSelectors.registerResponse(state),
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
  document_type?: string;
  passport?: any;
  doc1?: any
  doc2?: any
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

const RegisterForm: React.FC<IProps> = ({
  status,
  tab,
  register,
  response,
}) => {
  const [showRefCode, setShowRefCode] = useState(false)
  const [workType, setWorkType] = useState<EWorkTypes | null>(null)
  const location = useLocation()
  const [isRegistrationAlertVisible, toggleRegistrationAlertVisibility] = useVisibility(false)
  const [isWhatsappAlertVisible, toggleWhatsappAlertVisibility] = useVisibility(false)
  const [shouldSendToWhatsapp, setShouldSendToWhatsapp] = useState(false)
  const [fileName, setFileName] = useState('Choose file...')

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
    document_img: yup
      .mixed()
      // .required('You need to provide a file')
      .test('type', 'Only the following formats are accepted: .jpeg, .jpg, .png, ', (value) => {
        if(value && value[0]) {
          return (
            value[0].type === 'image/jpeg' ||
            value[0].type === 'image/png'
          )
        } else {
          return true
        }
      }),
  })

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors, isValid },
    control,
    setValue,
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

  let whatsappResponseMessage = ''

  useEffect(() => {
    if (status === EStatuses.Fail || status === EStatuses.Success) {
      toggleRegistrationAlertVisibility()
    }

    // if (status === EStatuses.Success && type === ERegistrationType.Phone && shouldSendToWhatsapp) {
    //   if (response) {
    //     axios.post(`${WHATSAPP_BOT_URL}/send-message`,
    //       {
    //         phone: u_phone,
    //         code: response.string,
    //       },
    //       {
    //         headers: {
    //           'x-api-key': WHATSAPP_BOT_KEY,
    //         },
    //       },
    //     ).then((response) => {
    //       console.log(response)
    //       whatsappResponseMessage = response.data
    //     }).catch((err) => {
    //       console.log(err)
    //       whatsappResponseMessage = err
    //     }).finally(() => {
    //       toggleRegistrationAlertVisibility()
    //       toggleWhatsappAlertVisibility()
    //     })
    //   }
    // }
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

  useEffect(() => {
    if (type !== ERegistrationType.Email) {
      setValue('u_email', '')
    }
    if (type !== ERegistrationType.Phone) {
      setValue('u_phone', '')
    }
  }, [type])

  if (tab !== LOGIN_TABS_IDS[1]) return null

  const onSubmit = (data: IFormValues) => {
    if (getPhoneError(u_phone, type === ERegistrationType.Phone)) return

    let upload: any[] = []
    if (data.passport) {
      upload.push({ name: 'passport', file: data.passport[0] })
    }
    if (data.doc1) {
      upload.push({ name: 'doc1', file: data.doc1[0] })
    }
    if (data.doc2) {
      upload.push({ name: 'doc2', file: data.doc2[0] })
    }
    
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
      u_car: {
        cm_id: data.car_model,
        seats: data.seats,
        registration_plate: data.car_number,
        color: data.car_color,
        photo: '',
        details: {},
        cc_id: data.car_classes,
      },
      uploads: upload
    })
  }

  const prepareOptions = (data: any, key: string) => {
    let options: ISelectOption[] = []

    if (!data) {
      return options
    }

    Object.keys(data).forEach((datum: any, index: number) => {
      if (key === TRANSLATION.CAR_CLASSES && index === 0) {
        return
      }

      options.push({
        value: datum,
        label: t(key[datum]),
      })
    })

    return options
  }

  const seatsOptions = () => {
    return Array(20).fill(0).map((_, i) => {
      let value = String(i + 1)

      return {
        value,
        label: value,
      }
    })
  }

  const isDriver = Number(u_role) === EUserRoles.Driver

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

        (<>{/* <Input
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
          inputType={EInputTypes.Default}
          error={getPhoneError(u_phone, type === ERegistrationType.Phone)}
        />

        {/*{type === ERegistrationType.Phone && (*/}
        {/*  <Checkbox*/}
        {/*    type="checkbox"*/}
        {/*    label={'Send to Whatsapp'}*/}
        {/*    id="shouldSendToWhatsapp"*/}
        {/*    disabled={type !== ERegistrationType.Phone}*/}
        {/*    wrapperAdditionalClassName="send_to_whatsapp_checkbox"*/}
        {/*    value={shouldSendToWhatsapp ? 'checked' : ''}*/}
        {/*    onChange={(e) => {*/}
        {/*      setShouldSendToWhatsapp(e.target.checked)*/}
        {/*    }}*/}
        {/*  />*/}
        {/*)}*/}

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

        {isDriver && (
          <Input
            inputProps={{
              ...formRegister('street'),
            }}
            label={t(TRANSLATION.STREET_ADDRESS)}
            error={errors.street?.message}
            fieldWrapperClassName="street"
          />
        )}

        {isDriver && (
          <Input
            inputProps={{
              ...formRegister('city'),
            }}
            label={t(TRANSLATION.CITY)}
            error={errors.city?.message}
          />
        )}

        {isDriver && (
          <Input
            inputProps={{
              ...formRegister('state'),
            }}
            label={t(TRANSLATION.STATE)}
            error={errors.state?.message}
          />
        )}

        {isDriver && (
          <Input
            inputProps={{
              ...formRegister('zip'),
            }}
            label={t(TRANSLATION.ZIP_CODE)}
            error={errors.zip?.message}
          />
        )}

        {isDriver && (
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

        {/* {isDriver && (
          <Input
            label='Document type'
            options={prepareOptions(data?.car_models, TRANSLATION.CAR_MODELS)} //TODO: изменить на типы документов
            inputProps={{
              ...formRegister('document_type'),
            }}
            inputType={EInputTypes.Select}
          />
        )} */}

        {isDriver && (
          <Input
            onChange={(e) => {
              if (!e) setValue('passport', null)
            }}
            label='Passport photo'
            fileName={fileName}
            inputProps={{
              ...formRegister('passport'),
              accept: 'image/png, image/jpeg, image/jpg',
            }}
            inputType={EInputTypes.File}
            error={errors.passport?.message}
          />
        )}

        {isDriver && (
          <Input
            onChange={(e) => {
              if (!e) setValue('doc1', null)
            }}
            label='Driver license'
            fileName={fileName}
            inputProps={{
              ...formRegister('doc1'),
              accept: 'image/png, image/jpeg, image/jpg',
            }}
            inputType={EInputTypes.File}
            error={errors.doc1?.message}
          />
        )}

        {isDriver && (
          <Input
            onChange={(e) => {
              if (!e) setValue('doc2', null)
            }}
            label='License'
            fileName={fileName}
            inputProps={{
              ...formRegister('doc2'),
              accept: 'image/png, image/jpeg, image/jpg',
            }}
            inputType={EInputTypes.File}
            error={errors.doc2?.message}
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

        {isDriver && (
          <Input
            label='Car models'
            options={prepareOptions(data?.car_models, TRANSLATION.CAR_MODELS)}
            inputProps={{
              ...formRegister('car_model'),
            }}
            inputType={EInputTypes.Select}
          />
        )}

        {isDriver && (
          <Input
            label={t(TRANSLATION.SEATS)}
            inputProps={{
              ...formRegister('seats'),
              defaultValue: 4,
            }}
            inputType={EInputTypes.Select}
            options={seatsOptions()}
          />
        )}

        {isDriver && (
          <Input
            label={'Car number'}
            inputProps={{ ...formRegister('car_number') }}
          />
        )}

        {isDriver && (
          <Input
            label={'Car color'}
            inputProps={{ ...formRegister('car_color') }}
            inputType={EInputTypes.Select}
            options={prepareOptions(data?.car_colors, TRANSLATION.CAR_COLORS)}
          />
        )}

        {isDriver && (
          <Input
            label={'Car classes'}
            inputProps={{ ...formRegister('car_classes') }}
            inputType={EInputTypes.Select}
            options={prepareOptions(data?.car_classes, TRANSLATION.CAR_CLASSES)}
          />
        )}


        {isRegistrationAlertVisible && (
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
              onClose={toggleRegistrationAlertVisibility}
            />
          </div>
        )}

        {isWhatsappAlertVisible && (
          <div className="alert-container">
            <Alert
              intent={Intent.INFO}
              message={whatsappResponseMessage}
              onClose={toggleWhatsappAlertVisibility}
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

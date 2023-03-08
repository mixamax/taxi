import React, { useCallback } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { connect, ConnectedProps } from 'react-redux'
import Button from '../Button'
import Input, { EInputTypes } from '../Input'
import { t, TRANSLATION } from '../../localization'
import { modalsActionCreators, modalsSelectors } from '../../state/modals'
import { editUser } from '../../API'
import images from '../../constants/images'
import './styles.scss'
import { IRootState } from '../../state'
import Overlay from './Overlay'
import { userSelectors, userActionCreators } from '../../state/user'
import { defaultProfileModal } from '../../state/modals/reducer'
import { EStatuses, EWorkTypes } from '../../types/types'
import { emailRegex, getPhoneError, getBase64 } from '../../tools/utils'
import { configSelectors } from '../../state/config'
import * as API from '../../API'

const mapStateToProps = (state: IRootState) => ({
  tokens: userSelectors.tokens(state),
  user: userSelectors.user(state),
  language: configSelectors.language(state),
  isOpen: modalsSelectors.isProfileModalOpen(state),
})

const mapDispatchToProps = {
  setProfileModal: modalsActionCreators.setProfileModal,
  setMessageModal: modalsActionCreators.setMessageModal,
  updateUser: userActionCreators.initUser
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IFormValues {
  name: string
  middleName?: string,
  surname?: string
  email: string
  phone: string
  street?: string
  city?: string
  state?: string
  zip?: string
  card?: string
}

interface IProps extends ConnectedProps<typeof connector> {
}

const CardDetailsModal: React.FC<IProps> = ({
  tokens,
  user,
  language,
  isOpen,
  setProfileModal,
  setMessageModal,
  updateUser,
}) => {
  const { register, getValues, formState: { errors, isValid, isDirty }, handleSubmit, control } = useForm<IFormValues>({
    criteriaMode: 'all',
    mode: 'onChange',
    defaultValues: {
      name: user?.u_name,
      middleName: user?.u_middle,
      surname: user?.u_family,
      email: user?.u_email,
      phone: user?.u_phone,
      state: user?.u_details?.state,
      city: user?.u_city && (window as any).data.cities && (window as any).data.cities[user?.u_city] ? (window as any).data.cities[user?.u_city][language.id] : '',
      zip: user?.u_details?.zip,
      card: user?.u_details?.card,
      street: user?.u_details?.street,
    },
  })

  const { phone, email } = useWatch<IFormValues>({ control })

  const onChangeAvatar = useCallback(e => {
    if (!user || !tokens) return
    const file = e.target.files[0]
    getBase64(file)
      .then((base64: any) => editUser({ u_photo: base64 }))
      .then(() => updateUser())
  }, [])

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    if (isValid) {
      const values = getValues()

      API.editUser({
        u_name: values.name,
        u_middle: values.middleName,
        u_family: values.surname,
        u_email: values.email,
        u_phone: values.phone,
        u_city: values.city,
        u_details: {
          street: values.street,
          state: values.state,
          zip: values.zip,
          card: values.card,
        },
      })
        .then(res =>
          setMessageModal({ isOpen: true, status: EStatuses.Success, message: 'User has been successfully updated' }),
        )
        .catch(() =>
          setMessageModal({ isOpen: true, status: EStatuses.Fail, message: 'An error occured' }),
        )
    } else {
      console.error('Fields is not valid')
    }
  }

  return (
    <Overlay
      isOpen={isOpen}
      onClick={() => setProfileModal({ ...defaultProfileModal })}
    >
      <div
        className="modal profile-modal"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <fieldset>
            <legend>{t(TRANSLATION.PROFILE)}</legend>
            <div className="avatar">
              <label>
                <div className="avatar_image">
                  <div
                    className="avatar_image_bg"
                    style={{
                      backgroundImage: `url(${user?.u_photo || images.driverAvatar})`
                    }}
                    title={user?.u_name || ''}
                  />
                </div>
                <input
                  onChange={onChangeAvatar}
                  type="file"
                  className="avatar_input"
                />
              </label>
            </div>
            <Input
              inputProps={{
                ...register('name', { required: t(TRANSLATION.REQUIRED_FIELD) }),
              }}
              label={
                t(user?.u_details?.work_type === EWorkTypes.Company ? TRANSLATION.COMPANY_NAME : TRANSLATION.NAME)
              }
              error={errors.name?.message}
            />
            {user?.u_details?.work_type === EWorkTypes.Self && (
              <Input
                inputProps={{
                  ...register('surname', { required: t(TRANSLATION.REQUIRED_FIELD) }),
                }}
                label={t(TRANSLATION.SURNAME)}
                error={errors.surname?.message}
              />
            )}
            {user?.u_details?.work_type === EWorkTypes.Self && (
              <Input
                inputProps={{
                  ...register('middleName', { required: t(TRANSLATION.REQUIRED_FIELD) }),
                }}
                label={t(TRANSLATION.MIDDLE_NAME)}
                error={errors.middleName?.message}
              />
            )}
            <Input
              inputProps={{
                ...register(
                  'email',
                  {
                    required: (!phone || !!getPhoneError(phone, true)) && t(TRANSLATION.REQUIRED_FIELD),
                    pattern: {
                      value: emailRegex,
                      message: t(TRANSLATION.EMAIL_ERROR),
                    },
                  },
                ),
              }}
              label={t(TRANSLATION.EMAIL)}
              error={errors.email?.message}
            />
            <Input
              inputProps={{
                ...register(
                  'phone',
                  {
                    required: !email && t(TRANSLATION.REQUIRED_FIELD),
                  },
                ),
              }}
              label={t(TRANSLATION.PHONE)}
              inputType={EInputTypes.MaskedPhone}
              error={getPhoneError(phone, true)}
            />
            <Input
              inputProps={{
                ...register('street'),
              }}
              label={t(TRANSLATION.STREET_ADDRESS)}
              error={errors.street?.message}
            />
            <Input
              inputProps={{
                ...register('city'),
              }}
              label={t(TRANSLATION.CITY)}
              error={errors.city?.message}
            />
            <Input
              inputProps={{
                ...register('state'),
              }}
              label={t(TRANSLATION.STATE)}
              error={errors.state?.message}
            />
            <Input
              inputProps={{
                ...register('zip'),
              }}
              label={t(TRANSLATION.ZIP_CODE)}
              error={errors.zip?.message}
            />
            <Input
              inputProps={{
                ...register('card', {
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
            <Button
              text={t(TRANSLATION.SAVE)}
              className="button"
              disabled={!isDirty || !isValid}
              type="submit"
              skipHandler={true}
            />
          </fieldset>
        </form>
      </div>
    </Overlay>
  )
}

export default connector(CardDetailsModal)


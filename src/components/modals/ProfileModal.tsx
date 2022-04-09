import React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { connect, ConnectedProps } from 'react-redux'
import Button from '../Button'
import Input, { EInputTypes } from '../Input'
import { t, TRANSLATION } from '../../localization'
import { modalsActionCreators, modalsSelectors } from '../../state/modals'
import images from '../../constants/images'
import './styles.scss'
import { IRootState } from '../../state'
import Overlay from './Overlay'
import { userSelectors } from '../../state/user'
import { defaultProfileModal } from '../../state/modals/reducer'
import { EWorkTypes } from '../../types/types'
import { emailRegex, getPhoneError } from '../../tools/utils'
import { configSelectors } from '../../state/config'
import { LANGUAGES } from '../../constants/languages'

const mapStateToProps = (state: IRootState) => ({
  user: userSelectors.user(state),
  language: configSelectors.language(state),
  isOpen: modalsSelectors.isProfileModalOpen(state),
})

const mapDispatchToProps = {
  setProfileModal: modalsActionCreators.setProfileModal,
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
  cardNumber: string
}

interface IProps extends ConnectedProps<typeof connector> {
}

const CardDetailsModal: React.FC<IProps> = ({
  user,
  language,
  isOpen,
  setProfileModal,
}) => {
  const { register, formState: { errors, isValid, isDirty }, handleSubmit, control } = useForm<IFormValues>({
    criteriaMode: 'all',
    mode: 'onChange',
    defaultValues: {
      name: user?.u_name,
      surname: user?.u_family,
      email: user?.u_email,
      phone: user?.u_phone,
      state: user?.u_state,
      city: user?.u_city ? (window as any).data.cities[user?.u_city][LANGUAGES[language].code] : '',
      zip: user?.u_zip,
      cardNumber: user?.u_card,
    },
  })

  const { phone } = useWatch<IFormValues>({ control })

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()

    if (isValid) {
      console.log('Fields is valid')
    } else {
      console.error('Fields is not valid')
    }

    setProfileModal({ isOpen: true })
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
              <img src={images.driverAvatar} alt={user?.u_name || ''}/>
            </div>
            <Input
              inputProps={{
                ...register('name', { required: t(TRANSLATION.REQUIRED_FIELD) }),
              }}
              label={t(user?.u_work_type === EWorkTypes.Company ? TRANSLATION.COMPANY_NAME : TRANSLATION.NAME)}
              error={errors.name?.message}
            />
            {user?.u_work_type === EWorkTypes.Self && (
              <Input
                inputProps={{
                  ...register('surname', { required: t(TRANSLATION.REQUIRED_FIELD) }),
                }}
                label={t(TRANSLATION.SURNAME)}
                error={errors.surname?.message}
              />
            )}
            {user?.u_work_type === EWorkTypes.Self && (
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
                    required: t(TRANSLATION.REQUIRED_FIELD),
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
                    required: t(TRANSLATION.REQUIRED_FIELD),
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
                ...register('cardNumber', {
                  required: t(TRANSLATION.REQUIRED_FIELD),
                  pattern: {
                    value: /^\d{16}$/,
                    message: t(TRANSLATION.CARD_NUMBER_PATTERN_ERROR),
                  },
                }),
                placeholder: 'ХХХХ-ХХХХ-ХХХХ-ХХХХ',
              }}
              label={t(TRANSLATION.CARD_NUMBER)}
              error={errors.cardNumber?.message}
            />
            <Button
              text={t(TRANSLATION.SAVE)}
              className="button"
              disabled={!isDirty}
              type='submit'
            />
          </fieldset>
        </form>
      </div>
    </Overlay>
  )
}

export default connector(CardDetailsModal)


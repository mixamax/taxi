import React, { useEffect, useState, useMemo } from 'react'
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
import { EStatuses, EUserRoles, EWorkTypes, TFilesMap, IRequiredFields } from '../../../types/types'
import { useLocation } from 'react-router-dom'
import ErrorFrame from '../../../components/ErrorFrame'
import JSONForm from '../../JSONForm'

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

interface IProps extends ConnectedProps<typeof connector> {
  isOpen: boolean;
}

const RegisterForm: React.FC<IProps> = ({
  status,
  tab,
  register,
  isOpen,
}) => {
    const handleSubmit = (values: any) => {
        values.st = 1
        register(values)
    }

    const formStr = (window as any).data?.site_constants?.form_register?.value
    let form
    try {
        form = JSON.parse(formStr)
    } catch (e) {
        return <ErrorFrame title='Bad json in data.js' />
    }
    return <JSONForm
        fields={form.fields}
        onSubmit={handleSubmit}
        state={{
          success: status === EStatuses.Success,
          failed: status === EStatuses.Fail
        }}
    />
}

export default connector(RegisterForm)

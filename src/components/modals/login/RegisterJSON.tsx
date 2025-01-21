import React from 'react'
import { IRootState } from '../../../state'
import { userSelectors, userActionCreators } from '../../../state/user'
import { connect, ConnectedProps } from 'react-redux'
import { EStatuses } from '../../../types/types'
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
  message,
  register,
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
      failed: status === EStatuses.Fail,
      errorMessage: message,
    }}
         />
}

export default connector(RegisterForm)

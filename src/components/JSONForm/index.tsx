import React, { useCallback, useMemo, useState } from 'react'
import * as yup from 'yup'
import { connect, ConnectedProps } from 'react-redux'
import { t, TRANSLATION } from '../../localization'
import { IRootState } from '../../state'
import { configSelectors } from '../../state/config'
import { EStatuses, ILanguage } from '../../types/types'
import JSONFormElement from './JSONFormElement'
import CustomComponent from './components'
import { TForm, TFormElement } from './types'
import { getCalculation } from './utils'
import './styles.scss'
import { form as formData } from './data'

// console.log(JSON.stringify(formData))

const mapStateToProps = (state: IRootState) => ({
    language: configSelectors.language(state),
    configStatus: configSelectors.status(state)
})

const connector = connect(mapStateToProps)

interface IProps extends ConnectedProps<typeof connector> {
    language: ILanguage,
    configStatus: EStatuses,
    fields: TForm,
    onSubmit?: (values: any) => any,
    state?: {
        success?: boolean,
        failed?: boolean
    }
}


const JSONForm: React.FC<IProps> = ({
    configStatus,
    language,
    onSubmit,
    state = {},
    fields
}) => {
    if (configStatus !== EStatuses.Success) return null
    const data = (window as any).data || {}
    const form = useMemo(() => {
        return fields.map(field => {
            if (field.type === 'select' && !Array.isArray(field.options) && field.options?.path) {
                const path = field.options.path.split('.')
                const map = path.reduce((res, key) => res[key], data)
                field.options = Object.keys(map).map(num => ({
                    value: num,
                    labelLang: map[num]
                }))
            }
            
            return field
        })
    }, [fields])

    const initialValues = useMemo(
        () => fields.reduce((res: any, item: TFormElement) => !item.name ?
            res :
            ({
                ...res,
                [item.name]: item.defaultValue ?? (
                    item?.validation?.required &&
                    getCalculation(item?.validation?.required) &&
                    item?.type !== 'file' ?
                        '' :
                        null
                )
            }),
        {}), [fields]
    )

    const [ values, setValues ] = useState(initialValues)

    const validationSchema = form.reduce((res: any, item: TFormElement) => {
        const { name, type, validation } = item
        if (!name || !validation) return res
        let obj
        if (type === 'file') {
            obj = yup.mixed()
        } else if (type === 'number') {
            obj = yup.number()

            if (getCalculation(validation.max, values)) {
                obj = obj.max(getCalculation(validation.max, values), t(TRANSLATION.CARD_NUMBER_PATTERN_ERROR))
            }
            if (getCalculation(validation.min, values)) {
                obj = obj.min(getCalculation(validation.min, values), t(TRANSLATION.CARD_NUMBER_PATTERN_ERROR))
            }
        } else {
            obj = yup.string()
    
            if (type === 'email') {
                obj = obj.email(t(TRANSLATION.EMAIL_ERROR))
            }
            if (getCalculation(validation.length, values)) {
                obj = obj.length(getCalculation(validation.length, values), t(TRANSLATION.CARD_NUMBER_PATTERN_ERROR))
            }
            if (getCalculation(validation.max, values)) {
                obj = obj.max(getCalculation(validation.max, values), t(TRANSLATION.CARD_NUMBER_PATTERN_ERROR))
            }
            if (getCalculation(validation.min, values)) {
                obj = obj.min(getCalculation(validation.min, values), t(TRANSLATION.CARD_NUMBER_PATTERN_ERROR))
            }
            if (getCalculation(validation.pattern, values)) {
                const pattern: [string, string] = getCalculation(validation.pattern, values)
                if (Array.isArray(pattern)) {
                    const regexp = new RegExp(...pattern)
                    obj = obj.matches(getCalculation(regexp, values), t(TRANSLATION.PHONE_PATTERN_ERROR))
                }
            }
        }

        if (getCalculation(validation.required, values)) {
            obj = obj.required(t(TRANSLATION.REQUIRED_FIELD))
        } else {
            obj = obj.nullable().optional()
        }

        return {
            ...res,
            [name]: obj
        }
    }, {})
    const yupSchema = yup.object(validationSchema)
    const isValid = yupSchema.isValidSync(values)

    const handleChange = useCallback((e, name, value) => {
        setValues({
            ...values,
            [name]: value
        })
    }, [values])

    const variables = useMemo(() => ({
        form: {
            valid: isValid,
            invalid: !isValid,
            submitSuccess: state.success,
            submitFailed: state.failed
        }
    }), [isValid, state])

    const handleSubmit = useCallback(e => {
        e.preventDefault()
        const submitValues: any = {}
        for (let [key, value] of Object.entries(values)) {
            const path = key.split('.')
            let tmpObj = submitValues
            path.forEach((str, i) => {
                if (i === path.length - 1) {
                    tmpObj[str] = value
                } else if (!tmpObj[str]) {
                    tmpObj[str] = {}
                }
                tmpObj = tmpObj[str]
            })
        }
        onSubmit && onSubmit(submitValues)
    }, [values])

    return (
        <div style={{ position: 'relative', zIndex: 500 }}>
            <form onSubmit={handleSubmit}>
                {form.map((formElement: TFormElement, i: number) => formElement.name ?
                    <JSONFormElement
                        key={i}
                        element={formElement}
                        values={values}
                        variables={variables}
                        onChange={handleChange}
                        validationSchema={validationSchema[formElement.name]}
                        language={language}
                    /> :
                    <CustomComponent
                        {...formElement}
                        values={values}
                        variables={variables}
                    />
                )}
            </form>
        </div>
    )
}

export default connector(JSONForm)
import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import * as yup from 'yup'
import { connect, ConnectedProps } from 'react-redux'
import { t, TRANSLATION } from '../../localization'
import { IRootState } from '../../state'
import { configSelectors } from '../../state/config'
import { EStatuses, ILanguage } from '../../types/types'
import { TFormElement, TOption, TFormValues } from './types'
import { getCalculation, getTranslation } from './utils'
import { form as formData } from './data'
import './styles.scss'

const fields = formData.fields

const JSONFormElement = (props: {
    element: TFormElement,
    validationSchema?: any,
    onChange: (e: any, name: string, value: any) => any,
    values?: TFormValues,
    language?: ILanguage
}) => {
    const {
        onChange = () => {},
        values = {},
        validationSchema,
        language
    } = props
    const {
        accept,
        placeholder,
        multiple,
        visible,
        disabled,
        options = [],
        validation = {}
    } = props.element

    const [ errorMessage, setErrorMessage ] = useState<string>('')
    const [ files, setFiles ] = useState<[any, File][]>()
    const name: string = getCalculation(props.element.name, values)
    const type = getCalculation(props.element.type, values)
    const value = values[name]

    const validate = useCallback((value) => {
        if (!validationSchema) return
        validationSchema.validate(value === '' ? null : value)
            .then(() => {
                setErrorMessage('')
            })
            .catch((error: any) => {
                setErrorMessage(error.message)
            })
    }, [])

    if (visible) {
        const isVisible = getCalculation(visible, values)
        if (!isVisible) return null
    }

    const commonProperties = {
        name,
        disabled: getCalculation(disabled, values),
        onChange: (e: any) => {
            const value = e.target.value === '' ? null : e.target.value
            validate(value)
            onChange(e, e.target.name, value)
        },
        onBlur: (e: any) => {
            const value = e.target.value === '' ? null : e.target.value
            validate(value)
        }
    }
    
    let labelElement: any = (
        <div className="label">
            {getTranslation(getCalculation(props.element.label, values))}
            {getCalculation(validation.required, values) && <span className="element__required">*</span>}
        </div>
    )
    let element
    
    if (type === 'button') {
        labelElement = null
        return (
            <button>
                {getTranslation(getCalculation(props.element.label, values))}
            </button>
        )
    }

    if (type === 'select') {
        const selectOptions = getCalculation(options, values)
        element = (
            <select
                {...commonProperties}
                value={value}
            >
                {selectOptions.map((option: TOption) => (
                    <option key={option.value} value={option.value}>
                        {!!option.label && getTranslation(option.label)}
                        {!!option.labelLang && !!language && option.labelLang[language.iso]}
                    </option>
                ))}
            </select>
        )
    }

    if (type === 'radio') {
        const radioOptions = getCalculation(options, values)
        element = (
            <>
                {radioOptions.map((option: TOption) => (
                    <label key={option.value}>
                        <input
                            {...commonProperties}
                            type='radio'
                            value={option.value}
                            checked={values[name] === option.value}
                        />
                        {getTranslation(option.label)}
                    </label>
                ))}
            </>
        )
    }

    if (type === 'checkbox') {
        labelElement = null
        element = (
            <label>
                <input
                    {...commonProperties}
                    type='checkbox'
                    checked={value}
                    onChange={e => onChange(e, e.target.name, e.target.checked)}
                />
                {getTranslation(getCalculation(props.element.label, values))}
            </label>
        )
    }

    if (type === 'file') {
        element = (
            <div className='element__file'>
                {!!files && files.map((file: [any, File], key: number) => (
                    <div
                        className='element__file_value'
                        key={key}
                        onClick={e => {
                            const newFiles = files.filter((file, index: number) => index !== key)
                            setFiles(newFiles)
                            onChange(e, name, newFiles.length ? newFiles : null)
                        }}
                    >
                        <img src={URL.createObjectURL(file[1])}></img>
                    </div>
                ))}
                <label className='element__file_add'>
                    <input
                        {...commonProperties}
                        className='element__file_input'
                        type='file'
                        multiple={multiple}
                        accept={accept}
                        onChange={e => {
                            if (!e.target.files) return
                            const inputFiles: [any, File][] = Array.from(e.target.files)
                                .map((file: File) => ([ null, file ]))
                            const newFiles = (files || []).concat(inputFiles)
                            setFiles(newFiles)
                            onChange(e, name, newFiles)
                        }}
                    />
                </label>
            </div>
        )
    }

    if (!element) {
        element = (
            <input
                {...commonProperties}
                value={value}
                type={type}
                placeholder={placeholder}
            />
        )
    }

    return (
        <div className="element__field">
            {labelElement}
            {element}
            {!!errorMessage && <div className='element__field_error'>
                {errorMessage}
            </div>}
        </div>
    )
}

const mapStateToProps = (state: IRootState) => ({
    language: configSelectors.language(state),
    configStatus: configSelectors.status(state)
})

const connector = connect(mapStateToProps)

interface IProps extends ConnectedProps<typeof connector> {
    language: ILanguage,
    configStatus: EStatuses,
    onSubmit?: (values: any) => any
}

const JSONForm: React.FC<IProps> = ({
    configStatus,
    language,
    onSubmit
}) => {
    if (configStatus !== EStatuses.Success) return null
    const data = (window as any).data || {}

    const dependenciesByName = useMemo(() => {
        const calculateFields = ['label', 'type', 'options', 'visible', 'disabled']
        const result = {}
        fields.map(field => {
            calculateFields.forEach(fieldName => {

            })
        })
    }, [fields])

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
        () => form.reduce((res, item) => ({
            ...res,
            [item.name]: item.defaultValue ?? null
        }), {}),
        [form]
    )

    const [ values, setValues ] = useState(initialValues)
    
    const validationSchema = form.reduce((res: any, item) => {
        const { name, type, validation } = item
        if (!validation) return res
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
                const regexp = new RegExp(getCalculation(validation.pattern, values))
                obj = obj.matches(getCalculation(regexp, values), t(TRANSLATION.CARD_NUMBER_PATTERN_ERROR))
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
                {form.map((formElement: TFormElement, i: number) => <JSONFormElement
                    key={i}
                    element={formElement}
                    values={values}
                    onChange={handleChange}
                    validationSchema={validationSchema[formElement.name]}
                    language={language}
                />)}
                <button type="submit" disabled={!isValid}>
                    {getTranslation(formData.submitText)}
                </button>
            </form>
        </div>
    )
}

export default connector(JSONForm)
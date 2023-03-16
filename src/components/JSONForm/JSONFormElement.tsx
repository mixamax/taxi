import React, { useCallback, useState } from 'react'
import cn from 'classnames'
import { ILanguage } from '../../types/types'
import Button from '../Button'
import { getCalculation, getTranslation, parseVariable } from './utils'
import { TFormElement, TOption, TFormValues } from './types'
import './styles.scss'

const JSONFormElement = (props: {
    element: TFormElement,
    validationSchema?: any,
    onChange: (e: any, name: string, value: any) => any,
    values?: TFormValues,
    language?: ILanguage,
    variables?: Record<string, any>
}) => {
    const {
        onChange = () => {},
        values = {},
        validationSchema,
        language,
        variables = {}
    } = props
    const {
        accept,
        hint,
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
        const empty = getCalculation(validation.required, values) ? '' : null
        validationSchema.validate(value === '' ? empty : value)
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
        disabled: parseVariable(getCalculation(disabled, values), variables),
        onChange: (e: any) => {
            const empty = getCalculation(validation?.required, values) ? '' : null
            const value = e.target.value === '' ? empty : e.target.value
            validate(value)
            onChange(e, e.target.name, value)
        },
        onBlur: (e: any) => {
            const empty = getCalculation(validation?.required, values) ? '' : null
            const value = e.target.value === '' ? empty : e.target.value
            validate(value)
        }
    }

    let hintElement: any = !hint ? null : (
        <div className="element__hint">
            <span className="element__hint_icon">?</span>
            <div className={`element__hint_message element__hint_message_${!props.element.label ? 'left' : 'right'}`}>{hint}</div>
        </div>
    )
    
    let labelElement: any = !props.element.label ? null : (
        <div className="element__label">
            {getTranslation(getCalculation(props.element.label, values))}
            {getCalculation(validation.required, values) && <span className="element__required">*</span>}
            {hintElement}
        </div>
    )
    let element

    if (type === 'hidden') {
        return (
            <input
                type='hidden'
                name={name}
                value={value}
            />
        )
    }
    
    if (type === 'button' || type === 'submit') {
        return (
            <Button
                type={type}
                text={getTranslation(getCalculation(props.element.label, values))}
                disabled={parseVariable(getCalculation(disabled, values), variables)}
                skipHandler
            />
        )
    }

    if (type === 'select') {
        const selectOptions = getCalculation(options, values)
        element = (
            <select
                {...commonProperties}
                value={value}
                className='element__select_input'
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
                    <label key={option.value} className='element__radio'>
                        <input
                            {...commonProperties}
                            disabled={option.disabled}
                            type='radio'
                            className='element__radio_input'
                            value={option.value}
                            checked={values[name] === option.value}
                        />
                        <span>{getTranslation(option.label)}</span>
                    </label>
                ))}
            </>
        )
    }

    if (type === 'checkbox') {
        labelElement = null
        element = (
            <label className='element__checkbox'>
                <input
                    {...commonProperties}
                    type='checkbox'
                    className='element__checkbox_input'
                    checked={value}
                    onChange={e => onChange(e, e.target.name, e.target.checked)}
                />
                <span>{getTranslation(getCalculation(props.element.label, values))}</span>
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
                <label className={cn('element__file_add', {
                    element__file_add_disabled: commonProperties.disabled
                })}>
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
                            e.target.value = ''
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
                className='element__text_input'
                placeholder={placeholder}
            />
        )
    }

    const Wrap = ['file', 'radio', 'checkbox'].includes(type) ? 'div' : 'label'

    return (
        <Wrap className="element__field">
            {labelElement}
            <div className="element__input">
                {element}
                {!labelElement && !!hint && hintElement}
            </div>
            {!!errorMessage && <div className='element__field_error'>
                {errorMessage}
            </div>}
        </Wrap>
    )
}

export default JSONFormElement
type TElementType = 'text' |
    'email' |
    'number' |
    'phone' |
    'select' |
    'checkbox' |
    'radio' |
    'file' |
    'button'
type TOperation = '=' | '<' | '>' | '<=' | '>=' | '!='

type TOption = {
    label?: string,
    labelLang?: Record<string, string>,
    value: string | number
}

type TOptionData = {
    path: string
}

type TCondition = [string, TOperation, any]

type TExpression<Result> = {
    expression: TCondition[],
    result: Result
}

type TCalculate<Result> = TExpression<Result>[]

type TFormElement = {
    name: string,
    placeholder?: string,
    defaultValue?: string | number | boolean,
    label?: string | TCalculate<string>,
    type?: TElementType | TCalculate<TElementType>,
    options?: TOptionData | TOption[] | TCalculate<TOptionData | TOption[]>,
    multiple?: boolean,
    accept?: string,
    visible?: TCalculate<boolean>,
    disabled?: boolean | TCalculate<boolean>,
    validation?: {
        email?: boolean | TCalculate<boolean>,
        required?: boolean | TCalculate<boolean>
        length?: number | TCalculate<number>,
        min?: number | TCalculate<number>,
        max?: number | TCalculate<number>,
        pattern?: string | TCalculate<string>
    },
    submit?: boolean
}

type TForm = TFormElement[]

type TFormValues = Record<string, any>

export type {
    TCondition,
    TExpression,
    TOperation,
    TOption,
    TCalculate,
    TFormElement,
    TForm,
    TFormValues
}
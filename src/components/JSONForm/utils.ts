import { t } from '../../localization'
import { TExpression, TCondition, TOperation, TFormValues } from './types'

export const isExpression = (value: any) => {
    if (typeof value !== 'object') return false
    if (!value.expression || !value.result) return false
    if (!Array.isArray(value.expression)) return false
    return value.expression.reduce((res: boolean, item: any) => res && item.length === 3, true)
}

export const isCalculate = (value: any) => {
    if (!Array.isArray(value)) return false
    return value.reduce((res: boolean, item: any) => res && isExpression(item), true)
}

export const getConditionResult = (left: any, op: TOperation, right: any) => {
    switch (op) {
        case '=':
            return left == right
    
        case '>':
            return left > right

        case '<':
            return left < right

        case '>=':
            return left >= right
        
        case '<=':
            return left <= right
    }
}

export const getCalculation = (calculate: any, values?: TFormValues) => {
    if (!isCalculate(calculate)) {
        return values === undefined ? () => calculate : calculate
    }

    const resultFn = (values: TFormValues) => {
        let returnValue: any
        calculate.map((exp: TExpression<any>) => {
            const { expression, result } = exp
            expression.map((item: TCondition) => {
                if (returnValue) return
                const [ key, op, right ] = item
                const left = values[key]
                if (getConditionResult(left, op, right)) returnValue = result
            })
        })
        return returnValue
    }
    return values === undefined ? resultFn : resultFn(values)
}

export const getTranslation = (str: any) => {
    if (typeof str !== 'string') return str
    const translate = t(str)
    return translate.toLowerCase() === 'error' ? str : translate
}
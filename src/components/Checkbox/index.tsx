import React from 'react'
import classNames from 'classnames'
import './styles.scss'
import MetaTags from 'react-meta-tags'
import SITE_CONSTANTS from '../../siteConstants'

interface IProps extends React.ComponentProps<'input'> {
  label: string,
  wrapperClassName?: string,
  wrapperAdditionalClassName?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, IProps>(
  (
    {
      label,
      wrapperClassName,
      wrapperAdditionalClassName,
      ...inputProps
    },
    ref,
  ) => {
    return (
      <div className={wrapperClassName || classNames('checkbox', wrapperAdditionalClassName)}>
        <MetaTags>
          <style>
            {`
            .checkbox input + label:before {
              border: 2px solid ${SITE_CONSTANTS.PALETTE.primary.dark};
            }
            `}
          </style>
        </MetaTags>
        <input
          ref={ref}
          type="checkbox"
          {...inputProps}
          id={inputProps.id || inputProps.name}
        />
        <label htmlFor={inputProps.id || inputProps.name} className="colored">{label}</label>
      </div>
    )
  })

export default Checkbox
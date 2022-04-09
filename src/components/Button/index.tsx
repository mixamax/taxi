import React from 'react'
import { connect, ConnectedProps } from 'react-redux'
import cn from 'classnames'
import { IRootState } from '../../state'
import { modalsActionCreators } from '../../state/modals'
import { userSelectors } from '../../state/user'
import './styles.scss'
import { EColorTypes, EStatuses } from '../../types/types'
import { getStatusClassName } from '../../tools/utils'
import { gradient } from '../../tools/theme'

const mapStateToProps = (state: IRootState) => ({
  user: userSelectors.user(state),
})

const mapDispatchToProps = {
  setLoginModal: modalsActionCreators.setLoginModal,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends React.ComponentProps<'button'>, ConnectedProps<typeof connector> {
  wrapperProps?: React.ComponentProps<'div'>,
  imageProps?: React.ComponentProps<'img'>,
  skipHandler?: boolean,
  text?: string,
  label?: string,
  status?: EStatuses,
  colorType?: EColorTypes
}

const Button: React.FC<IProps> = ({
  wrapperProps = {},
  imageProps,
  skipHandler,
  text,
  label,
  status = EStatuses.Default,
  user,
  setLoginModal,
  colorType = EColorTypes.Default,
  ...buttonProps
}) => {
  const handleButtonClick = (e: React.PointerEvent<HTMLButtonElement>): void => {
    if (skipHandler) return buttonProps.onClick && buttonProps.onClick(e)

    if (buttonProps.type !== 'submit' || (buttonProps.type === 'submit' && !user)) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (user) {
      if (buttonProps.onClick) buttonProps.onClick(e)
    } else {
      setLoginModal(true)
    }
  }

  return (
    <>
      {label && <span className={`button__label button__label--${getStatusClassName(status)}`}>{label}</span>}
      <div {...wrapperProps} className={cn('button__wrapper', wrapperProps.className)}>
        <button
          {...buttonProps}
          className={cn(
            'button',
            { disabled: buttonProps.disabled },
            { 'button--accent': colorType === EColorTypes.Accent },
            buttonProps.className,
          )}
          style={{
            background: gradient(),
            ...buttonProps.style,
          }}
          onClick={handleButtonClick}
        >
          {imageProps && (
            <img
              alt={text}
              {...imageProps}
              className={cn(
                'button__icon',
                imageProps.className,
              )}
            />
          )}
          {text}
        </button>
      </div>
    </>
  )
}

export default connector(Button)
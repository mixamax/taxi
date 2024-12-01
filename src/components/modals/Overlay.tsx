import cn from 'classnames'
import React from 'react'
import './styles.scss'
import MetaTags from 'react-meta-tags'
import SITE_CONSTANTS from '../../siteConstants'

interface IProps {
  isOpen: boolean,
  onClick?: () => any,
  children: React.ReactChild
}

const Overlay: React.FC<IProps> = ({ isOpen, onClick, children }) => (
  <div
    className={cn('overlay__wrapper', { 'overlay__wrapper--active': isOpen })}
  >
    <MetaTags>
      <style>
        {`
        .modal form fieldset, .login-modal fieldset {
          border: 2px solid ${SITE_CONSTANTS.PALETTE.primary.main};
        }
        .modal form fieldset legend, .login-modal fieldset legend {
          color: ${SITE_CONSTANTS.PALETTE.primary.dark};
        }
        `}
      </style>
    </MetaTags>
    <div
      className="overlay"
      onClick={onClick}
    />

    {children}
  </div>
)

export default Overlay
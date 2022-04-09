import React from 'react'
import SITE_CONSTANTS from '../../siteConstants'
import './styles.scss'

interface IProps {
  text?: string,
  style?: React.CSSProperties,
  src?: string,
  onClick?: React.PointerEventHandler<HTMLDivElement>,
}

const Separator: React.FC<IProps> = ({ text, style, src, onClick }) => (
  <div className="separator" style={{ color: SITE_CONSTANTS.PALETTE.primary.dark, ...style }} onClick={onClick}>
    {text}
    {src && <img src={src} alt={text}/>}
  </div>
)

export default Separator
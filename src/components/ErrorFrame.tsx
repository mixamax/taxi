import images from '../constants/images'
import React from 'react'
import { t, TRANSLATION } from '../localization'

interface IProps {
   title?: string,
}

const LoadFrame: React.FC<IProps> = ({ title }) => {
  return <div className="loading-frame">
    <img src={images.error} alt={t(TRANSLATION.ERROR)}/>
    <div className="loading-frame__title">{title}</div>
  </div>
}

export default LoadFrame
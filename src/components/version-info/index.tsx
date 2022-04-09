import React from 'react'
import version from '../../version.json'
import './version-info.scss'
import Config from '../../config'

const VersionInfo = () => {
  const _dt = new Date(version.buildTimestamp)

  return <div className="version-info colored">
    <span className="info-item _database">{'DB: ' + (Config.SavedConfig ? Config.SavedConfig : 'default')}</span>
    <span className="info-item _name">{version.name}</span>
    <span className="info-item _build">{`ver. ${version.version}`}</span>
    <span className="info-item _date">{_dt.toLocaleString()}</span>
  </div>
}

export default VersionInfo
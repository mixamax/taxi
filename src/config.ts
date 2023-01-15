import store from './state'
import { setConfigError, setConfigLoaded } from './state/config/actionCreators'

export const appName = 'taxi-web'

export const API_URL = 'https://ibronevik.ru/taxi/api/v1'

export const WHATSAPP_BOT_URL = 'http://localhost:7000'
export const WHATSAPP_BOT_KEY = '1472'

let _configName: string

export default class Config {
  static setConfig(name: string) {
    localStorage.setItem('config', name)
    _configName = name
    applyConfigName(name)
  }

  static clearConfig() {
    localStorage.removeItem('config')
    _configName = ''
    applyConfigName()
  }

  static setDefaultName() {
    applyConfigName()
  }

  static get API_URL() {
    return _configName ? `https://ibronevik.ru/taxi/c/${_configName}/api/v1` : API_URL
  }

  static get SavedConfig() {
    return localStorage.getItem('config')
  }
}

const applyConfigName = (name?: string) => {
  const script = document.createElement('script'),
    _name = name ? `data_${name}.js` : 'data.js'

  script.src = `https://ibronevik.ru/taxi/cache/${_name}`
  script.async = true
  script.onload = () => {
    store.dispatch(setConfigLoaded())
  }
  script.onerror = () => {
    store.dispatch(setConfigError())
  }

  document.body.appendChild(script)
}
import { getCacheVersion } from './API'
import store from './state'
import { setConfigError, setConfigLoaded } from './state/config/actionCreators'

export const appName = 'taxi-web'

export const API_URL = 'https://ibronevik.ru/taxi/c/gruzvill/api/v1/'

export const WHATSAPP_BOT_URL = 'http://localhost:7000'
export const WHATSAPP_BOT_KEY = '1472'

let _configName: string

const applyConfigName = (url: string, name?: string) => {
  const script = document.createElement('script'),
    _name = name ? `data_${name}.js` : 'data.js'
  getCacheVersion(url).then(ver => {
    script.src = `https://ibronevik.ru/taxi/cache/${_name}?ver=${ver}`
    script.async = true
    script.onload = () => {
      store.dispatch(setConfigLoaded())
    }
    script.onerror = () => {
      store.dispatch(setConfigError())
    }

    document.body.appendChild(script)
  })
}

class Config {
  constructor() {
    let params = new URLSearchParams(window.location.search),
      configParam = params.get('config'),
      clearConfigParam = params.get('clearConfig') !== null

    if (clearConfigParam) {
      this.clearConfig()
    } else {
      if (configParam) {
        this.setConfig(configParam)
      }
    }

    if (!!configParam) {
      params.delete('config')
    }
    if (!!clearConfigParam) {
      params.delete('clearConfig')
    }

    if (configParam || clearConfigParam) {
      const _path = window.location.origin + window.location.pathname
      let _newUrl = params.toString() ?
        _path + '?' + params.toString() :
        _path
      window.history.replaceState({}, document.title, _newUrl)
    } else {
      let _savedConfig = this.SavedConfig
      if (!!_savedConfig) {
        this.setConfig(_savedConfig)
      } else {
        this.setDefaultName()
      }
    }
  }

  setConfig(name: string) {
    localStorage.setItem('config', name)
    _configName = name
    applyConfigName(this.API_URL, name)
  }

  clearConfig() {
    localStorage.removeItem('config')
    _configName = ''
    applyConfigName(this.API_URL)
  }

  setDefaultName() {
    applyConfigName(this.API_URL)
  }

  get API_URL() {
    return _configName ? `https://ibronevik.ru/taxi/c/${_configName}/api/v1` : API_URL
  }

  get SavedConfig() {
    return localStorage.getItem('config')
  }
}

const config = new Config()

export default config
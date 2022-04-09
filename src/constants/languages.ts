import images from './images'

export const LANGUAGES = {
  '1': { id: '1', code: 'ru', image: images.flagRu },
  '2': { id: '2', code: 'en', image: images.flagEng },
  '3': { id: '3', code: 'ar', image: images.flagMar },
  '4': { id: '4', code: 'fr', image: images.flagFr },
} as const

export const DEFAULT_LANGUAGE = 1
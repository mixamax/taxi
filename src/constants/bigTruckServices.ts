import { TRANSLATION } from '../localization'

export interface IBigTruckService {
  id: number,
  label: string,
  description?: string,
}

export default [
  { label: TRANSLATION.INSURANCE, description: TRANSLATION.INSURANCE_DESCRIPTION },
  { label: TRANSLATION.LOADING_P, description: TRANSLATION.UPLOADING_DESCRIPTION },
  { label: TRANSLATION.UNLOADING, description: TRANSLATION.UNLOADING_DESCRIPTION },
  { label: TRANSLATION.ADVERTISEMENT, description: TRANSLATION.ADVERTISEMENT_DESCRIPTION },
  { label: TRANSLATION.FACTORING, description: TRANSLATION.FACTORING_DESCRIPTION },
  { label: TRANSLATION.MONITORING, description: TRANSLATION.MONITORING_DESCRIPTION },
  { label: TRANSLATION.ACCOMPANIMENT, description: TRANSLATION.ESCORT_DESCRIPTION },
  { label: TRANSLATION.SAFE_DEAL, description: TRANSLATION.SECURE_TRANSACTION_DESCRIPTION },
  { label: TRANSLATION.FORWARDING, description: TRANSLATION.FORWARDING_DESCRIPTION },
  { label: TRANSLATION.CUSTOMS_SERVICES, description: TRANSLATION.CUSTOMS_SERVICES_DESCRIPTION },
].map((item, index) => ({ ...item, id: index })) as IBigTruckService[]
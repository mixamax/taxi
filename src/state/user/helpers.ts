import * as API from './../../API'

export function uploadRegisterFiles(params: any) {
  const { filesToUpload, response, u_details } = params
  const uploadsName: string[] = []
  const uploads = filesToUpload
    .filter((item: any) => item.file)
    .map((item: any) => {
      uploadsName.push(item.name)
      return API.uploadFile({ file: item.file, ...response })
    })
  return Promise.all(uploads).then((res: any[]) => {
    const userData: Record<string, any> = {}
    res.forEach((item, i) => {
      const resData = item.data || {}
      if (resData.status !== 'success') return
      const fileId = resData.data?.dl_id
      userData[uploadsName[i]] = (userData[uploadsName[i]] || []).concat(fileId)
    })
    Object.keys(userData).forEach(key => {
      userData[key] = JSON.stringify(userData[key])
    })
    if (u_details) {
      Object.keys(u_details).forEach(key => {
        userData[key] = u_details[key]
      })
    }
    return userData
  })
  .then(u_details => {
    return API.editUserAfterRegister({
      u_details,
      u_id: `${response?.u_id}`,
      token: response?.token,
      u_hash: response?.u_hash
    })
  })
}
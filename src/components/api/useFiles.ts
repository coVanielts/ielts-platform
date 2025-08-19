import { initializeDirectus } from '@/libs/directus'
import { handleDirectusError } from '@/utils/auth-error.utils'
import { uploadFiles } from '@directus/sdk'

type uploadFileParams = {
  raw_file: File
}

export async function uploadFile({ raw_file }: uploadFileParams) {
  try {
    const directus = await initializeDirectus()

    const formData = new FormData()
    formData.append('file_1_property', 'Value')
    formData.append('file', raw_file)

    const result = await directus.request(uploadFiles(formData))

    return result.id
  } catch (error) {
    handleDirectusError(error)
    throw error
  }
}

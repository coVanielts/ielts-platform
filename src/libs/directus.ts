import { appConfig } from '@/configs/appConfigs.config'
import { CustomDirectusTypes } from '@/types/collections.type'
import { getToken } from '@/utils/token.helper'
import { authentication, createDirectus, rest } from '@directus/sdk'

export const directusClient = createDirectus<CustomDirectusTypes>(appConfig.directusUrl)
  .with(rest({ credentials: 'include' }))
  .with(authentication('cookie', { credentials: 'include' }))

export const initializeDirectus = async () => {
  const token = (await getToken()) as string

  await directusClient.setToken(token)
  return directusClient
}

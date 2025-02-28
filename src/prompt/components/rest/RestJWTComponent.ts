import axios from 'axios'
import { BasePromptComponent } from '../BasePromptComponent.js'

interface RestJWTComponentConfig {
  description: string
  username: string
  password: string
  tokenEndpoint?: string
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  params?: Record<string, any>
  data?: any
}

const defaultConfig: RestJWTComponentConfig = {
  description: '',
  username: '',
  password: '',
  tokenEndpoint: '',
  url: '',
  method: 'GET',
  params: {},
  data: null,
}

export class RestJWTComponent extends BasePromptComponent<RestJWTComponentConfig> {
  constructor(config: Partial<RestJWTComponentConfig> = {}) {
    const mergedConfig = { ...defaultConfig, ...config }
    super(mergedConfig.description, mergedConfig)
  }

  async getContent(): Promise<string> {
    try {
      let tokenUrl: string
      if (
        this.config.tokenEndpoint &&
        this.config.tokenEndpoint.trim() !== ''
      ) {
        tokenUrl = this.config.tokenEndpoint
      } else {
        const parsedUrl = new URL(this.config.url)
        tokenUrl = `${parsedUrl.origin}/api/v1/token/login`
      }

      const tokenResponse = await axios.post(tokenUrl, null, {
        auth: {
          username: this.config.username,
          password: this.config.password,
        },
      })
      const accessToken = tokenResponse.data.access_token
      const response = await axios({
        method: this.config.method || 'GET',
        url: this.config.url,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: this.config.params,
        data: this.config.data,
      })
      return JSON.stringify(response.data)
    } catch (error: any) {
      return `Error: ${error.message}`
    }
  }
}

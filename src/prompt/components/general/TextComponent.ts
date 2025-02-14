'use strict'

import { BasePromptComponent } from '../BasePromptComponent.js'

interface TextComponentConfig {
  description: string
  content: string
}

const defaultConfig: TextComponentConfig = {
  description: '',
  content: '',
}

export class TextComponent extends BasePromptComponent<TextComponentConfig> {
  constructor(config: Partial<TextComponentConfig> = {}) {
    const mergedConfig = { ...defaultConfig, ...config }
    super(mergedConfig.description, mergedConfig)
  }

  async getContent(): Promise<string> {
    return this.config.content
  }
}

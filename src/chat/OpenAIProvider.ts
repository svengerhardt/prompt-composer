'use strict'

import type { MessageContent } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import type { ChatProvider } from './ChatProvider.js'
import logger from '../logger.js'

export interface OpenAIConfig {
  model: string
  temperature: number
}

const defaultConfig: OpenAIConfig = {
  model: 'gpt-4o-mini',
  temperature: 0,
}

export class OpenAIProvider implements ChatProvider {
  private config: OpenAIConfig
  private chat: ChatOpenAI

  constructor(config: Partial<OpenAIConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    logger.info(
      `OpenAIProvider.invoke: model=${this.config.model}, temperature=${this.config.temperature}`,
    )
    this.chat = new ChatOpenAI({
      model: this.config.model,
      temperature: this.config.temperature,
    })
  }

  async invoke(prompt: string): Promise<MessageContent> {
    const response = await this.chat.invoke(prompt)
    return response.content
  }

  async *stream(prompt: string): AsyncIterable<{ content: string }> {
    const stream = await this.chat.stream(prompt)
    for await (const chunk of stream) {
      yield { content: `${chunk.content}` }
    }
  }
}

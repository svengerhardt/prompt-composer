'use strict'

import type { MessageContent } from '@langchain/core/messages'
import { ChatOllama } from '@langchain/ollama'
import type { ChatProvider } from './ChatProvider.js'
import logger from '../logger.js'

export interface OllamaConfig {
  model: string
  temperature: number
  numCtx: number
}

const defaultConfig: OllamaConfig = {
  model: 'qwen2.5:latest',
  temperature: 0,
  numCtx: 32768,
}

export class OllamaProvider implements ChatProvider {
  private config: OllamaConfig
  private chat: ChatOllama

  constructor(config: Partial<OllamaConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    logger.info(
      `OllamaProvider.invoke: model=${this.config.model}, temperature=${this.config.temperature}, numCtx=${this.config.numCtx}`,
    )
    this.chat = new ChatOllama({
      model: this.config.model,
      temperature: this.config.temperature,
      numCtx: this.config.numCtx,
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

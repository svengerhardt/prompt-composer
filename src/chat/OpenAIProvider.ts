import type { MessageContent } from '@langchain/core/messages'
import { ChatOpenAI, type ChatOpenAIFields } from '@langchain/openai'
import type { ChatProvider } from './ChatProvider.js'

import logger from '../logger.js'
import { ZodObject } from 'zod'

const defaultConfig: ChatOpenAIFields = {
  model: 'gpt-4o-mini',
  temperature: 0,
}

export class OpenAIProvider implements ChatProvider {
  private config: ChatOpenAIFields
  private chat: ChatOpenAI

  constructor(config: Partial<ChatOpenAIFields> = {}) {
    this.config = { ...defaultConfig, ...config }
    logger.debug(`OpenAIProvider config=${JSON.stringify(this.config)}`)
    this.chat = new ChatOpenAI(this.config)
  }

  async invoke(prompt: string): Promise<MessageContent> {
    const response = await this.chat.invoke(prompt)
    return response.content
  }

  async invokeWithStructuredOutput(
    prompt: string,
    zodObject: ZodObject<any>,
  ): Promise<{ [p: string]: any }> {
    const structuredLlm = this.chat.withStructuredOutput(zodObject)
    return await structuredLlm.invoke(prompt)
  }

  async *stream(prompt: string): AsyncIterable<{ content: string }> {
    const stream = await this.chat.stream(prompt)
    for await (const chunk of stream) {
      yield { content: `${chunk.content}` }
    }
  }
}

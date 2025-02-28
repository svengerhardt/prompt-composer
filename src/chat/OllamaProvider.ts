import type { MessageContent } from '@langchain/core/messages'
import { ChatOllama, type ChatOllamaInput } from '@langchain/ollama'
import type { ChatProvider } from './ChatProvider.js'
import logger from '../logger.js'
import { ZodObject } from 'zod'

const defaultConfig: ChatOllamaInput = {
  model: 'qwen2.5:latest',
  temperature: 0,
  numCtx: 8192,
}

export class OllamaProvider implements ChatProvider {
  private config: ChatOllamaInput
  private chat: ChatOllama

  constructor(config: Partial<ChatOllamaInput> = {}) {
    this.config = { ...defaultConfig, ...config }
    logger.debug(`OllamaProvider config=${JSON.stringify(this.config)}`)
    this.chat = new ChatOllama(this.config)
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

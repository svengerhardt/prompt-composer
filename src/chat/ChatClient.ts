import type { MessageContent } from '@langchain/core/messages'
import type { Chat } from './Chat.js'
import type { ChatProvider } from './ChatProvider.js'
import { ZodObject } from 'zod'

export class ChatClient implements Chat {
  private provider: ChatProvider

  constructor(provider: ChatProvider) {
    this.provider = provider
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async invoke(prompt: string): Promise<MessageContent> {
    return await this.provider.invoke(prompt)
  }

  async invokeWithStructuredOutput(
    prompt: string,
    zodObject: ZodObject<any>,
  ): Promise<{ [p: string]: any }> {
    return await this.provider.invokeWithStructuredOutput(prompt, zodObject)
  }

  async streamToStdout(prompt: string): Promise<void> {
    const stream = this.provider.stream(prompt)
    for await (const chunk of stream) {
      for (const char of chunk.content) {
        process.stdout.write(`${char}`)
        await this.sleep(10)
      }
    }
    console.log('')
  }
}

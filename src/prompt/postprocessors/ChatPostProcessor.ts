'use strict'

import type { PostProcessor } from './PostProcessor.js'
import type { ChatProvider } from '../../chat/ChatProvider.js'
import { ChatClient } from '../../chat/ChatClient.js'

export class ChatPostProcessor implements PostProcessor {
  private readonly prompt: string
  private readonly provider: ChatProvider

  constructor(prompt: string, provider: ChatProvider) {
    this.prompt = prompt
    this.provider = provider
  }

  async postProcessContent(content: string): Promise<string> {
    const chatClient = new ChatClient(this.provider)
    let result = await chatClient.invoke(`${this.prompt}\n\n${content}`)
    return result.toString()
  }
}

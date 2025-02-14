'use strict'

import { ZodObject } from 'zod'
import type { MessageContent } from '@langchain/core/messages'

export interface ChatProvider {
  invoke(prompt: string): Promise<MessageContent>
  invokeWithStructuredOutput(
    prompt: string,
    zodObject: ZodObject<any>,
  ): Promise<{ [p: string]: any }>
  stream(prompt: string): AsyncIterable<{ content: string }>
}

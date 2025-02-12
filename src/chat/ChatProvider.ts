'use strict'

import type { MessageContent } from '@langchain/core/messages'

export interface ChatProvider {
  invoke(prompt: string): Promise<MessageContent>
  stream(prompt: string): AsyncIterable<{ content: string }>
}

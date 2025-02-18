import type { MessageContent } from '@langchain/core/messages'

export enum ChatType {
  Ollama = 'Ollama',
  OpenAI = 'OpenAI',
}

export interface Chat {
  invoke(prompt: string): Promise<MessageContent>
  streamToStdout(prompt: string): Promise<void>
}

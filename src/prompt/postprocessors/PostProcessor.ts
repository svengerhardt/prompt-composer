'use strict'

export interface PostProcessor {
  postProcessContent(content: string): Promise<string>
}

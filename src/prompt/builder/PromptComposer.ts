'use strict'

import type { PromptComponent } from '../components/PromptComponent.js'
import logger from '../../logger.js'

export class PromptComposer {
  private startPrompt: string = ''
  private endPrompt: string = ''
  private components: PromptComponent[] = []

  setStart(text: string): void {
    this.startPrompt = text
  }

  setEnd(text: string): void {
    this.endPrompt = text
  }

  addComponent(component: PromptComponent): void {
    this.components.push(component)
  }

  async composePrompt(): Promise<string> {
    const componentParts = await Promise.all(
      this.components.map(async (component) => {
        const description = component.getDescription()
        const content = await component.getContent()
        if (description.trim().length > 0) {
          return `${description}\n\n${content}`
        } else {
          return `${content}`
        }
      }),
    )

    const promptParts: string[] = []

    if (this.startPrompt.trim()) {
      promptParts.push(this.startPrompt)
    }

    if (componentParts.length) {
      promptParts.push(componentParts.join('\n\n'))
    }

    if (this.endPrompt.trim()) {
      promptParts.push(this.endPrompt)
    }

    const fullPrompt = promptParts.join('\n\n')

    const wordCount = fullPrompt.trim().split(/\s+/).filter(Boolean).length
    const charCount = fullPrompt.length

    logger.info(
      '-----------------------------------------------------------------------------',
    )
    logger.info(
      `Generated prompt contains ${wordCount} words and ${charCount} characters.`,
    )
    logger.info(
      '-----------------------------------------------------------------------------',
    )

    return fullPrompt
  }
}

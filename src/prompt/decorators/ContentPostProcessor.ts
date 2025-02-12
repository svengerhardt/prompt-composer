'use strict'

import type { PromptComponent } from '../components/PromptComponent.js'
import type { PostProcessor } from '../postprocessors/PostProcessor.js'

export class ContentPostProcessor implements PromptComponent {
  constructor(
    private component: PromptComponent,
    private postProcessor: PostProcessor,
  ) {}

  public getDescription(): string {
    return this.component.getDescription()
  }

  public async getContent(): Promise<string> {
    const content = await this.component.getContent()
    return this.postProcessor.postProcessContent(content)
  }
}

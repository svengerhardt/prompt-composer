import type { PromptComponent } from './PromptComponent.js'
import logger from '../../logger.js'

export abstract class BasePromptComponent<T extends Record<string, any>>
  implements PromptComponent
{
  protected descriptionPrompt: string
  protected config: T

  protected constructor(descriptionPrompt: string, config: T) {
    logger.debug(`${this.constructor.name}: ${JSON.stringify(config)}`)
    this.descriptionPrompt = descriptionPrompt
    this.config = config
  }

  private interpolate(
    template: string,
    variables: Record<string, any>,
  ): string {
    return template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
      const trimmedKey = key.trim()
      return variables[trimmedKey] ?? ''
    })
  }

  public getDescription(): string {
    return this.interpolate(this.descriptionPrompt, this.config)
  }

  public abstract getContent(): Promise<string>
}

export interface PromptComponent {
  getDescription(): string
  getContent(): Promise<string>
}

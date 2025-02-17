export interface PostProcessor {
  postProcessContent(content: string): Promise<string>
}

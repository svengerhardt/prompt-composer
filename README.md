# Prompt Composer

Construct dynamic and context-rich prompts for large language models (LLMs).

## Usage

### Building a Prompt

Construct a prompt by adding multiple prompt components.

```typescript
import { PromptComposer, FileReaderComponent, TextComponent } from 'prompt-composer';

async function buildPrompt() {
  const promptComposer = new PromptComposer();
  
  promptComposer.addComponent(new TextComponent({
    content: 'Please examine all the stocks mentioned in the CSV document and select the five most interesting for a long trade'
  }));
  
  promptComposer.addComponent(new FileReaderComponent({
    path: '../resources/stocks.csv'
  }));
  
  const prompt = await promptComposer.composePrompt();
  console.log(prompt);
}

buildPrompt();
```

### Chat Integration

The module provides chat providers to send the composed prompt to an LLM. The `ChatClient` class wraps around a chosen chat provider.

**Streaming**

```typescript
import { ChatClient, OllamaProvider } from 'prompt-composer';

async function chatExample(prompt: string) {
  const chatClient = new ChatClient(new OllamaProvider({
    model: 'qwen2.5:14b',
    temperature: 0,
    numCtx: 32768
  }));
  
  await chatClient.streamToStdout(prompt);
}

// Assuming you have composed a prompt already
// chatExample(yourComposedPrompt);
```

**Structured Output**

```typescript
import { z } from 'zod';
import { ChatClient, OpenAIProvider } from 'prompt-composer';

async function chatExample(prompt: string) {
  const chatClient = new ChatClient(new OpenAIProvider({
    model: 'gpt-4o'
  }));
  
  const joke = z.object({
    setup: z.string().describe('The setup of the joke'),
    punchline: z.string().describe('The punchline to the joke'),
    rating: z.number().optional().describe('How funny the joke is, from 1 to 10'),
  });
  
  let result = await chatClient.invokeWithStructuredOutput(prompt, joke);
  console.log(result);
}

// chatExample('Tell me a joke about cats');
```

Result

```json
{
  "setup": "Why don't cats play poker in the wild?", 
  "punchline": "Too many cheetahs.", 
  "rating": 7
}
```

### Content Post Processing

The `ContentPostProcessor` allows you to modify or transform the content of an existing prompt component after it has been generated.

```typescript
promptComposer.addComponent(new ContentPostProcessor(
    new FileReaderComponent({
        path: '../resources/long.txt'
    }),
    new ChatPostProcessor(
        'Summarize the text',
        new OpenAIProvider({
            model: 'gpt-4o-mini',
            temperature: 0,
        })
    )
))
```

## Prompt Components Overview

Prompt Components are modular building blocks designed to generate parts of a prompt for a large language model (LLM). They allow you to encapsulate various sources of content—such as file data, web-scraped text, RSS feeds, or even post-processed content—and include a description along with the content itself. This modular design makes it easy to compose dynamic and context-rich prompts.

### How Prompt Components Work

Every Prompt Component follows a common contract defined by the `PromptComponent` interface:

- **`getDescription(): string`**  
  Returns a description for the component. This description is often used as a header or context for the content and supports template interpolation (i.e., embedding values from the component's configuration).

- **`getContent(): Promise<string>`**  
  Returns the content to be included in the prompt. Since content generation might involve asynchronous operations (like file reading or HTTP requests), this method returns a promise.

When the Prompt Composer aggregates multiple components, it calls these methods to build the complete prompt. The description provides context and clarity, while the content supplies the dynamic data.

### Component Configuration & Template Interpolation

#### Component Configuration

Each Prompt Component is usually configured through an options object. For example, components might require settings like:

- A **description** template (a string that can include placeholders).
- A **path**, **URL**, or **feed URL** from which to retrieve data.
- Additional options (like a limit for RSS feeds).

The configuration object allows you to tailor the component's behavior without changing its code.

#### Template Interpolation

Template interpolation is a convenient feature provided when extending the abstract class `BasePromptComponent`. It allows you to include dynamic values in the description using placeholder syntax. For instance:

```typescript
'The following JSON document from {{feedUrl}} is an array of RSS feed items.'
```

## Components

### Web Scraper

The `WebScraperComponent` is a prompt component designed to scrape content from a specified URL. It retrieves the HTML content of a web page, extracts the visible text (removing unnecessary elements like scripts and styles), and makes the cleaned text available for prompt composition.

**Example:**

```typescript
promptComposer.addComponent(new WebScraperComponent({
    description: 'Content from example.com',
    url: 'https://www.example.com'
}))
```

### RSS Feed

The `RSSFeedComponent` is a prompt component that retrieves and processes RSS feed data from a given URL. It leverages the [`rss-parser`](https://www.npmjs.com/package/rss-parser) package to parse the feed and the [`striptags`](https://www.npmjs.com/package/striptags) package to clean the content by removing HTML tags. The processed feed items are then returned as a JSON string.

**Example:**

```typescript
promptComposer.addComponent(new RSSFeedComponent({
    feedUrl: 'https://news.bitcoin.com/feed/',
    limit: 10
}))
```

### File Reader

The `FileReaderComponent` is a prompt component designed to read text content from a file on the local file system.

**Example:**

```typescript
promptComposer.addComponent(new FileReaderComponent({
    description: 'Stock info in csv format',
    path: '../resources/stocks.csv'
}))
```

### OHLCVComponent

The `OHLCVComponent` is a prompt component that retrieves historical market data (OHLCV: Open, High, Low, Close, Volume) from a cryptocurrency exchange using the ccxt library.

**Example:**

```typescript
promptComposer.addComponent(new OHLCVComponent({
    exchange: 'binance',
    symbol: 'BTC/USDT', 
    timeframe: '1d', 
    limit: 30
}))
```
**Configuration:**  

The component is configured with parameters such as:

- `exchange`: The exchange name (e.g., binance).
- `symbol`: The trading pair (e.g., BTC/USDT).
- `timeframe`: The interval for each candle (e.g., 1d).
- `since`: An optional starting timestamp (in milliseconds) for fetching data.
- `limit`: The maximum number of candles to fetch.

### FearGreedComponent

The `FearGreedComponent` is a prompt component that retrieves comprehensive market sentiment data based on the Fear and Greed index from a CNN data API. It formats a provided date to construct the correct API endpoint URL, fetches the sentiment data, and returns it as a JSON string.

**Example:**

```typescript
promptComposer.addComponent(new FearGreedComponent())
```

### FreqtradeComponent

The `FreqtradeComponent` is a prompt component designed to process and format historical market data for a specific trading pair and timeframe. It implements the `PromptComponent` interface, transforming raw market data into a structured JSON format that can be used in dynamic prompts.

**Example:**

```typescript
promptComposer.addComponent(new FreqtradeComponent(req.body))
```

**Data Transformation:**

The component takes in a raw data object (referred to as `body`) and processes it using the `transformBody` method. This method extracts key information such as:

- **Runmode:** The operational mode.
- **Timeframe:** The interval for each data candle.
- **Pair:** The trading pair, derived from the `metadata` of the input.
- **Candles:** An array of market data entries where each candle includes:
  - `date`: The timestamp.
  - `open`, `high`, `low`, `close`: Price information.
  - `volume`: The traded volume.
  - Additional optional fields

## Creating a New Prompt Component

There are two common approaches to creating a new Prompt Component:

### 1. Implementing the PromptComponent Interface Directly

If you need a fully custom component that doesn’t require the built-in template interpolation or shared configuration handling, you can implement the PromptComponent interface directly.

```typescript
import {PromptComponent} from 'prompt-composer';

export class CustomComponent implements PromptComponent {
  // Custom properties and constructor as needed
  constructor(private customValue: string) {}

  getDescription(): string {
    return `Custom Component with value: ${this.customValue}`;
  }

  async getContent(): Promise<string> {
    // Your custom logic to generate content
    return `Content based on ${this.customValue}`;
  }
}
```

### 2. Extending the BasePromptComponent Abstract Class

For most cases, extending BasePromptComponent is recommended. This approach leverages the built-in support for configuration management and template interpolation, reducing boilerplate code.

```typescript
import {BasePromptComponent} from 'prompt-composer';

interface MyComponentConfig {
  description: string;
  someParameter: string;
}

const defaultConfig: MyComponentConfig = {
  description: 'This component uses {{someParameter}} to generate content.',
  someParameter: 'default value',
};

export class MyComponent extends BasePromptComponent<MyComponentConfig> {
  constructor(config: Partial<MyComponentConfig> = {}) {
    // Merge the default configuration with any provided overrides
    const mergedConfig = { ...defaultConfig, ...config };
    super(mergedConfig.description, mergedConfig);
  }

  async getContent(): Promise<string> {
    // Use the configuration in your content generation logic
    return `Generated content using ${this.config.someParameter}`;
  }
}
```

## Logging Configuration

This module integrates logging using Winston. It provides two convenient ways to set the logging level:

### 1. Configuring via Environment Variables

By default, the logger checks for an environment variable named LOG_LEVEL to determine the logging level. If the variable is not set, it falls back to a default level (info).

**How to Set the Environment Variable**

```bash
LOG_LEVEL=debug node app.js
```

### 2. Configuring Using a Configuration Function

If you prefer to configure the log level programmatically, the module also provides a configuration function. This function allows users to update the logging level at runtime.

**How to Use the Configuration Function**

```typescript
import { setLogLevel } from 'prompt-composer'
// Change the log level to 'debug'
setLogLevel('debug')
```
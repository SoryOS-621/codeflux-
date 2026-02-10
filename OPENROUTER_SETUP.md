# OpenRouter Integration Guide

## Setup Complete! ✅

Your Inngest agent now uses OpenRouter free models for:
- Tool selection decision-making
- Code generation
- Task understanding and planning

## Free Models Available on OpenRouter

### Recommended Free Models:

1. **Google Gemma 2 9B** (Currently configured) ✅
   - Model ID: `google/gemma-2-9b-it:free`
   - Good for: Balanced performance, code generation
   - Context: 8K tokens

2. **Mistral 7B Instruct**
   - Model ID: `mistralai/mistral-7b-instruct:free`
   - Good for: Fast inference, coding tasks
   - Context: 32K tokens

3. **Meta Llama 3.2 3B Instruct**
   - Model ID: `meta-llama/llama-3.2-3b-instruct:free`
   - Good for: Faster responses, simpler tasks
   - Context: 128K tokens

4. **Qwen 2.5 7B Instruct**
   - Model ID: `qwen/qwen-2.5-7b-instruct:free`
   - Good for: Multilingual, code generation
   - Context: 32K tokens

5. **Phi-3 Medium 14B**
   - Model ID: `microsoft/phi-3-medium-128k-instruct:free`
   - Good for: Reasoning, longer context
   - Context: 128K tokens

## How to Change Models

In `src/inngest/functions.ts`, update the model parameter:

```typescript
model: openai({
  model: "google/gemma-2-9b-it:free", // Change this
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: "https://openrouter.ai/api/v1",
  defaultParameters: {
    temperature: 0.1, // Adjust temperature (0.0-2.0)
  }
}),
```

## Configuration Options

### Temperature
- `0.0-0.3`: More focused, deterministic (better for code)
- `0.7-1.0`: More creative, varied responses
- `1.0-2.0`: Very creative, more random

### Additional Parameters

```typescript
defaultParameters: {
  temperature: 0.1,
  max_tokens: 4000,        // Maximum response length
  top_p: 0.9,              // Nucleus sampling
  frequency_penalty: 0,    // Reduce repetition
  presence_penalty: 0,     // Encourage new topics
}
```

## Get Your OpenRouter API Key

1. Visit: https://openrouter.ai/keys
2. Sign up or log in
3. Create a new API key
4. Copy the key and add it to `.env.local`:

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
```

## Testing Your Setup

1. Add your OpenRouter API key to `.env.local`
2. Restart your dev server and Inngest:
   ```bash
   npm run dev
   npx inngest-cli@latest dev
   ```
3. Trigger a development task in your app
4. The agent will now use OpenRouter models!

## Rate Limits (Free Tier)

- Free models have rate limits
- If you hit limits, consider:
  - Adding credits to OpenRouter account
  - Switching between different free models
  - Reducing request frequency

## Monitoring Usage

Visit OpenRouter dashboard to monitor:
- API usage
- Credit balance
- Request logs
- Model performance

Dashboard: https://openrouter.ai/activity

## Advanced: Using Multiple Models

You can create different agents for different tasks:

```typescript
// Fast agent for simple tasks
const quickAgent = createAgent({
  name: "quick-agent",
  model: openai({
    model: "meta-llama/llama-3.2-3b-instruct:free",
    apiKey: process.env.OPENROUTER_API_KEY!,
    baseURL: "https://openrouter.ai/api/v1",
  })
});

// Powerful agent for complex tasks
const smartAgent = createAgent({
  name: "smart-agent",
  model: openai({
    model: "meta-llama/llama-3.1-8b-instruct:free",
    apiKey: process.env.OPENROUTER_API_KEY!,
    baseURL: "https://openrouter.ai/api/v1",
  })
});
```

## Comparison: OpenRouter vs Gemini

| Feature | OpenRouter Free | Gemini |
|---------|----------------|--------|
| Cost | Free (with limits) | Free tier available |
| Models | Multiple (Llama, Mistral, etc.) | Google models only |
| Flexibility | Switch models easily | Single provider |
| Context | Up to 128K tokens | Varies by model |
| Tool Support | ✅ Full function calling | ✅ Full function calling |

## Troubleshooting

### Error: "Invalid API key"
- Check `.env.local` has correct `OPENROUTER_API_KEY`
- Restart dev server and Inngest

### Error: "Rate limit exceeded"
- Wait a few minutes
- Switch to different free model
- Consider adding credits

### Poor Code Quality
- Increase temperature to 0.2-0.3
- Try a larger model (8B instead of 3B)
- Provide more context in system prompt

## Next Steps

1. ✅ Get OpenRouter API key
2. ✅ Add key to `.env.local`
3. ✅ Restart servers
4. ✅ Test with a development task
5. 📊 Monitor usage and adjust models as needed

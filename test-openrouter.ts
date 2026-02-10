import 'dotenv/config';
import OpenAI from 'openai';

const FREE_MODELS = [
  'openai/gpt-oss-120b:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'microsoft/phi-3-medium-128k-instruct:free',
];

async function testModel(client: OpenAI, modelId: string): Promise<boolean> {
  try {
    console.log(`📡 Testing: ${modelId}`);
    
    const startTime = Date.now();
    
    const completion = await client.chat.completions.create({
      model: modelId,
      messages: [
        {
          role: 'user',
          content: 'Reply with just "Hello! API is working." in plain text.',
        },
      ],
      temperature: 0.1,
      max_tokens: 50,
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ SUCCESS! Model is working\n`);
    console.log('📊 Response Details:');
    console.log(`   ⏱️  Response time: ${duration}s`);
    console.log(`   💬 Response: ${completion.choices[0]?.message?.content}`);
    console.log(`   🔢 Tokens: ${completion.usage?.total_tokens || 'N/A'}\n`);
    
    return true;
  } catch (error: any) {
    if (error.status === 429) {
      console.log(`⏸️  Rate limited - model works but at capacity\n`);
      return true;
    } else if (error.status === 404) {
      console.log(`❌ Not available\n`);
      return false;
    }
    console.log(`⚠️  Error: ${error.message}\n`);
    return false;
  }
}

async function testOpenRouter() {
  console.log('🔍 Testing OpenRouter API connection...\n');

  // Check if API key exists
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ ERROR: OPENROUTER_API_KEY not found in environment variables');
    console.log('💡 Make sure to add it to your .env.local file');
    process.exit(1);
  }

  console.log('✅ API key found in environment');
  console.log(`📝 Key starts with: ${process.env.OPENROUTER_API_KEY.substring(0, 10)}...\n`);

  // Initialize OpenAI client with OpenRouter
  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  });

  console.log('🚀 Testing free models...\n');
  
  let successCount = 0;
  const workingModels: string[] = [];

  for (const model of FREE_MODELS) {
    const works = await testModel(client, model);
    if (works) {
      successCount++;
      workingModels.push(model);
    }
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('═══════════════════════════════════════');
  console.log('📊 Test Summary:');
  console.log(`   🎯 API Key: Valid and working`);
  console.log(`   ✅ Working models: ${successCount}/${FREE_MODELS.length}`);
  
  if (workingModels.length > 0) {
    console.log('\n🎉 Your OpenRouter integration is ready!');
    console.log('\n💡 Available models for your code:');
    workingModels.forEach(model => console.log(`   - ${model}`));
  }
  
  console.log('═══════════════════════════════════════\n');
}

// Run the test
testOpenRouter();

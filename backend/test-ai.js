const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');

const fallbackModels = [
  'agnes-2.5-flash',
  'agnes-3.0-flash',
  'diffusiongemma-26b-a4b-it'
];

const openai = new OpenAI({
  apiKey: 'sk-p8GXAXmljYonz0t5fvS0r09aN9K6iPvkCpR9UWyhXuU9ykf8',
  baseURL: 'https://router.juan.web.id/v1'
});

async function run() {
  const messages = [
    {
      role: 'system',
      content: 'You are Avario AI.'
    },
    {
      role: 'assistant',
      content: 'Halo! Saya Boostup AI. Ada yang bisa saya bantu terkait laporan atau pengubahan data?'
    },
    {
      role: 'user',
      content: 'halop'
    }
  ];

  for (const modelName of fallbackModels) {
    console.log(`Trying ${modelName}...`);
    try {
      const result = await openai.chat.completions.create({
        model: modelName,
        messages: messages,
        tools: [
          {
            type: 'function',
            function: {
              name: 'get_financial_summary',
              description: 'Get summary',
              parameters: { type: 'object', properties: {} }
            }
          }
        ],
        tool_choice: 'auto'
      });
      console.log('SUCCESS:', result.choices[0].message);
      return;
    } catch (e) {
      console.error(`FAILED ${modelName}:`, e.message);
    }
  }
}
run();

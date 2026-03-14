const { GoogleGenAI } = require('@google/genai');

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not set');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: 'Say "hello" in one word.' }],
        },
      ],
    });

    if (typeof response.text === 'function') {
      console.log('Success, response text:');
      console.log(response.text());
    } else {
      console.log('Success, raw response:');
      console.log(JSON.stringify(response, null, 2));
    }
  } catch (err) {
    console.error('Gemini call failed:');
    console.error(err);
    process.exitCode = 1;
  }
}

main();


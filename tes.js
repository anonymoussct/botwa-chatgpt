const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);

async function generateResponse(text) {
  const response = await openai.createCompletion({
    model: "code-davinci-003",
    prompt: text,
    temperature: 0.3,
    max_tokens: 3000,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
  });
  return response.data.choices[0].text;
}

async function main() {
  const result = await generateResponse("Apa itu chatGPT?");
  console.log(result);
}

main();

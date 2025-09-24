import dotenv from "dotenv";
dotenv.config();
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1";

import OpenAI from "openai";

export async function runAi(url) {
  try {
    console.log("Starting AI request...");
    console.log("Endpoint:", endpoint);
    console.log("Model:", model);
    console.log("Image URL:", url);
    if (!token) {
      throw new Error("API token is not set in the environment variables.");
    }
    if (!url) {
      throw new Error("Image URL is not provided.");
    }

    let function_definition = [];
    function_definition.push({
      type: "function",
      function: {
        name: "extract_nutrition_facts",
        description: "extracts nutrition facts from picture",
        parameters: {
          type: "object",
          properties: {
            portion: {
              type: "number",
              description:
                "approximate portion side in grams or milliliters (just the number)",
            },
            food_name: {
              type: "string",
              description: "closest food name (string max 100 caracters)",
            },
            protein: {
              type: "number",
              description:
                "approximate protein content in grams inside the whole picture portion (just the number)",
            },
            carbs: {
              type: "number",
              description:
                "approximate carbs content in grams inside the whole picture portion (just the number)",
            },
            calories: {
              type: "number",
              description:
                "approximate calories content in kilo calories inside the whole picture portion (just the number)",
            },
          },
        },
      },
    });
    const client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENAPI_KEY,
    });
    const response = await client.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful nutrition assistant that can analyze food images",
        },
        {
          role: "user",
          content: `Please identify this food (max 15-20 characters) and provide nutritional macros and total estimated portion in grams (g). Image URL: """${url}""" `,
        },
      ],
      tools: function_definition,
      tool_call: { name: "extract_nutrition_facts" },
      temperature: 0,
      top_p: 1,
    });

    console.log("response.choices[0].message");
    console.log(response.choices[0].message);
    console.log(response.choices[0].message.tool_calls[0].function.arguments);

    console.log(response.choices[0].finish_reason);
    if (response.choices[0].finish_reason == "tool_calls") {
      // return response.body.choices[0].message.tool_calls[0].function.arguments;
      return JSON.parse(
        response.choices[0].message.tool_calls[0].function.arguments
      );
    } else {
      throw new Error("Image Reading Error");
    }

    //return response.body.choices[0].message.content;
  } catch (error) {
    console.error("Error in runAi:", error.message);
    throw error;
  }
}

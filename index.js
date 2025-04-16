// Replace this line:
// import { GoogleGenAI } from '@google/genai';

// With this line:
const express = require('express');
const { GoogleGenAI } = require('@google/genai');


// Initialize Express app
const app = express();
app.use(express.json()); // Middleware to parse JSON requests

// Initialize Vertex with your Cloud project and location
const ai = new GoogleGenAI({
    vertexai: true,
    project: 'ai-learning-2025', // Ensure this is correct
    location: 'us-central1'          // Ensure this is a supported region
  });
const model = 'gemini-2.0-flash-001';


// Set up generation config
const generationConfig = {
  maxOutputTokens: 8192,
  temperature: 1,
  topP: 0.95,
  responseModalities: ["TEXT"],
  speechConfig: {
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: "zephyr",
      },
    },
  },
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'OFF',
    },
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'OFF',
    }
  ],
};


async function generateContent() {
    const req = {
      model: model,
      contents: [
        { text: "Write a short story about software developer learning path." } // Example prompt
      ],
      config: generationConfig,
    };
  
    try {
      const streamingResp = await ai.models.generateContentStream(req);
  
      console.log("Streaming response:"); // Added for clarity
      for await (const chunk of streamingResp) {
        // Check if the chunk has text content
        if (chunk && chunk.candidates && chunk.candidates[0] && chunk.candidates[0].content && chunk.candidates[0].content.parts && chunk.candidates[0].content.parts[0] && chunk.candidates[0].content.parts[0].text) {
          process.stdout.write(chunk.candidates[0].content.parts[0].text);
        } else {
          // Optionally log non-text chunks for debugging, but avoid writing complex objects directly
          // console.log('Received non-text chunk:', JSON.stringify(chunk));
        }
      }
      console.log("\n--- Stream finished ---"); // Indicate end of stream
    } catch (error) {
      console.error("\nError generating content:", error); // Added error handling
    }
  }

// It's good practice to add a prompt to the contents array
// Example:
// generateContent([{ text: "Write a short story about a friendly robot." }]);

// Call the function (make sure contents in req is populated or passed as an argument)
//generateContent(); // You might want to pass content here

// Controller for topicGeneration
async function topicGeneration(req, res) {
    const { prompt } = req.body; // Expecting a JSON body with a "prompt" field
  
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
  
    const reqConfig = {
      model: model,
      contents: [{ text: prompt }],
      config: generationConfig,
    };
  
    try {
      const streamingResp = await ai.models.generateContentStream(reqConfig);
      let generatedText = '';
  
      for await (const chunk of streamingResp) {
        if (chunk?.candidates?.[0]?.content?.parts?.[0]?.text) {
          generatedText += chunk.candidates[0].content.parts[0].text;
        }
      }
  
      res.status(200).json({ generatedText });
    } catch (error) {
      console.error('Error generating content:', error);
      res.status(500).json({ error: 'Failed to generate content' });
    }
  }
  
  // Define the route
  app.post('/api/topicGeneration', topicGeneration);
  
  // Start the server
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

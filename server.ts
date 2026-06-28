import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Set up larger limit for base64 image uploads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Lazy initializer for Gemini client to prevent crash if key is missing on startup
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing. Please add it in the Secrets panel.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Utility to parse base64 data URLs
function parseDataUrl(dataUrl: string) {
  const matches = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches) {
    // If it is already raw base64
    return { mimeType: 'image/png', data: dataUrl };
  }
  return { mimeType: matches[1], data: matches[2] };
}

// API: Classify Text (Few-shot classification)
app.post('/api/classify-text', async (req, res) => {
  try {
    const { classes, testInput } = req.body;

    if (!classes || !Array.isArray(classes) || classes.length < 2) {
      return res.status(400).json({ error: 'At least two classes are required for classification.' });
    }
    if (!testInput || typeof testInput !== 'string') {
      return res.status(400).json({ error: 'Test input is required.' });
    }

    const ai = getGeminiClient();

    // Construct the prompt with training examples
    let systemPrompt = `You are the backend classification engine of a "Teachable Machine" application. 
The user has trained a custom text classifier by writing training examples for different classes.
Your job is to analyze the user's 'Test Input' and classify it into one of these defined classes.

Here is the custom training dataset provided by the user:
`;

    classes.forEach((c: { name: string; examples: string[] }) => {
      systemPrompt += `\nClass Name: "${c.name}"`;
      if (c.examples.length === 0) {
        systemPrompt += `\n  (No training examples provided for this class - treat it as a class candidate)`;
      } else {
        systemPrompt += `\n  Training Examples:`;
        c.examples.forEach((example, idx) => {
          systemPrompt += `\n    ${idx + 1}. "${example}"`;
        });
      }
    });

    systemPrompt += `\n\nAnalyze the "Test Input" below and decide which of the classes it fits best. Provide a confidence percentage score (0-100) for each class such that the total sum of confidence scores across all classes is approximately 100. Provide a brief reasoning explaining your decision.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        { text: systemPrompt },
        { text: `Test Input to classify: "${testInput}"` }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            predictedClass: { 
              type: Type.STRING, 
              description: 'The exact name of the class that best matches the test input.' 
            },
            confidenceScores: {
              type: Type.ARRAY,
              description: 'An array containing confidence percentages for all defined classes. The values must sum to approximately 100.',
              items: {
                type: Type.OBJECT,
                properties: {
                  className: { type: Type.STRING, description: 'The exact name of the class.' },
                  confidence: { type: Type.NUMBER, description: 'Percentage probability (0 to 100) reflecting how likely this input belongs to this class.' }
                },
                required: ['className', 'confidence']
              }
            },
            reasoning: { 
              type: Type.STRING, 
              description: 'A brief explanation (1-2 sentences) of why this classification was chosen.' 
            }
          },
          required: ['predictedClass', 'confidenceScores', 'reasoning']
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Gemini API returned an empty response.');
    }

    const prediction = JSON.parse(resultText);
    res.json(prediction);
  } catch (error: any) {
    console.error('Error during text classification:', error);
    res.status(500).json({ error: error.message || 'An error occurred during text classification.' });
  }
});

// API: Classify Image (Few-shot classification)
app.post('/api/classify-image', async (req, res) => {
  try {
    const { classes, testImage } = req.body;

    if (!classes || !Array.isArray(classes) || classes.length < 2) {
      return res.status(400).json({ error: 'At least two classes are required for classification.' });
    }
    if (!testImage || typeof testImage !== 'string') {
      return res.status(400).json({ error: 'Test image data is required.' });
    }

    const ai = getGeminiClient();

    // Prepare contents array
    const contents: any[] = [];

    // System instruction prompt
    let promptIntro = `You are the backend classification engine of a "Teachable Machine" application.
The user has trained a custom image classifier by providing training images for different classes.
Below, you will be shown several labeled training images (if any are provided for each class), followed by a final test image labeled "TEST_IMAGE".
Your goal is to compare the test image to the labeled training images and classify the test image.
You must return the confidence score (0 to 100) for each class (summing to approximately 100) and a brief reasoning in JSON format.

Below is the list of classes defined in this training project:
${classes.map((c: any) => `- "${c.name}"`).join('\n')}

We will now present the training images one by one, each accompanied by its designated label. Please study them carefully.
`;

    contents.push({ text: promptIntro });

    // Append training images
    classes.forEach((c: { name: string; examples: string[] }) => {
      c.examples.forEach((exampleDataUrl, idx) => {
        try {
          const { mimeType, data } = parseDataUrl(exampleDataUrl);
          contents.push({
            inlineData: {
              mimeType,
              data
            }
          });
          contents.push({
            text: `The image above is a training example for the class: "${c.name}"`
          });
        } catch (err) {
          console.error(`Error parsing training image for class ${c.name} at index ${idx}:`, err);
        }
      });
    });

    // Append the test image
    const testParsed = parseDataUrl(testImage);
    contents.push({
      inlineData: {
        mimeType: testParsed.mimeType,
        data: testParsed.data
      }
    });

    contents.push({
      text: `The image directly above is the "TEST_IMAGE" to classify. Please classify this "TEST_IMAGE" into one of the defined classes: ${classes.map((c: any) => `"${c.name}"`).join(', ')}. Estimate the confidence percentages (0-100) for each class and explain your reasoning in 1-2 sentences.`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            predictedClass: { 
              type: Type.STRING, 
              description: 'The exact name of the class that best matches the test image.' 
            },
            confidenceScores: {
              type: Type.ARRAY,
              description: 'An array containing confidence percentages for all defined classes. The values must sum to approximately 100.',
              items: {
                type: Type.OBJECT,
                properties: {
                  className: { type: Type.STRING, description: 'The exact name of the class.' },
                  confidence: { type: Type.NUMBER, description: 'Percentage probability (0 to 100) reflecting how likely this image belongs to this class.' }
                },
                required: ['className', 'confidence']
              }
            },
            reasoning: { 
              type: Type.STRING, 
              description: 'A brief explanation (1-2 sentences) of why this classification was chosen.' 
            }
          },
          required: ['predictedClass', 'confidenceScores', 'reasoning']
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Gemini API returned an empty response.');
    }

    const prediction = JSON.parse(resultText);
    res.json(prediction);
  } catch (error: any) {
    console.error('Error during image classification:', error);
    res.status(500).json({ error: error.message || 'An error occurred during image classification.' });
  }
});

// Configure Vite middleware in development or static asset serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

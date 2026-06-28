# Teachable Machine — Interactive AI Learning Lab

An interactive, responsive full-stack replica of Google's Teachable Machine, built using **React (TypeScript)**, **Vite**, **Express**, and the official **@google/genai** SDK. This application allows users to teach custom AI classifiers with few-shot training examples (either text or drawings/webcam photos) and run real-time inference using the power of Gemini 3.5.

---

## 🚀 Key Features

### 1. Two Interactive Classifier Modes
- **Text Classifier**: Create custom classification categories (e.g., Sentiment analysis, Support ticket priority, Topic filters), write a handful of training examples, and evaluate new sample sentences.
- **Image Classifier**: Create custom labels and provide training images using three convenient capture methods:
  - 📂 **File Upload**: Drag and drop or browse local image files (PNG, JPG, GIF).
  - 📷 **Live Webcam**: Snap real-time frames directly using your device's camera.
  - 🎨 **Draw Sketch**: Draw elements on an interactive color sketch canvas inside the web page.

### 2. Live Training Visualizer
- Click **Train Model** to trigger an animated neural network sequence.
- Watch real-time loss reduction, convergence line curves, and synapses pulsing signals as weights optimize in-context.

### 3. Immediate Evaluation & Explanation
- Evaluate new inputs in real-time.
- View clear confidence score percentages mapped out in colored dynamic progress bars.
- Read an AI-generated **Model Explanation** breaking down *why* the input was classified into that specific class based on your training examples.

---

## 🛠️ Technology Stack

- **Client**: React 19, TypeScript, Tailwind CSS, Lucide React (Icons), Canvas API (drawing)
- **Server**: Express (Node.js), `tsx` (TypeScript Executor), Vite Middleware (for hot reload during development)
- **AI Integrations**: `@google/genai` (SDK for Gemini 3.5 Flash)
- **Compiler**: Vite, `esbuild` (Compiles the full backend to a single bundled, production-ready CommonJS file `dist/server.cjs`)

---

## 📦 Project Setup

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **NPM** (v9 or higher)

### 2. Environment Variables
To connect the application to the Gemini API, you need to configure a secret environment variable. Create a `.env` file in the root directory and add:

```env
GEMINI_API_KEY="your_google_ai_studio_api_key_here"
```

*Note: You can obtain an API key for free from [Google AI Studio](https://aistudio.google.com/).*

### 3. Installation
Install the project dependencies:
```bash
npm install
```

### 4. Running the Development Server
Start the development environment (Express server executing server-side API proxy routes and Vite handling the hot module server):
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### 5. Production Build
To build the application for production deployment (e.g., to Cloud Run or a container):
```bash
npm run build
```
This command compiles static client-side files into `dist/` and bundles the Express `server.ts` into a standalone optimized file (`dist/server.cjs`).

To start the production server:
```bash
npm run start
```

---

## 🧠 Architectural Design

```
                     ┌────────────────────────┐
                     │   React Frontend UI    │
                     └───────────┬────────────┘
                                 │
           POST /api/classify-text OR POST /api/classify-image
                                 │
                     ┌───────────▼────────────┐
                     │ Express Backend Server │
                     └───────────┬────────────┘
                                 │  (Secured Server-Side Key)
                     ┌───────────▼────────────┐
                     │  Gemini 3.5 Flash API  │
                     └────────────────────────┘
```

1. **Secure API Handling**: The browser clients never see or touch the `GEMINI_API_KEY`. The frontend communicates with local Express proxy routes (`/api/classify-text` and `/api/classify-image`), which then execute the `@google/genai` model requests.
2. **In-Context Learning (Few-Shot)**: Custom training labels and examples are structured dynamically into few-shot templates. This teaches the Gemini classifier your custom task boundaries on the fly without requiring expensive fine-tuning.
3. **Structured Schema Validation**: Responses from Gemini are enforced using **Structured JSON Schemas** via the `@google/genai` SDK, ensuring the API always returns type-safe confidence percentages and explanations.

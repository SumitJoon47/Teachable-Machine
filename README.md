# 🧠 Teachable Machine – Interactive AI Learning Lab

> An AI-powered, full-stack web application inspired by Google's Teachable Machine that enables users to create custom **text** and **image classifiers** using only a few labeled examples. Instead of training a new machine learning model, the application leverages **Google Large Language Model ) Learning** to instantly adapt to user-defined classification tasks.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![Vite](https://img.shields.io/badge/Vite-Fast-purple?logo=vite)
![Gemini](https://img.shields.io/badge/Google-Gemini-orange?logo=google)

---

# 📖 Overview


Traditional machine learning applications require collecting large datasets, training models, and deploying them before users can perform predictions.

This project demonstrates a modern AI workflow where users **teach the application using only a few examples**, allowing Gemini to perform intelligent classification through **Few-Shot Prompting (In-Context Learning)**.

The application is generic and adaptable, enabling users to build custom classifiers for tasks such as:

* 😊 Sentiment Analysis
* 📩 Spam Detection
* 🎫 Support Ticket Classification
* 📝 Topic Classification
* 🖼️ Image Recognition
* 🐶 Animal Classification
* 🌱 Plant Recognition
* 🎨 Sketch Classification
* And many more...

---

# ✨ Features

## 📝 Text Classification

Create custom categories and provide your own examples.

Example:

```
Positive
- Amazing product
- Loved it
- Great experience

Negative
- Worst purchase
- Terrible quality
- Never buying again
```

Enter new text to receive:

* Predicted Class
* Confidence Score
* AI-generated Explanation

---

## 🖼️ Image Classification

Users can teach image categories using three different input methods.

### 📂 Upload Images

* PNG
* JPG
* JPEG
* GIF

### 📷 Webcam Capture

Capture images directly from your webcam.

### 🎨 Sketch Canvas

Draw objects using an interactive HTML Canvas and classify your sketches.

---

## 📊 Training Visualization

Although Gemini does not retrain its neural network, the application includes an educational visualization that simulates the machine learning process.

Visualizations include:

* Neural Network Animation
* Signal Flow
* Loss Curve
* Convergence Graph
* Weight Updates (Simulation)

This helps users understand how traditional machine learning works while the application actually performs inference using Few-Shot Learning.

---

## 📈 Prediction Dashboard

Each prediction displays:

* Predicted Label
* Confidence Percentages
* Progress Bars
* AI-generated Reasoning
* Response Time

---

## 🔒 Secure API Architecture

The Gemini API key is **never exposed to the browser**.

All requests pass through an Express backend acting as a secure proxy.

```
Frontend
      │
      ▼
Express Backend
      │
      ▼
Google Gemini API
```

---

# 🧠 AI Concepts Used

## Few-Shot Learning

Instead of training a new model, the application provides Gemini with a small number of labeled examples.

Example:

```
Positive
- I love this
- Amazing service

Negative
- Worst product
- Terrible support

Input:
"The service was fantastic"

Prediction:
Positive
```

Gemini recognizes the pattern from the examples without updating its model weights.

---

## In-Context Learning

Each API request contains:

* User-defined labels
* Training examples
* New input

Gemini performs classification using only the provided context.

No permanent model training occurs.

---

## Structured Output

Responses are validated using structured JSON schemas to ensure consistent outputs.

Example:

```json
{
  "label": "Positive",
  "confidence": 94,
  "explanation": "The input expresses satisfaction similar to the positive examples."
}
```

---

# 🏗️ System Architecture

```
                   User
                     │
                     ▼
          React + TypeScript UI
                     │
                     ▼
        Collect Training Examples
                     │
                     ▼
       Express API (Secure Backend)
                     │
        Prompt Construction Layer
                     │
                     ▼
      Google Gemini 3.5 Flash API
                     │
                     ▼
     JSON Classification Response
                     │
                     ▼
     Prediction + Confidence + Explanation
```

---

# 🔄 Data Flow

```
User

│

├── Creates Labels

│

├── Adds Examples

│

├── Clicks Train

│

▼

Frontend stores examples

│

▼

POST /api/classify

│

▼

Express Backend

│

▼

Prompt Builder

│

▼

Gemini API

│

▼

Prediction

│

▼

Frontend Dashboard
```

---

# 🛠️ Tech Stack

## Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS
* Lucide React
* HTML Canvas API

---

## Backend

* Express.js
* Node.js
* TypeScript
* tsx

---

## AI

* Google Gemini 3.5 Flash
* @google/genai SDK

---

## Build Tools

* Vite
* esbuild

---

# 📂 Folder Structure

```
project/
│
├── client/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── assets/
│
├── server/
│   ├── routes/
│   ├── services/
│   ├── prompts/
│   └── server.ts
│
├── shared/
│
├── dist/
│
├── .env
│
├── package.json
│
└── README.md
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/teachable-machine-ai.git

cd teachable-machine-ai
```

---

## Install Dependencies

```bash
npm install
```

---

## Configure Environment Variables

Create a `.env` file.

```env
GEMINI_API_KEY=YOUR_API_KEY
```

---

## Start Development Server

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

# 🚀 Production Build

Build

```bash
npm run build
```

Run

```bash
npm start
```

---

# 💡 Example Workflow

### Step 1

Create Labels

```
Cat
Dog
Horse
```

---

### Step 2

Upload example images.

---

### Step 3

Click **Train Model**

(The application organizes examples into Few-Shot prompts.)

---

### Step 4

Upload a new image.

---

### Step 5

Receive:

```
Prediction

Dog

Confidence

96%

Reason

The uploaded image shares visual characteristics with the Dog examples.
```

---

# 🎯 Why This Project?

Unlike traditional ML applications that require datasets and model training, this project demonstrates how **Large Language Models can adapt to new tasks using only user-provided examples**.

Key strengths:

* AI-powered classification
* Few-Shot Learning
* Prompt Engineering
* Secure Backend API
* Full-Stack Development
* Interactive UI/UX
* Image & Text Processing
* Scalable Architecture

---

# 📚 Learning Outcomes

Through this project, I gained hands-on experience with:

* Full-Stack Web Development
* Prompt Engineering
* Few-Shot Learning
* Google Gemini API Integration
* Express API Development
* TypeScript
* React State Management
* Secure API Handling
* Structured JSON Validation
* Interactive AI Application Design

---

# 🔮 Future Enhancements

* User Authentication
* Saved Projects
* Database Integration
* Model History
* Project Sharing
* Export Training Data
* Real TensorFlow.js Training Mode
* Custom Vision Models
* Audio Classification
* Speech Recognition
* Drag-and-Drop Dataset Builder
* Multi-label Classification

---


---

## 👨‍💻 Author

**Sumit Joon**

GitHub: [https://github.com/yourusername](https://github.com/SumitJoon47)

LinkedIn: [https://linkedin.com/in/yourprofile](https://www.linkedin.com/in/sumit-joon-5413b228b/)

Email: [joonsumit18@gmail.com](mailto:joonsumit18@gmail.com)

---

⭐ If you found this project useful, consider giving it a star!

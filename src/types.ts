/**
 * Types and interfaces for the Teachable Machine application.
 */

export type ProjectMode = 'text' | 'image';

export interface TrainingExample {
  id: string;
  type: 'text' | 'image';
  value: string; // Plain text or base64 data URL
  createdAt: number;
}

export interface ClassData {
  id: string;
  name: string;
  examples: TrainingExample[];
}

export interface ClassPrediction {
  className: string;
  confidence: number; // Percentage: 0 - 100
}

export interface PredictionResult {
  predictedClass: string;
  confidenceScores: ClassPrediction[];
  reasoning: string;
}

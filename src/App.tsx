import React, { useState } from 'react';
import { Cpu, RotateCcw, Plus, Sparkles, BookOpen, AlertCircle, HelpCircle, FileText, Image as ImageIcon, HelpCircle as HelpIcon } from 'lucide-react';
import { ProjectMode, ClassData, PredictionResult } from './types';
import ClassCard from './components/ClassCard';
import TrainingVisualizer from './components/TrainingVisualizer';
import PreviewSection from './components/PreviewSection';
import { TEXT_PRESETS, generateShapeDataUrl } from './utils';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

export default function App() {
  const [mode, setMode] = useState<ProjectMode>('text');
  
  // Custom classes for text classification
  const [textClasses, setTextClasses] = useState<ClassData[]>([
    { id: generateId(), name: 'Positive Sentiment', examples: [] },
    { id: generateId(), name: 'Negative Sentiment', examples: [] }
  ]);

  // Custom classes for image classification
  const [imageClasses, setImageClasses] = useState<ClassData[]>([
    { id: generateId(), name: 'Circle Drawings', examples: [] },
    { id: generateId(), name: 'Square Drawings', examples: [] }
  ]);

  const [isTrained, setIsTrained] = useState(false);
  const [isTrainingActive, setIsTrainingActive] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Active classes based on selected mode
  const classes = mode === 'text' ? textClasses : imageClasses;
  const setClasses = mode === 'text' ? setTextClasses : setImageClasses;

  // Change project mode
  const handleModeChange = (newMode: ProjectMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setIsTrained(false);
    setAlertMessage(null);
  };

  // Add a new empty class
  const handleAddClass = () => {
    const defaultName = mode === 'text' 
      ? `Class ${classes.length + 1}` 
      : `Class ${classes.length + 1}`;
    
    const newClass: ClassData = {
      id: generateId(),
      name: defaultName,
      examples: []
    };
    setClasses([...classes, newClass]);
    setIsTrained(false);
  };

  // Delete a class
  const handleDeleteClass = (id: string) => {
    if (classes.length <= 2) {
      setAlertMessage({ type: 'error', text: 'Classification requires at least 2 classes.' });
      return;
    }
    setClasses(classes.filter((c) => c.id !== id));
    setIsTrained(false);
  };

  // Update a class name
  const handleUpdateClassName = (id: string, newName: string) => {
    setClasses(
      classes.map((c) => (c.id === id ? { ...c, name: newName } : c))
    );
    setIsTrained(false);
  };

  // Add a training example to a class
  const handleAddExample = (classId: string, value: string) => {
    setClasses(
      classes.map((c) => {
        if (c.id === classId) {
          return {
            ...c,
            examples: [
              ...c.examples,
              {
                id: generateId(),
                type: mode,
                value,
                createdAt: Date.now()
              }
            ]
          };
        }
        return c;
      })
    );
    setIsTrained(false);
  };

  // Remove a training example from a class
  const handleRemoveExample = (classId: string, exampleId: string) => {
    setClasses(
      classes.map((c) => {
        if (c.id === classId) {
          return {
            ...c,
            examples: c.examples.filter((e) => e.id !== exampleId)
          };
        }
        return c;
      })
    );
    setIsTrained(false);
  };

  // Reset current project back to default state
  const handleResetProject = () => {
    setIsTrained(false);
    setAlertMessage(null);
    if (mode === 'text') {
      setTextClasses([
        { id: generateId(), name: 'Positive Sentiment', examples: [] },
        { id: generateId(), name: 'Negative Sentiment', examples: [] }
      ]);
    } else {
      setImageClasses([
        { id: generateId(), name: 'Circle Drawings', examples: [] },
        { id: generateId(), name: 'Square Drawings', examples: [] }
      ]);
    }
  };

  // Load a text preset dataset
  const handleLoadTextPreset = (presetKey: 'sentiment' | 'urgency' | 'topics') => {
    const data = TEXT_PRESETS[presetKey];
    const loadedClasses: ClassData[] = data.classes.map((cls) => ({
      id: generateId(),
      name: cls.name,
      examples: cls.examples.map((ex) => ({
        id: generateId(),
        type: 'text',
        value: ex,
        createdAt: Date.now()
      }))
    }));
    setTextClasses(loadedClasses);
    setIsTrained(false);
    setAlertMessage({ type: 'success', text: `Loaded "${data.name}" training dataset!` });
  };

  // Load programmatic shape preset (circles vs squares)
  const handleLoadShapePreset = () => {
    const loadedClasses: ClassData[] = [
      {
        id: generateId(),
        name: 'Circles',
        examples: Array.from({ length: 5 }).map((_, idx) => ({
          id: generateId(),
          type: 'image',
          value: generateShapeDataUrl('circle', idx),
          createdAt: Date.now()
        }))
      },
      {
        id: generateId(),
        name: 'Squares',
        examples: Array.from({ length: 5 }).map((_, idx) => ({
          id: generateId(),
          type: 'image',
          value: generateShapeDataUrl('square', idx),
          createdAt: Date.now()
        }))
      }
    ];
    setImageClasses(loadedClasses);
    setIsTrained(false);
    setAlertMessage({ type: 'success', text: 'Loaded Shapes training dataset (programmatically drawn circles & squares)!' });
  };

  // Train action - validates then triggers neural net animation
  const handleTrainModel = () => {
    setAlertMessage(null);
    // Validation checks
    const hasEmptyClasses = classes.some((c) => c.examples.length === 0);
    if (hasEmptyClasses) {
      setAlertMessage({ type: 'error', text: 'All classes must have at least one training example to initiate training.' });
      return;
    }
    
    // Warn if too few examples
    const totalExamples = classes.reduce((sum, c) => sum + c.examples.length, 0);
    if (totalExamples < 4) {
      setAlertMessage({ type: 'error', text: 'Please add more examples across classes for meaningful classification (recommend at least 2 per class).' });
      return;
    }

    setIsTrainingActive(true);
  };

  // Callback when simulated training visualizer finishes
  const handleTrainingCompleted = () => {
    setIsTrainingActive(false);
    setIsTrained(true);
    setAlertMessage({ type: 'success', text: 'Neural model compiled successfully! Scroll down to the Preview section to test.' });
  };

  // Backend API Call: Classify Text
  const handleClassifyText = async (text: string): Promise<PredictionResult> => {
    const formattedClasses = textClasses.map((c) => ({
      name: c.name,
      examples: c.examples.map((e) => e.value)
    }));

    const response = await fetch('/api/classify-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        classes: formattedClasses,
        testInput: text
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Server classification endpoint failed.');
    }

    return await response.json();
  };

  // Backend API Call: Classify Image
  const handleClassifyImage = async (base64Image: string): Promise<PredictionResult> => {
    const formattedClasses = imageClasses.map((c) => ({
      name: c.name,
      examples: c.examples.map((e) => e.value)
    }));

    const response = await fetch('/api/classify-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        classes: formattedClasses,
        testImage: base64Image
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Server classification endpoint failed.');
    }

    return await response.json();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-12 antialiased">
      {/* Top Header Section */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-md">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 id="app-main-title" className="text-lg font-bold tracking-tight text-gray-900">Teachable Machine</h1>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider font-mono">In-Browser AI Learning Lab</p>
            </div>
          </div>

          {/* Core mode triggers */}
          <div className="flex bg-gray-100/80 p-1 rounded-xl border border-gray-200/50">
            <button
              type="button"
              id="mode-tab-text"
              onClick={() => handleModeChange('text')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'text'
                  ? 'bg-white shadow-sm text-emerald-700'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Text Classifier
            </button>
            <button
              type="button"
              id="mode-tab-image"
              onClick={() => handleModeChange('image')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'image'
                  ? 'bg-white shadow-sm text-emerald-700'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Image Classifier
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex flex-col gap-8">
        
        {/* Sub-Header Tutorial & Quick Preset Panels */}
        <section id="intro-tutorial-card" className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_45%)]" />
          
          <div className="relative z-10 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-700/60 px-2.5 py-0.5 rounded-full border border-emerald-600/30 text-emerald-300">
                AI Powered Few-Shot Classifier
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight leading-tight">
              Teach a machine to classify {mode === 'text' ? 'text patterns' : 'shapes & camera frames'}.
            </h2>
            <p className="text-sm text-emerald-100/80 max-w-xl mt-2 leading-relaxed">
              Define your labels, gather sample examples, compile the weights, and instantly inspect predictions and confidence outputs!
            </p>
          </div>

          {/* Quick presets trigger widget */}
          <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl w-full md:w-auto md:min-w-[280px]">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider font-mono flex items-center gap-1 mb-2">
              <Sparkles className="w-3 h-3" /> Quick Demo Datasets
            </span>
            {mode === 'text' ? (
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  id="preset-load-sentiment"
                  onClick={() => handleLoadTextPreset('sentiment')}
                  className="w-full text-left py-1.5 px-3 hover:bg-white/10 rounded-lg text-xs text-white font-medium transition-colors cursor-pointer flex justify-between items-center"
                >
                  <span>Sentiment (Positive vs. Negative)</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 rounded">Demo</span>
                </button>
                <button
                  type="button"
                  id="preset-load-urgency"
                  onClick={() => handleLoadTextPreset('urgency')}
                  className="w-full text-left py-1.5 px-3 hover:bg-white/10 rounded-lg text-xs text-white font-medium transition-colors cursor-pointer flex justify-between items-center"
                >
                  <span>Support Urgency (Urgent vs. Info)</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 rounded">Demo</span>
                </button>
                <button
                  type="button"
                  id="preset-load-topics"
                  onClick={() => handleLoadTextPreset('topics')}
                  className="w-full text-left py-1.5 px-3 hover:bg-white/10 rounded-lg text-xs text-white font-medium transition-colors cursor-pointer flex justify-between items-center"
                >
                  <span>Topics (Tech vs. Cooking)</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 rounded">Demo</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] text-emerald-100/80 mb-1 leading-normal">
                  Generate programmatically simulated variations of circles and squares to test in 1-click!
                </p>
                <button
                  type="button"
                  id="preset-load-shapes"
                  onClick={handleLoadShapePreset}
                  className="w-full text-center py-2 px-3 bg-white hover:bg-slate-50 text-emerald-950 font-bold rounded-xl text-xs shadow transition-colors cursor-pointer"
                >
                  ⚡ Load Shape Preset Data
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Action Alert Message banner */}
        {alertMessage && (
          <div
            id="status-alert-banner"
            className={`p-4 rounded-2xl flex gap-3 text-sm font-medium border animate-in slide-in-from-top-3 ${
              alertMessage.type === 'error'
                ? 'bg-red-50 border-red-100 text-red-800'
                : 'bg-emerald-50 border-emerald-100 text-emerald-900'
            }`}
          >
            <AlertCircle className={`w-5 h-5 flex-shrink-0 ${alertMessage.type === 'error' ? 'text-red-500' : 'text-emerald-600'}`} />
            <div className="flex-1">{alertMessage.text}</div>
            <button
              type="button"
              id="clear-alert-btn"
              onClick={() => setAlertMessage(null)}
              className="text-gray-400 hover:text-gray-600 font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Section 1: Define Classes & Examples (Training stage) */}
        <section id="dataset-definition-section" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-800">1. Define Classes & Gather Examples</h2>
              <p className="text-xs text-gray-500 mt-0.5">Renaming classes, adding text inputs or drawing/webcam captures.</p>
            </div>

            {/* General Project controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="add-class-button"
                onClick={handleAddClass}
                className="px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-gray-500" /> Add Label/Class
              </button>
              
              <button
                type="button"
                id="reset-project-button"
                onClick={handleResetProject}
                className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-600 hover:text-red-600 text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                title="Reset classes and training examples"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Project
              </button>
            </div>
          </div>

          {/* Grid Layout of Class Cards */}
          <div 
            id="classes-grid-layout"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {classes.map((cls) => (
              <ClassCard
                key={cls.id}
                classData={cls}
                mode={mode}
                onUpdateClassName={handleUpdateClassName}
                onAddExample={handleAddExample}
                onRemoveExample={handleRemoveExample}
                onDeleteClass={handleDeleteClass}
                canDelete={classes.length > 2}
              />
            ))}
          </div>
        </section>

        {/* Section 2: Compile & Train Model (Activation panel) */}
        <section id="model-training-section" className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="p-3.5 bg-slate-100 rounded-2xl text-slate-700 hidden sm:block">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">2. Train the Few-Shot Classifier</h3>
              <p className="text-xs text-gray-500 leading-normal mt-0.5">
                Compiles the examples, initializes weight matrices, and configures the classification layers.
              </p>
              <div className="flex gap-4 mt-2">
                <span className="text-[11px] font-semibold text-gray-500">
                  Total classes: <strong className="text-gray-800">{classes.length}</strong>
                </span>
                <span className="text-[11px] font-semibold text-gray-500">
                  Total examples: <strong className="text-gray-800">
                    {classes.reduce((acc, c) => acc + c.examples.length, 0)}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Big Train Button */}
          <button
            type="button"
            id="trigger-train-model-btn"
            onClick={handleTrainModel}
            className={`px-6 py-3.5 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
              isTrained 
                ? 'bg-white border border-emerald-500 text-emerald-700 hover:bg-emerald-50/20' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Cpu className="w-4 h-4" />
            {isTrained ? 'Retrain Model' : 'Train Model'}
          </button>
        </section>

        {/* Section 3: Preview/Evaluate (Locked by default, opens on completion) */}
        <section id="model-preview-section">
          <PreviewSection
            mode={mode}
            classes={classes}
            isTrained={isTrained}
            onClassifyText={handleClassifyText}
            onClassifyImage={handleClassifyImage}
          />
        </section>

      </main>

      {/* Interactive Modal: Neural Network Training Dashboard */}
      <TrainingVisualizer
        isTraining={isTrainingActive}
        classes={classes}
        onComplete={handleTrainingCompleted}
      />
    </div>
  );
}

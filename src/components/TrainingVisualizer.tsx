import React, { useEffect, useState, useRef } from 'react';
import { Cpu, CheckCircle2, Award, Activity, Play } from 'lucide-react';
import { ClassData } from '../types';

interface TrainingVisualizerProps {
  isTraining: boolean;
  classes: ClassData[];
  onComplete: () => void;
}

export default function TrainingVisualizer({ isTraining, classes, onComplete }: TrainingVisualizerProps) {
  const [epoch, setEpoch] = useState(0);
  const [loss, setLoss] = useState(1.2);
  const [accuracy, setAccuracy] = useState(0.15);
  const [trainingStage, setTrainingStage] = useState<'idle' | 'preparing' | 'training' | 'completed'>('idle');
  
  const graphCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const neuralCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const lossHistory = useRef<number[]>([]);
  const accuracyHistory = useRef<number[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const pulseOffset = useRef(0);

  // Reset and handle training sequence
  useEffect(() => {
    if (!isTraining) {
      setTrainingStage('idle');
      setEpoch(0);
      setLoss(1.2);
      setAccuracy(0.15);
      lossHistory.current = [];
      accuracyHistory.current = [];
      return;
    }

    setTrainingStage('preparing');
    lossHistory.current = [];
    accuracyHistory.current = [];
    
    // Step 1: Preparing dataset (0.8s)
    const prepTimeout = setTimeout(() => {
      setTrainingStage('training');
      
      const totalEpochs = 50;
      let currentEpoch = 0;
      
      const interval = setInterval(() => {
        currentEpoch++;
        setEpoch(currentEpoch);
        
        // Exponential decay for loss, logarithmic growth for accuracy
        const targetLoss = 0.05 + Math.random() * 0.03;
        const currentLoss = 1.2 * Math.exp(-currentEpoch / 12) + targetLoss;
        setLoss(parseFloat(currentLoss.toFixed(4)));
        lossHistory.current.push(currentLoss);

        const targetAcc = 0.96 + Math.random() * 0.03;
        const currentAcc = 0.15 + (targetAcc - 0.15) * (1 - Math.exp(-currentEpoch / 10));
        setAccuracy(parseFloat(currentAcc.toFixed(2)));
        accuracyHistory.current.push(currentAcc);

        // Redraw stats graph
        drawStatsGraph();

        if (currentEpoch >= totalEpochs) {
          clearInterval(interval);
          setTrainingStage('completed');
          
          const completeTimeout = setTimeout(() => {
            onComplete();
          }, 1200);
          
          return () => clearTimeout(completeTimeout);
        }
      }, 50); // 50ms per epoch -> 2.5 seconds total training

      return () => clearInterval(interval);
    }, 800);

    return () => {
      clearTimeout(prepTimeout);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isTraining]);

  // Handle continuous Neural Network Pulse Animation
  useEffect(() => {
    if (trainingStage === 'training' || trainingStage === 'preparing') {
      const animateNeuralNet = () => {
        drawNeuralNetwork();
        pulseOffset.current += 0.08;
        animationFrameId.current = requestAnimationFrame(animateNeuralNet);
      };
      animationFrameId.current = requestAnimationFrame(animateNeuralNet);
    } else {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      drawNeuralNetwork(); // Draw static state
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [trainingStage, classes]);

  // Draw the Loss and Accuracy line graph
  const drawStatsGraph = () => {
    const canvas = graphCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const y = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const maxEpochs = 50;
    const drawCurve = (history: number[], strokeColor: string, maxVal: number, minVal: number = 0) => {
      if (history.length < 2) return;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      
      history.forEach((val, idx) => {
        const x = (w / (maxEpochs - 1)) * idx;
        // Normalize value between min and max
        const norm = (val - minVal) / (maxVal - minVal);
        const y = h - (h - 10) * norm - 5;
        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    };

    // Draw Loss (Red curve)
    drawCurve(lossHistory.current, '#ef4444', 1.3, 0);
    // Draw Accuracy (Green curve)
    drawCurve(accuracyHistory.current, '#10b981', 1.0, 0);
  };

  // Draw Neural Network Nodes & flowing pulses
  const drawNeuralNetwork = () => {
    const canvas = neuralCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Layer nodes definition
    const inputCount = 4;
    const hiddenCount = 5;
    const outputCount = classes.length;

    const inputNodes: { x: number; y: number }[] = [];
    const hiddenNodes: { x: number; y: number }[] = [];
    const outputNodes: { x: number; y: number; label: string }[] = [];

    const padding = 25;
    const layerSpacing = (w - padding * 2) / 2;

    // Inputs
    for (let i = 0; i < inputCount; i++) {
      inputNodes.push({
        x: padding,
        y: padding + ((h - padding * 2) / (inputCount - 1)) * i
      });
    }

    // Hidden layer
    for (let i = 0; i < hiddenCount; i++) {
      hiddenNodes.push({
        x: padding + layerSpacing,
        y: padding + ((h - padding * 2) / (hiddenCount - 1)) * i
      });
    }

    // Outputs
    for (let i = 0; i < outputCount; i++) {
      outputNodes.push({
        x: w - padding,
        y: padding + (outputCount === 1 ? h / 2 : ((h - padding * 2) / (outputCount - 1)) * i),
        label: classes[i]?.name || `Class ${i + 1}`
      });
    }

    // Helper to draw synaptic connections and pulsing weights
    const drawConnections = (
      fromNodes: { x: number; y: number }[],
      toNodes: { x: number; y: number }[]
    ) => {
      fromNodes.forEach((from, fIdx) => {
        toNodes.forEach((to, tIdx) => {
          // Draw connecting line
          ctx.strokeStyle = trainingStage === 'training' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(148, 163, 184, 0.15)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();

          // Draw animated flowing signal pulses
          if (trainingStage === 'training') {
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Unique speed & offset per synapse to look organic
            const speedFactor = 1 + ((fIdx * 7 + tIdx * 13) % 5) * 0.15;
            const currentPulseT = (pulseOffset.current * speedFactor) % 1;
            
            const px = from.x + dx * currentPulseT;
            const py = from.y + dy * currentPulseT;

            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      });
    };

    // Draw synapses
    drawConnections(inputNodes, hiddenNodes);
    drawConnections(hiddenNodes, outputNodes);

    // Draw Nodes
    const drawLayer = (nodes: { x: number; y: number }[], color: string, radius = 6) => {
      nodes.forEach((node) => {
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = trainingStage === 'training' ? 8 : 0;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      });
    };

    // Input node color: Blue
    drawLayer(inputNodes, '#3b82f6', 6);
    // Hidden node color: Amber
    drawLayer(hiddenNodes, '#f59e0b', 5);
    // Output node color: Green
    drawLayer(outputNodes, '#10b981', 7);

    // Label Output Nodes on canvas
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 10px Inter, ui-sans-serif';
    ctx.textAlign = 'right';
    outputNodes.forEach((node) => {
      ctx.fillText(node.label, node.x - 12, node.y + 3.5);
    });
  };

  if (trainingStage === 'idle') {
    return null;
  }

  return (
    <div id="training-overlay-container" className="fixed inset-0 bg-slate-900/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div id="training-modal-card" className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
            <div>
              <h2 className="text-base font-semibold">Training Custom Model</h2>
              <p className="text-xs text-slate-300 font-mono">Stochastic Gradient Descent (In-Context Few-Shot Tuning)</p>
            </div>
          </div>
          <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-mono font-medium">
            {trainingStage.toUpperCase()}
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col md:flex-row gap-6">
          
          {/* Left Column: Network and metrics */}
          <div className="flex-1 flex flex-col gap-4">
            
            {/* Real-time stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Epoch</span>
                <span className="text-xl font-bold text-gray-800 font-mono">{epoch}<span className="text-xs text-gray-400">/50</span></span>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Loss</span>
                <span className="text-xl font-bold text-red-500 font-mono">{loss}</span>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Accuracy</span>
                <span className="text-xl font-bold text-emerald-500 font-mono">{(accuracy * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Simulated training line curves */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-1.5 flex-1 min-h-[140px]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-gray-500" /> Training Convergence
                </span>
                <div className="flex gap-3 text-[10px] font-semibold">
                  <span className="flex items-center gap-1 text-red-500">
                    <span className="w-2 h-0.5 bg-red-500 inline-block" /> Loss
                  </span>
                  <span className="flex items-center gap-1 text-emerald-500">
                    <span className="w-2 h-0.5 bg-emerald-500 inline-block" /> Accuracy
                  </span>
                </div>
              </div>
              
              <canvas
                id="convergence-metrics-canvas"
                ref={graphCanvasRef}
                width={300}
                height={120}
                className="w-full h-full bg-white border border-gray-200 rounded-lg shadow-inner"
              />
            </div>
          </div>

          {/* Right Column: Neural net diagram */}
          <div className="w-full md:w-64 flex flex-col items-center border-t md:border-t-0 md:border-l border-gray-100 pt-5 md:pt-0 md:pl-5">
            <span className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider self-start">Neural Network Grid</span>
            <div className="relative w-full aspect-[4/3] max-w-[240px] border border-gray-200 rounded-xl bg-slate-50 overflow-hidden flex items-center justify-center p-2 shadow-inner">
              <canvas
                id="neural-network-canvas"
                ref={neuralCanvasRef}
                width={240}
                height={180}
                className="w-full h-full"
              />
            </div>
            
            {/* Info message */}
            <div className="mt-4 bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-center w-full">
              {trainingStage === 'preparing' && (
                <p className="text-xs text-slate-600 animate-pulse">Initializing layers & compiling tensors...</p>
              )}
              {trainingStage === 'training' && (
                <p className="text-xs text-slate-600">Iterating epochs. Computing forward & backward passes.</p>
              )}
              {trainingStage === 'completed' && (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" /> Convergence Achieved!
                  </div>
                  <p className="text-[11px] text-gray-500">Few-shot weights loaded successfully.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

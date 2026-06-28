import React, { useState, useRef, useEffect } from 'react';
import { Play, Sparkles, Upload, Camera, Paintbrush, HelpCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { ClassData, PredictionResult, ClassPrediction } from '../types';
import DrawingCanvas from './DrawingCanvas';

interface PreviewSectionProps {
  mode: 'text' | 'image';
  classes: ClassData[];
  isTrained: boolean;
  onClassifyText: (text: string) => Promise<PredictionResult>;
  onClassifyImage: (base64Image: string) => Promise<PredictionResult>;
}

export default function PreviewSection({
  mode,
  classes,
  isTrained,
  onClassifyText,
  onClassifyImage
}: PreviewSectionProps) {
  const [textVal, setTextVal] = useState('');
  
  // Image input methods: 'upload' | 'webcam' | 'draw'
  const [imgMethod, setImgMethod] = useState<'upload' | 'webcam' | 'draw'>('upload');
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  
  // Webcam state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Evaluation States
  const [isClassifying, setIsClassifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);

  // Stop webcam when component unmounts or method changes
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Restart webcam if method changes
  useEffect(() => {
    if (imgMethod === 'webcam' && isTrained) {
      startWebcam();
    } else {
      stopWebcam();
    }
  }, [imgMethod, isTrained]);

  const startWebcam = async () => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 400, facingMode: 'user' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Webcam preview error:', err);
      setCameraError('Webcam access was denied or is unavailable.');
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          setSelectedImg(event.target.result);
          setResult(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerClassify = async () => {
    setErrorMsg(null);
    setIsClassifying(true);
    
    try {
      if (mode === 'text') {
        if (!textVal.trim()) {
          throw new Error('Please write some text to classify.');
        }
        const res = await onClassifyText(textVal);
        setResult(res);
      } else {
        let imageToClassify = selectedImg;
        
        // If webcam is active, we capture the current frame
        if (imgMethod === 'webcam') {
          const video = videoRef.current;
          if (video && stream) {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 400;
            canvas.height = video.videoHeight || 400;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              imageToClassify = canvas.toDataURL('image/png');
              setSelectedImg(imageToClassify); // save a thumbnail of what we classified
            }
          }
        }

        if (!imageToClassify) {
          throw new Error('Please select, draw, or snap an image to classify.');
        }

        const res = await onClassifyImage(imageToClassify);
        setResult(res);
      }
    } catch (err: any) {
      console.error('Classification error:', err);
      setErrorMsg(err.message || 'An error occurred during classification.');
    } finally {
      setIsClassifying(false);
    }
  };

  // Reset classification fields
  const handleReset = () => {
    setTextVal('');
    setSelectedImg(null);
    setResult(null);
    setErrorMsg(null);
    if (imgMethod === 'webcam') {
      startWebcam();
    }
  };

  return (
    <div id="preview-section-container" className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Section Header */}
      <div className="bg-gray-50/50 px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
          <h2 className="text-lg font-bold text-gray-800">Preview & Evaluate</h2>
        </div>
        {!isTrained && (
          <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-semibold font-mono">
            LOCKED
          </span>
        )}
      </div>

      {/* Conditional Rendering: Locked vs Unlocked */}
      {!isTrained ? (
        <div className="p-8 flex flex-col items-center justify-center text-center flex-1 min-h-[300px] bg-gray-50/30">
          <div className="bg-gray-100 p-4 rounded-full text-gray-400 mb-4 shadow-sm">
            <Play className="w-8 h-8 opacity-60" />
          </div>
          <h3 className="text-base font-bold text-gray-700">Model is not trained yet</h3>
          <p className="text-sm text-gray-400 max-w-sm mt-1">
            Provide at least two custom classes with training examples, then click <strong className="text-emerald-600 font-semibold">Train Model</strong> to unlock live testing!
          </p>
        </div>
      ) : (
        <div className="p-6 flex-1 flex flex-col gap-6 lg:flex-row">
          
          {/* Left Panel: Test Input controls */}
          <div className="flex-1 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Test Input</h3>
            
            {mode === 'text' ? (
              /* TEXT CLASSIFICATION PREVIEW INPUT */
              <div className="flex flex-col gap-3">
                <label htmlFor="test-text-textarea" className="text-xs text-gray-500 font-medium">Type a word, sentence, or article to test:</label>
                <textarea
                  id="test-text-textarea"
                  value={textVal}
                  onChange={(e) => {
                    setTextVal(e.target.value);
                    setResult(null);
                  }}
                  placeholder="e.g., The pizza was cooked perfectly and arrived very hot!"
                  rows={4}
                  className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-gray-700 shadow-inner"
                />
              </div>
            ) : (
              /* IMAGE CLASSIFICATION PREVIEW INPUT */
              <div className="flex flex-col gap-4">
                
                {/* Method Toggles */}
                <div className="flex border border-gray-100 p-1 bg-gray-100/60 rounded-xl gap-1">
                  <button
                    type="button"
                    id="preview-img-method-upload"
                    onClick={() => { setImgMethod('upload'); setSelectedImg(null); setResult(null); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      imgMethod === 'upload' ? 'bg-white shadow text-emerald-700' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" /> File Upload
                  </button>
                  <button
                    type="button"
                    id="preview-img-method-webcam"
                    onClick={() => { setImgMethod('webcam'); setSelectedImg(null); setResult(null); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      imgMethod === 'webcam' ? 'bg-white shadow text-emerald-700' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" /> Live Webcam
                  </button>
                  <button
                    type="button"
                    id="preview-img-method-draw"
                    onClick={() => { setImgMethod('draw'); setSelectedImg(null); setResult(null); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      imgMethod === 'draw' ? 'bg-white shadow text-emerald-700' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Paintbrush className="w-3.5 h-3.5" /> Draw Area
                  </button>
                </div>

                {/* Input Method Content */}
                {imgMethod === 'upload' && (
                  <div className="border border-dashed border-gray-200 rounded-2xl p-6 text-center bg-slate-50 relative min-h-[180px] flex flex-col justify-center items-center">
                    {selectedImg ? (
                      <div className="relative max-h-[140px] max-w-[140px] rounded-lg overflow-hidden border border-gray-200">
                        <img src={selectedImg} alt="Uploaded test" referrerPolicy="no-referrer" className="object-contain w-full h-full max-h-[140px]" />
                        <button
                          type="button"
                          id="clear-test-upload-btn"
                          onClick={() => setSelectedImg(null)}
                          className="absolute top-1 right-1 bg-red-600/95 text-white p-1 rounded-full text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          id="preview-upload-input"
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-xs font-semibold text-gray-600">Select an image file to evaluate</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Drag-and-drop or browse</p>
                      </>
                    )}
                  </div>
                )}

                {imgMethod === 'webcam' && (
                  <div className="flex flex-col items-center bg-slate-50 border border-gray-100 rounded-2xl p-4">
                    {cameraError ? (
                      <p className="text-xs text-red-600 font-semibold p-4 text-center">{cameraError}</p>
                    ) : (
                      <div className="relative aspect-square w-full max-w-[180px] bg-black rounded-xl overflow-hidden shadow border border-gray-300">
                        <video
                          id="preview-webcam-element"
                          ref={videoRef}
                          className="w-full h-full object-cover scale-x-[-1]"
                          playsInline
                          muted
                        />
                        <div className="absolute top-2 left-2 bg-emerald-500 w-3 h-3 rounded-full animate-pulse border border-white" />
                        
                        {/* Overlay if displaying a captured freezeframe thumbnail */}
                        {selectedImg && (
                          <div className="absolute inset-0 bg-white">
                            <img src={selectedImg} alt="Frozen frame" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              id="reset-webcam-unfreeze"
                              onClick={() => { setSelectedImg(null); setResult(null); startWebcam(); }}
                              className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2.5 rounded-full hover:bg-emerald-600 transition-colors cursor-pointer"
                            >
                              Resume Video
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-[11px] text-gray-400 text-center mt-3">
                      {selectedImg ? 'Frame captured!' : 'Position item. It will be snapped when you click Classify.'}
                    </p>
                  </div>
                )}

                {imgMethod === 'draw' && (
                  <div className="flex justify-center">
                    {selectedImg ? (
                      <div className="relative flex flex-col items-center bg-gray-50 border border-gray-100 rounded-2xl p-4 w-full max-w-[240px]">
                        <img src={selectedImg} alt="Drawn test thumbnail" referrerPolicy="no-referrer" className="border border-gray-300 rounded-lg bg-white shadow max-h-[160px] object-contain" />
                        <button
                          type="button"
                          id="reset-draw-canvas"
                          onClick={() => { setSelectedImg(null); setResult(null); }}
                          className="mt-3 text-xs bg-slate-800 text-white hover:bg-emerald-600 font-semibold py-1 px-3 rounded-lg transition-colors cursor-pointer"
                        >
                          Redraw
                        </button>
                      </div>
                    ) : (
                      <DrawingCanvas
                        onCapture={(base64) => {
                          setSelectedImg(base64);
                          setResult(null);
                        }}
                        width={220}
                        height={220}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Error prompt */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2 text-red-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            {/* Evaluation Action Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                id="preview-classify-btn"
                onClick={triggerClassify}
                disabled={isClassifying}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500/50 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                {isClassifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Classifying...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" /> Classify Test Input
                  </>
                )}
              </button>

              {(textVal || selectedImg || result) && (
                <button
                  type="button"
                  id="preview-reset-btn"
                  onClick={handleReset}
                  className="px-4 py-3 border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-800 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  title="Clear evaluation"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Right Panel: Class confidence bars & explanations */}
          <div className="w-full lg:w-72 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-gray-100 pt-5 lg:pt-0 lg:pl-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Outputs & Analysis</h3>
            
            {/* Confidence progress list */}
            <div className="flex flex-col gap-4 flex-1">
              {classes.map((c) => {
                // Determine confidence for this class
                let score = 0;
                let isWinner = false;

                if (result) {
                  const match = result.confidenceScores.find(
                    (item) => item.className.toLowerCase() === c.name.toLowerCase()
                  );
                  score = match ? Math.round(match.confidence) : 0;
                  isWinner = result.predictedClass.toLowerCase() === c.name.toLowerCase();
                }

                return (
                  <div
                    key={c.id}
                    className={`p-3.5 border rounded-2xl transition-all ${
                      isWinner
                        ? 'bg-emerald-50/50 border-emerald-300 shadow-sm ring-2 ring-emerald-500/10'
                        : 'bg-white border-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`text-xs font-bold truncate ${isWinner ? 'text-emerald-800' : 'text-gray-700'}`}>
                        {c.name} {isWinner && '🏆'}
                      </span>
                      <span className={`text-xs font-extrabold font-mono ${isWinner ? 'text-emerald-700' : 'text-gray-500'}`}>
                        {score}%
                      </span>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${
                          isWinner ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* No prediction evaluated placeholder */}
              {!result && !isClassifying && (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-gray-100 rounded-2xl p-6 text-center text-gray-400 bg-gray-50/30 min-h-[140px]">
                  <HelpCircle className="w-6 h-6 text-gray-300 mb-1" />
                  <p className="text-xs">Pending input classification...</p>
                </div>
              )}

              {/* Loading spinner */}
              {isClassifying && (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-emerald-100 rounded-2xl p-6 text-center text-emerald-600 bg-emerald-50/20 min-h-[140px] animate-pulse">
                  <RefreshCw className="w-6 h-6 animate-spin mb-2" />
                  <p className="text-xs font-semibold">Running few-shot inference...</p>
                  <p className="text-[10px] text-emerald-500 mt-1">Comparing sample against training layers</p>
                </div>
              )}

              {/* Classification explanation reasoning from Gemini */}
              {result && !isClassifying && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Model Explanation</span>
                  <p className="text-xs text-gray-600 leading-relaxed mt-1">{result.reasoning}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

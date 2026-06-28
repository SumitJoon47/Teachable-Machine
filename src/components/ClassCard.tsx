import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Edit2, Check, Upload, Camera, Paintbrush, Plus, HelpCircle, RefreshCw } from 'lucide-react';
import { ClassData, TrainingExample } from '../types';
import DrawingCanvas from './DrawingCanvas';
import { generateShapeDataUrl } from '../utils';

interface ClassCardProps {
  key?: string;
  classData: ClassData;
  mode: 'text' | 'image';
  onUpdateClassName: (id: string, newName: string) => void;
  onAddExample: (classId: string, value: string) => void;
  onRemoveExample: (classId: string, exampleId: string) => void;
  onDeleteClass: (id: string) => void;
  canDelete: boolean;
}

export default function ClassCard({
  classData,
  mode,
  onUpdateClassName,
  onAddExample,
  onRemoveExample,
  onDeleteClass,
  canDelete
}: ClassCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(classData.name);
  const [textInput, setTextInput] = useState('');
  
  // Image adding methods: 'none' | 'upload' | 'webcam' | 'draw' | 'presets'
  const [activeMethod, setActiveMethod] = useState<'none' | 'upload' | 'webcam' | 'draw' | 'presets'>('none');
  
  // Webcam state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    setTempName(classData.name);
  }, [classData.name]);

  // Clean up webcam stream when component unmounts or method changes
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Handle webcam toggle
  const startWebcam = async () => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 320, facingMode: 'user' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Error opening webcam:', err);
      setCameraError('Could not access webcam. Please check permissions.');
      setActiveMethod('upload'); // fallback
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleMethodChange = (method: 'none' | 'upload' | 'webcam' | 'draw' | 'presets') => {
    stopWebcam();
    if (method === 'webcam') {
      setActiveMethod('webcam');
      // Delay slightly to allow element to mount before starting
      setTimeout(() => startWebcam(), 100);
    } else {
      setActiveMethod(method);
    }
  };

  // Capture image from webcam video stream
  const captureWebcamPhoto = () => {
    const video = videoRef.current;
    if (video && stream) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 320;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the current video frame on canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        onAddExample(classData.id, dataUrl);
      }
    }
  };

  // Save changes to class name
  const saveName = () => {
    const trimmed = tempName.trim();
    if (trimmed) {
      onUpdateClassName(classData.id, trimmed);
    } else {
      setTempName(classData.name);
    }
    setIsEditingName(false);
  };

  // Add text example
  const handleAddText = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = textInput.trim();
    if (trimmed) {
      onAddExample(classData.id, trimmed);
      setTextInput('');
    }
  };

  // Handle uploaded files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((f) => {
        const file = f as File;
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result && typeof event.target.result === 'string') {
            onAddExample(classData.id, event.target.result);
          }
        };
        reader.readAsDataURL(file);
      });
      // Clear file selection to allow selecting the same file again
      e.target.value = '';
    }
  };

  // Programmatically generate shapes for quick presets
  const loadShapePreset = (shape: 'circle' | 'square' | 'triangle' | 'star' | 'cross') => {
    const startCount = classData.examples.length;
    for (let i = 0; i < 5; i++) {
      const base64 = generateShapeDataUrl(shape, startCount + i);
      onAddExample(classData.id, base64);
    }
    setActiveMethod('none');
  };

  return (
    <div id={`class-card-${classData.id}`} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full">
      {/* Card Header: Class name and delete class */}
      <div className="bg-gray-50/50 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 mr-4">
          {isEditingName ? (
            <div className="flex items-center gap-1 w-full">
              <input
                id={`class-name-input-${classData.id}`}
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                className="w-full px-2.5 py-1 text-sm font-semibold text-gray-800 bg-white border border-emerald-500 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                autoFocus
              />
              <button
                type="button"
                id={`class-name-save-${classData.id}`}
                onClick={saveName}
                className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-md transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group max-w-full">
              <h3 className="text-base font-semibold text-gray-800 truncate" title={classData.name}>
                {classData.name}
              </h3>
              <button
                type="button"
                id={`class-name-edit-${classData.id}`}
                onClick={() => setIsEditingName(true)}
                className="p-1 text-gray-400 hover:text-emerald-600 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                title="Rename class"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Delete Class Button */}
        {canDelete && (
          <button
            type="button"
            id={`class-delete-btn-${classData.id}`}
            onClick={() => onDeleteClass(classData.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete this class"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Card Body */}
      <div className="p-5 flex-1 flex flex-col gap-4">
        {/* Class status & stats */}
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            {classData.examples.length} example{classData.examples.length !== 1 ? 's' : ''}
          </span>
          {classData.examples.length < 3 && (
            <span className="text-[11px] text-amber-600 flex items-center gap-1 font-medium">
              <HelpCircle className="w-3.5 h-3.5" /> Recommend ≥3 examples
            </span>
          )}
        </div>

        {/* Input adding panels */}
        {mode === 'text' ? (
          /* TEXT MODE INPUT */
          <form onSubmit={handleAddText} className="flex gap-2">
            <input
              id={`text-example-input-${classData.id}`}
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter a training sentence..."
              className="flex-1 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              id={`text-example-add-${classData.id}`}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </form>
        ) : (
          /* IMAGE MODE INPUT SELECTOR & BOXES */
          <div className="flex flex-col gap-3">
            {activeMethod === 'none' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id={`method-upload-${classData.id}`}
                  onClick={() => handleMethodChange('upload')}
                  className="flex flex-col items-center justify-center p-3 border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-xl text-center transition-all cursor-pointer group"
                >
                  <Upload className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 mb-1" />
                  <span className="text-xs font-medium text-gray-700 group-hover:text-emerald-700">Upload Files</span>
                </button>

                <button
                  type="button"
                  id={`method-webcam-${classData.id}`}
                  onClick={() => handleMethodChange('webcam')}
                  className="flex flex-col items-center justify-center p-3 border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-xl text-center transition-all cursor-pointer group"
                >
                  <Camera className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 mb-1" />
                  <span className="text-xs font-medium text-gray-700 group-hover:text-emerald-700">Webcam</span>
                </button>

                <button
                  type="button"
                  id={`method-draw-${classData.id}`}
                  onClick={() => handleMethodChange('draw')}
                  className="flex flex-col items-center justify-center p-3 border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-xl text-center transition-all cursor-pointer group"
                >
                  <Paintbrush className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 mb-1" />
                  <span className="text-xs font-medium text-gray-700 group-hover:text-emerald-700">Draw Sketch</span>
                </button>

                <button
                  type="button"
                  id={`method-presets-${classData.id}`}
                  onClick={() => handleMethodChange('presets')}
                  className="flex flex-col items-center justify-center p-3 border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-xl text-center transition-all cursor-pointer group"
                >
                  <RefreshCw className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 mb-1" />
                  <span className="text-xs font-medium text-gray-700 group-hover:text-emerald-700">Preset Shapes</span>
                </button>
              </div>
            )}

            {/* active method components */}
            {activeMethod === 'upload' && (
              <div className="border border-dashed border-gray-300 rounded-xl p-4 text-center bg-gray-50/50 hover:bg-gray-50 hover:border-emerald-400 transition-colors relative">
                <input
                  id={`file-upload-input-${classData.id}`}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1.5" />
                <p className="text-xs font-medium text-gray-700">Drag images or click to browse</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Supports PNG, JPG, GIF</p>
                <button
                  type="button"
                  id={`cancel-upload-${classData.id}`}
                  onClick={() => setActiveMethod('none')}
                  className="mt-2.5 text-xs text-emerald-600 hover:underline font-medium relative z-10 cursor-pointer"
                >
                  Back to methods
                </button>
              </div>
            )}

            {activeMethod === 'webcam' && (
              <div className="flex flex-col items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
                {cameraError ? (
                  <p className="text-xs text-red-600 text-center font-medium">{cameraError}</p>
                ) : (
                  <div className="relative aspect-square w-full max-w-[180px] bg-black rounded-lg overflow-hidden border border-gray-300">
                    <video
                      id={`webcam-video-${classData.id}`}
                      ref={videoRef}
                      className="w-full h-full object-cover scale-x-[-1]"
                      playsInline
                      muted
                    />
                    <div className="absolute top-1.5 left-1.5 bg-red-500 w-2.5 h-2.5 rounded-full animate-pulse" />
                  </div>
                )}
                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    id={`webcam-snap-btn-${classData.id}`}
                    onClick={captureWebcamPhoto}
                    disabled={!!cameraError}
                    className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow transition-colors cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Camera className="w-3.5 h-3.5" /> Snap Photo
                  </button>
                  <button
                    type="button"
                    id={`webcam-stop-btn-${classData.id}`}
                    onClick={() => handleMethodChange('none')}
                    className="py-1.5 px-2.5 border border-gray-200 hover:bg-gray-100 rounded-lg text-xs font-medium transition-colors cursor-pointer text-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {activeMethod === 'draw' && (
              <div className="w-full">
                <DrawingCanvas
                  onCapture={(base64) => {
                    onAddExample(classData.id, base64);
                    setActiveMethod('none');
                  }}
                  width={200}
                  height={200}
                />
                <button
                  type="button"
                  id={`cancel-draw-${classData.id}`}
                  onClick={() => setActiveMethod('none')}
                  className="mt-2 w-full text-center text-xs text-gray-500 hover:text-emerald-600 font-medium cursor-pointer"
                >
                  Cancel Drawing
                </button>
              </div>
            )}

            {activeMethod === 'presets' && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-2.5">
                <span className="text-xs font-medium text-gray-600">Select programmatic preset shape:</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'circle', label: 'Circles' },
                    { key: 'square', label: 'Squares' },
                    { key: 'triangle', label: 'Triangles' },
                    { key: 'star', label: 'Stars' },
                    { key: 'cross', label: 'Crosses' }
                  ].map((shape) => (
                    <button
                      key={shape.key}
                      type="button"
                      id={`preset-shape-${shape.key}-${classData.id}`}
                      onClick={() => loadShapePreset(shape.key as any)}
                      className="py-1.5 px-2.5 bg-white border border-gray-200 hover:border-emerald-500 rounded-lg text-xs text-gray-700 font-medium hover:text-emerald-700 transition-colors cursor-pointer text-center"
                    >
                      +5 {shape.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  id={`cancel-presets-${classData.id}`}
                  onClick={() => setActiveMethod('none')}
                  className="mt-1 text-center text-xs text-gray-500 hover:text-emerald-600 font-medium cursor-pointer"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        )}

        {/* Examples Grid View */}
        <div className="flex-1 mt-2">
          {classData.examples.length === 0 ? (
            <div className="h-28 flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-xl text-center p-4">
              <HelpCircle className="w-5 h-5 text-gray-300 mb-1" />
              <p className="text-xs text-gray-400">No training data yet.</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Add examples above to start.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-gray-500 font-mono">Dataset ({classData.examples.length})</span>
              <div 
                id={`examples-container-${classData.id}`}
                className={`overflow-y-auto max-h-[160px] border border-gray-100 rounded-xl p-2.5 bg-gray-50/30 ${
                  mode === 'text' ? 'flex flex-col gap-1.5' : 'grid grid-cols-3 gap-2'
                }`}
              >
                {classData.examples.map((example) => (
                  <div
                    key={example.id}
                    className={`group relative border transition-all ${
                      mode === 'text'
                        ? 'flex justify-between items-center bg-white border-gray-200 rounded-lg px-2.5 py-1.5'
                        : 'aspect-square bg-white border-gray-200 rounded-lg overflow-hidden flex items-center justify-center p-0.5 shadow-sm hover:border-emerald-400'
                    }`}
                  >
                    {mode === 'text' ? (
                      <>
                        <p className="text-xs text-gray-700 truncate pr-4 flex-1" title={example.value}>
                          {example.value}
                        </p>
                        <button
                          type="button"
                          id={`delete-example-${example.id}`}
                          onClick={() => onRemoveExample(classData.id, example.id)}
                          className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors"
                          title="Remove example"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <img
                          src={example.value}
                          alt="Training example"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain rounded"
                        />
                        <button
                          type="button"
                          id={`delete-example-${example.id}`}
                          onClick={() => onRemoveExample(classData.id, example.id)}
                          className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded"
                          title="Remove image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

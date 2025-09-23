'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Bot, 
  Target, 
  Brain, 
  BookOpen,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { buildAiUrl } from '@/config/api';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgentCreated: (agent: any) => void;
}

const questionTypeOptions = [
  { id: 'mcq', label: 'Multiple Choice Questions', icon: Target, color: 'bg-blue-500', description: 'Generate MCQs with 4 options' },
  { id: 'objective', label: 'Objective Questions', icon: FileText, color: 'bg-green-500', description: 'True/False and fill-in-the-blank questions' },
  { id: 'mindmap', label: 'Mind Maps', icon: Brain, color: 'bg-purple-500', description: 'Visual mind maps for concept organization' },
  { id: 'short-answer', label: 'Short Answer Questions', icon: BookOpen, color: 'bg-orange-500', description: 'Brief answer questions with explanations' },
  { id: 'essay', label: 'Essay Questions', icon: FileText, color: 'bg-red-500', description: 'Long-form analytical questions' }
];

const subjectOptions = [
  'History', 'Geography', 'Economics', 'Political Science', 'Science', 
  'Mathematics', 'English', 'Hindi', 'General Knowledge', 'Current Affairs',
  'Environment', 'Agriculture', 'Technology', 'Arts & Culture', 'Sports'
];

export default function CreateAgentModal({ isOpen, onClose, onAgentCreated }: CreateAgentModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    description: '',
    questionTypes: [] as string[],
    questionCount: 10,
    difficulty: 'medium',
    documentId: '',
    agentId: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadStartTime, setUploadStartTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate elapsed time for upload progress
  const getElapsedTime = () => {
    if (!uploadStartTime) return '';
    const elapsed = Math.floor((Date.now() - uploadStartTime) / 1000);
    return `${elapsed}s`;
  };

  // Update elapsed time display every second during upload
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isUploading && uploadStartTime) {
      interval = setInterval(() => {
        // Force re-render to update elapsed time
        setUploadProgress(prev => prev);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isUploading, uploadStartTime]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    }
  };

  const handleQuestionTypeToggle = (typeId: string) => {
    setFormData(prev => ({
      ...prev,
      questionTypes: prev.questionTypes.includes(typeId)
        ? prev.questionTypes.filter((id: string) => id !== typeId)
        : [...prev.questionTypes, typeId]
    }));
  };

  const createAgentFirst = async () => {
    if (!formData.name || !formData.subject || formData.questionTypes.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Create agent first (without PDF)
      const agentData = {
        name: formData.name,
        subject: formData.subject,
        description: formData.description,
        questionTypes: formData.questionTypes,
        questionCount: formData.questionCount,
        difficulty: formData.difficulty
      };

      const response = await fetch('/api/agents/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to create agent');
      }

      const result = await response.json();
      if (result.success) {
        setFormData(prev => ({ ...prev, agentId: result.agent.id }));
        setIsCreating(false);
        setStep(2);
      } else {
        throw new Error(result.error || 'Failed to create agent');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create agent');
      setIsCreating(false);
    }
  };

  const uploadPDF = async () => {
    if (!selectedFile || !formData.agentId) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadStartTime(Date.now());
    
    try {
      // Upload PDF to existing agent
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('agentId', formData.agentId);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 120000); // 120 second timeout (2 minutes)
      
      const response = await fetch('/api/agents/upload-pdf', {
        method: 'POST',
        body: uploadFormData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `Upload failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Upload failed');
      }
      
      // Simulate progress for better UX
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setUploadProgress(i);
      }
      
      setFormData(prev => ({ ...prev, documentId: result.document.id }));
      setIsUploading(false);
      setStep(3);
    } catch (error) {
      let errorMessage = 'Failed to upload PDF';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Upload timeout - PDF processing is taking longer than expected. Please try again with a smaller file or check if the AI backend is running properly.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setUploadError(errorMessage);
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    // Agent and PDF are already created, just close the modal
    onAgentCreated({
      id: formData.agentId,
      name: formData.name,
      subject: formData.subject,
      description: formData.description,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    });
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      description: '',
      questionTypes: [],
      questionCount: 10,
      difficulty: 'medium',
      documentId: '',
      agentId: ''
    });
    setSelectedFile(null);
    setStep(1);
    setUploadProgress(0);
    setUploadError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Bot className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Create New AI Agent
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
              }`}>
                1
              </div>
              <span className="hidden sm:block">Upload PDF</span>
            </div>
            <div className={`w-8 h-1 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
              }`}>
                2
              </div>
              <span className="hidden sm:block">Configure Agent</span>
            </div>
          </div>
        </div>

        {/* Step 1: Agent Details */}
        {step === 1 && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Create Your AI Agent
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              First, let's set up your AI agent with basic information.
            </p>

            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                selectedFile
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-4">
                  <CheckCircle className="w-12 h-12 text-primary-600 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Choose different file
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      Drop your PDF here
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      or click to browse files
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Select PDF
                  </button>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Error Display */}
            {uploadError && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                    <div>
                      <h4 className="font-medium text-red-800 dark:text-red-200">Upload Error</h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">{uploadError}</p>
                    </div>
                  </div>
                  <button
                    onClick={uploadPDF}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* File Requirements */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">File Requirements:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• PDF format only</li>
                <li>• Maximum file size: 10 MB</li>
                <li>• Text-based PDFs work best</li>
                <li>• Scanned PDFs may have limited functionality</li>
              </ul>
            </div>

            {/* Progress Bar */}
        {isUploading && (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Processing PDF... {getElapsedTime()}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Large PDFs may take 1-2 minutes to process. Please be patient...
            </p>
          </div>
        )}

            {/* Next Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={uploadPDF}
                disabled={!selectedFile || isUploading}
                className="inline-flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing PDF... {getElapsedTime()}
            </>
          ) : (
            <>
              Next
              <FileText className="w-4 h-4 ml-2" />
            </>
          )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Agent Configuration */}
        {step === 2 && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Configure Your AI Agent
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Customize your agent's settings and choose the types of questions you want to generate.
            </p>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Agent Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., UPSC History Agent"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject *
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a subject</option>
                    {subjectOptions.map((subject: string) => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of what this agent will focus on..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Question Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Question Types * (Select at least one)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {questionTypeOptions.map((type) => (
                    <label
                      key={type.id}
                      className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.questionTypes.includes(type.id)
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.questionTypes.includes(type.id)}
                        onChange={() => handleQuestionTypeToggle(type.id)}
                        className="mt-1 mr-3 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <type.icon className={`w-4 h-4 mr-2 ${type.color} text-white p-1 rounded`} />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {type.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {type.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Questions per Session
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={formData.questionCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.subject || formData.questionTypes.length === 0 || isCreating}
                className="inline-flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Agent...
                  </>
                ) : (
                  <>
                    Create Agent
                    <Bot className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

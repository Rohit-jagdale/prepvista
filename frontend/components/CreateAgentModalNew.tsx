'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Bot, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgentCreated: (agent: any) => void;
}

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography',
  'English', 'Hindi', 'General Knowledge', 'Current Affairs',
  'Environment', 'Agriculture', 'Technology', 'Arts & Culture', 'Sports'
];

const QUESTION_TYPES = [
  { id: 'mcq', label: 'Multiple Choice Questions', description: 'Questions with 4 options' },
  { id: 'true_false', label: 'True/False', description: 'Binary choice questions' },
  { id: 'fill_blank', label: 'Fill in the Blanks', description: 'Complete the sentence' },
  { id: 'short_answer', label: 'Short Answer', description: 'Brief written responses' },
  { id: 'essay', label: 'Essay Questions', description: 'Detailed written responses' }
];

export default function CreateAgentModalNew({ isOpen, onClose, onAgentCreated }: CreateAgentModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    description: '',
    questionTypes: [] as string[],
    questionCount: 10,
    difficulty: 'medium',
    agentId: '',
    documentId: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStartTime, setUploadStartTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
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
      setUploadError(null);
    }
  };

  const handleQuestionTypeToggle = (typeId: string) => {
    setFormData(prev => ({
      ...prev,
      questionTypes: prev.questionTypes.includes(typeId)
        ? prev.questionTypes.filter(id => id !== typeId)
        : [...prev.questionTypes, typeId]
    }));
  };

  const createAgent = async () => {
    if (!formData.name || !formData.subject || formData.questionTypes.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
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
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('agentId', formData.agentId);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 120000);
      
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
      
      // Simulate progress
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
          errorMessage = 'Upload timeout - PDF processing is taking longer than expected.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setUploadError(errorMessage);
      setIsUploading(false);
    }
  };

  const handleComplete = () => {
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
      agentId: '',
      documentId: ''
    });
    setSelectedFile(null);
    setStep(1);
    setUploadProgress(0);
    setError(null);
    setUploadError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Bot className="w-6 h-6 text-primary-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create AI Agent
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Step {step} of 3
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Agent Details</span>
            </div>
            <div className={`flex-1 h-0.5 mx-4 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Upload PDF</span>
            </div>
            <div className={`flex-1 h-0.5 mx-4 ${step >= 3 ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
            <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Complete</span>
            </div>
          </div>
        </div>

        {/* Step 1: Agent Details */}
        {step === 1 && (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Agent Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Math Tutor, Science Helper"
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
                {SUBJECTS.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this agent will help with..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Question Types *
              </label>
              <div className="grid grid-cols-1 gap-3">
                {QUESTION_TYPES.map(type => (
                  <label key={type.id} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.questionTypes.includes(type.id)}
                      onChange={() => handleQuestionTypeToggle(type.id)}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {type.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {type.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                  <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={createAgent}
                disabled={isCreating || !formData.name || !formData.subject || formData.questionTypes.length === 0}
                className="inline-flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: PDF Upload */}
        {step === 2 && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Upload Study Material
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Upload a PDF document to create an AI agent that will generate questions based on its content.
              </p>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                selectedFile
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
              }`}
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

            {uploadError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
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

            {isUploading && (
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Processing PDF... {getElapsedTime()}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Large PDFs may take 1-2 minutes to process. Please be patient...
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <button
                onClick={uploadPDF}
                disabled={!selectedFile || isUploading}
                className="inline-flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing... {getElapsedTime()}
                  </>
                ) : (
                  <>
                    Upload & Process
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 3 && (
          <div className="p-6 text-center space-y-6">
            <div className="space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Agent Created Successfully!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Your AI agent "{formData.name}" is ready to generate questions from your PDF.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Agent Details:</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>Name:</strong> {formData.name}</p>
                <p><strong>Subject:</strong> {formData.subject}</p>
                <p><strong>Question Types:</strong> {formData.questionTypes.length} selected</p>
                <p><strong>Document:</strong> {selectedFile?.name}</p>
              </div>
            </div>

            <button
              onClick={handleComplete}
              className="inline-flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Start Using Agent
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

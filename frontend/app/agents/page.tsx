'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { 
  Bot, 
  Plus, 
  BookOpen, 
  FileText, 
  Brain, 
  Target,
  Upload,
  Trash2,
  Edit,
  Play,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import CreateAgentModal from '@/components/CreateAgentModal';
import AgentPracticeSession from '@/components/AgentPracticeSession';

interface Agent {
  id: string;
  name: string;
  subject: string;
  documentName: string;
  questionTypes: string[];
  createdAt: string;
  questionCount: number;
  lastUsed: string;
}

const questionTypeOptions = [
  { id: 'mcq', label: 'Multiple Choice Questions', icon: Target, color: 'bg-blue-500' },
  { id: 'objective', label: 'Objective Questions', icon: FileText, color: 'bg-green-500' },
  { id: 'mindmap', label: 'Mind Maps', icon: Brain, color: 'bg-purple-500' },
  { id: 'short-answer', label: 'Short Answer Questions', icon: BookOpen, color: 'bg-orange-500' },
  { id: 'essay', label: 'Essay Questions', icon: FileText, color: 'bg-red-500' }
];

export default function AgentsPage() {
  const { user, isAuthenticated } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: '1',
      name: 'UPSC History Agent',
      subject: 'History',
      documentName: 'Ancient_India_History.pdf',
      questionTypes: ['mcq', 'objective'],
      createdAt: '2024-01-15',
      questionCount: 45,
      lastUsed: '2024-01-20'
    },
    {
      id: '2',
      name: 'MPSC Geography Agent',
      subject: 'Geography',
      documentName: 'Maharashtra_Geography.pdf',
      questionTypes: ['mcq', 'mindmap'],
      createdAt: '2024-01-10',
      questionCount: 32,
      lastUsed: '2024-01-18'
    }
  ]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [practicingAgent, setPracticingAgent] = useState<Agent | null>(null);

  const handleAgentCreated = (newAgent: Agent) => {
    setAgents(prev => [newAgent, ...prev]);
  };

  const handleStartPractice = (agent: Agent) => {
    setPracticingAgent(agent);
  };

  const handleClosePractice = () => {
    setPracticingAgent(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to access the Agents feature.
          </p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Bot className="w-8 h-8 mr-3 text-primary-600" />
                AI Agents
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Create personalized AI agents for different subjects and generate custom questions
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Agents</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{agents.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Documents</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {agents.reduce((acc, agent) => acc + 1, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Questions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {agents.reduce((acc, agent) => acc + agent.questionCount, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {agents.filter(agent => new Date(agent.lastUsed) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {agent.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Subject: {agent.subject}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Document: {agent.documentName}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {agent.questionTypes.map((type) => {
                      const typeInfo = questionTypeOptions.find(t => t.id === type);
                      return typeInfo ? (
                        <span
                          key={type}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${typeInfo.color}`}
                        >
                          <typeInfo.icon className="w-3 h-3 mr-1" />
                          {typeInfo.label.split(' ')[0]}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span>Created: {new Date(agent.createdAt).toLocaleDateString()}</span>
                  <span>{agent.questionCount} questions</span>
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleStartPractice(agent)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Practice
                  </button>
                  <button className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Results
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {agents.length === 0 && (
          <div className="text-center py-12">
            <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No agents created yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first AI agent to start generating personalized questions
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Agent
            </button>
          </div>
        )}
      </div>

      {/* Create Agent Modal */}
      <CreateAgentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onAgentCreated={handleAgentCreated}
      />

      {/* Practice Session */}
      {practicingAgent && (
        <AgentPracticeSession
          agentId={practicingAgent.id}
          agentName={practicingAgent.name}
          onClose={handleClosePractice}
        />
      )}
    </div>
  );
}

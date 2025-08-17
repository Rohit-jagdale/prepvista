import { Brain, BookOpen } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Aptitude Prep</h1>
              <p className="text-sm text-gray-600">AI-Powered Learning Platform</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors">
              Home
            </a>
            <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors">
              Practice
            </a>
            <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors">
              Progress
            </a>
            <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors">
              About
            </a>
          </nav>
          
          <div className="flex items-center space-x-4">
            <button className="btn-secondary">
              <BookOpen className="w-4 h-4 mr-2" />
              Login
            </button>
            <button className="btn-primary">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

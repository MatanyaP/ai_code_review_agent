import React, { useState, useEffect } from 'react';
import CodeEditor from './components/CodeEditor';
import FeedbackDisplay from './components/FeedbackDisplay';
import MultiFeedbackDisplay from './components/MultiFeedbackDisplay';
import FileUpload from './components/FileUpload';
import { codeReviewAPI } from './services/api';
import { 
  CodeReviewResponse, 
  MultiFileReviewResponse, 
  SupportedLanguage, 
  FileInfo 
} from './types';
import './index.css';

type AnalysisMode = 'single' | 'multi';

const App: React.FC = () => {
  const [mode, setMode] = useState<AnalysisMode>('single');
  
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [feedback, setFeedback] = useState<CodeReviewResponse | null>(null);
  
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [projectName, setProjectName] = useState<string>('My Project');
  const [multiFeedback, setMultiFeedback] = useState<MultiFileReviewResponse | null>(null);
  
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSupportedLanguages = async () => {
      try {
        const response = await codeReviewAPI.getSupportedLanguages();
        setSupportedLanguages(response.languages);
      } catch (err) {
        console.error('Failed to fetch supported languages:', err);
        setSupportedLanguages(['python', 'typescript', 'javascript', 'java']);
      }
    };

    fetchSupportedLanguages();
  }, []);

  const handleSingleFileSubmit = async () => {
    if (!code.trim()) {
      setError('Please enter some code to review');
      return;
    }

    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const result = await codeReviewAPI.reviewCode({ code, language });
      setFeedback(result);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        'Failed to analyze code. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMultiFileSubmit = async () => {
    if (files.length === 0) {
      setError('Please upload at least one file to analyze');
      return;
    }

    setLoading(true);
    setError(null);
    setMultiFeedback(null);

    try {
      const result = await codeReviewAPI.reviewCodebase({ 
        files, 
        project_name: projectName 
      });
      setMultiFeedback(result);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        'Failed to analyze codebase. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (newMode: AnalysisMode) => {
    setMode(newMode);
    setError(null);
    setFeedback(null);
    setMultiFeedback(null);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Code Review Agent</h1>
        <p>AI-powered code analysis for security, performance, and best practices</p>
        
        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button
            className={`mode-button ${mode === 'single' ? 'active' : ''}`}
            onClick={() => handleModeChange('single')}
          >
            📄 Single File
          </button>
          <button
            className={`mode-button ${mode === 'multi' ? 'active' : ''}`}
            onClick={() => handleModeChange('multi')}
          >
            📁 Multiple Files
          </button>
        </div>
      </header>

      {mode === 'single' ? (
        <div className="code-editor-section">
          <div className="editor-controls">
            <select 
              className="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            >
              {supportedLanguages.map(lang => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
            
            <button 
              className="submit-button"
              onClick={handleSingleFileSubmit}
              disabled={loading || !code.trim()}
            >
              {loading && <span className="loading"></span>}
              {loading ? 'Analyzing...' : 'Review Code'}
            </button>
          </div>

          <CodeEditor
            value={code}
            onChange={setCode}
            language={language}
            showMinimap={true}
          />
        </div>
      ) : (
        <div className="multi-file-section">
          <div className="project-controls">
            <input
              type="text"
              placeholder="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="project-name-input"
            />
            
            <button 
              className="submit-button"
              onClick={handleMultiFileSubmit}
              disabled={loading || files.length === 0}
            >
              {loading && <span className="loading"></span>}
              {loading ? 'Analyzing Codebase...' : 'Review Codebase'}
            </button>
          </div>

          <FileUpload onFilesSelected={setFiles} />
        </div>
      )}

      {error && (
        <div className="feedback-section">
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {mode === 'single' && feedback && (
        <div className="feedback-section">
          <FeedbackDisplay feedback={feedback} />
        </div>
      )}

      {mode === 'multi' && multiFeedback && (
        <div className="feedback-section">
          <MultiFeedbackDisplay feedback={multiFeedback} />
        </div>
      )}
    </div>
  );
};

export default App;

import React, { useState } from 'react';
import { MultiFileReviewResponse, FeedbackItem, FileFeedback, ReportFormat } from '../types';
import { codeReviewAPI } from '../services/api';

interface MultiFeedbackDisplayProps {
  feedback: MultiFileReviewResponse;
}

const MultiFeedbackDisplay: React.FC<MultiFeedbackDisplayProps> = ({ feedback }) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const getScoreClass = (score: number): string => {
    if (score >= 8) return '';
    if (score >= 5) return 'medium';
    return 'low';
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'security': return '🔒';
      case 'performance': return '⚡';
      case 'logic': return '🧠';
      case 'style': return '🎨';
      default: return '📝';
    }
  };

  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return 'ℹ️';
      default: return '📋';
    }
  };

  const handleGenerateReport = async (format: ReportFormat) => {
    setIsGeneratingReport(true);
    try {
      await codeReviewAPI.generateReport({
        review_data: feedback,
        format,
        include_code: true,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const renderFeedbackItem = (item: FeedbackItem, index: number) => (
    <div key={index} className="feedback-item">
      <div className="feedback-header">
        <span className={`category-badge category-${item.category}`}>
          {item.category}
        </span>
        <span className={`severity-badge severity-${item.severity}`}>
          {getSeverityIcon(item.severity)} {item.severity}
        </span>
        <span className="line-number">
          Line {item.line}
        </span>
        {item.filename && item.filename !== 'multiple_files' && (
          <span className="filename-badge">
            📁 {item.filename}
          </span>
        )}
      </div>
      <div className="feedback-message">
        {item.message}
      </div>
      <div className="feedback-suggestion">
        💡 {item.suggestion}
      </div>
    </div>
  );

  const renderFileFeedback = (fileFeedback: FileFeedback) => (
    <div key={fileFeedback.filename} className="file-feedback">
      <div className="file-header">
        <h4>
          📄 {fileFeedback.filename}
          <span className={`overall-score ${getScoreClass(fileFeedback.score)}`}>
            {fileFeedback.score}/10
          </span>
        </h4>
        <p>{fileFeedback.summary}</p>
      </div>
      
      {fileFeedback.feedback.length === 0 ? (
        <div className="no-issues">
          <p>✅ No issues found in this file.</p>
        </div>
      ) : (
        <div className="file-issues">
          {fileFeedback.feedback.map((item, index) => renderFeedbackItem(item, index))}
        </div>
      )}
    </div>
  );

  return (
    <div className="multi-feedback-display">
      {/* Project Summary */}
      <div className="project-summary">
        <h2>📊 Project Analysis: {feedback.project_name}</h2>
        <div className="summary-stats">
          <div className="stat-item">
            <strong>Files Analyzed:</strong> {feedback.total_files}
          </div>
          <div className="stat-item">
            <strong>Total Issues:</strong> {feedback.total_issues}
          </div>
          <div className="stat-item">
            <strong>Overall Score:</strong>
            <span className={`overall-score ${getScoreClass(feedback.overall_score)}`}>
              {feedback.overall_score}/10
            </span>
          </div>
        </div>
        <div className="overall-summary">
          <p>{feedback.overall_summary}</p>
        </div>
      </div>

      {/* Report Generation */}
      <div className="report-generation">
        <h3>📋 Generate Report</h3>
        <div className="report-buttons">
          <button
            onClick={() => handleGenerateReport('pdf')}
            disabled={isGeneratingReport}
            className="report-button pdf-button"
          >
            {isGeneratingReport ? '⏳ Generating...' : '📄 Download PDF'}
          </button>
          <button
            onClick={() => handleGenerateReport('markdown')}
            disabled={isGeneratingReport}
            className="report-button md-button"
          >
            {isGeneratingReport ? '⏳ Generating...' : '📝 Download Markdown'}
          </button>
        </div>
      </div>

      {/* File Navigation */}
      <div className="file-navigation">
        <h3>📁 Files Overview</h3>
        <div className="file-tabs">
          <button
            className={`tab-button ${selectedFile === null ? 'active' : ''}`}
            onClick={() => setSelectedFile(null)}
          >
            📋 All Files
          </button>
          {feedback.files.map((file) => (
            <button
              key={file.filename}
              className={`tab-button ${selectedFile === file.filename ? 'active' : ''}`}
              onClick={() => setSelectedFile(file.filename)}
            >
              📄 {file.filename}
              {file.feedback.length > 0 && (
                <span className="issue-count">({file.feedback.length})</span>
              )}
            </button>
          ))}
          {feedback.cross_file_issues.length > 0 && (
            <button
              className={`tab-button ${selectedFile === 'cross-file' ? 'active' : ''}`}
              onClick={() => setSelectedFile('cross-file')}
            >
              🔗 Cross-File Issues ({feedback.cross_file_issues.length})
            </button>
          )}
        </div>
      </div>

      {/* Content Display */}
      <div className="feedback-content">
        {selectedFile === null && (
          <div className="all-files-view">
            {feedback.files.map(renderFileFeedback)}
            
            {feedback.cross_file_issues.length > 0 && (
              <div className="cross-file-issues">
                <h3>🔗 Cross-File Issues</h3>
                <p>These issues span multiple files and may indicate architectural concerns:</p>
                {feedback.cross_file_issues.map((item, index) => renderFeedbackItem(item, index))}
              </div>
            )}
          </div>
        )}

        {selectedFile === 'cross-file' && (
          <div className="cross-file-issues">
            <h3>🔗 Cross-File Issues</h3>
            <p>These issues span multiple files and may indicate architectural concerns:</p>
            {feedback.cross_file_issues.map((item, index) => renderFeedbackItem(item, index))}
          </div>
        )}

        {selectedFile && selectedFile !== 'cross-file' && (
          <div className="single-file-view">
            {(() => {
              const fileFeedback = feedback.files.find(f => f.filename === selectedFile);
              return fileFeedback ? renderFileFeedback(fileFeedback) : null;
            })()}
          </div>
        )}
      </div>

    </div>
  );
};

export default MultiFeedbackDisplay;
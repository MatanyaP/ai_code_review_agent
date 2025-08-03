import React from 'react';
import { CodeReviewResponse, FeedbackItem } from '../types';

interface FeedbackDisplayProps {
  feedback: CodeReviewResponse;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ feedback }) => {
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

  const groupFeedbackByCategory = (feedbackItems: FeedbackItem[]) => {
    return feedbackItems.reduce((groups, item) => {
      const category = item.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    }, {} as Record<string, FeedbackItem[]>);
  };

  const groupedFeedback = groupFeedbackByCategory(feedback.feedback);
  const categories = Object.keys(groupedFeedback).sort();

  return (
    <div>
      <div className="feedback-summary">
        <h3>
          📊 Analysis Summary
          <span className={`overall-score ${getScoreClass(feedback.overall_score)}`}>
            {feedback.overall_score}/10
          </span>
        </h3>
        <p>{feedback.summary}</p>
      </div>

      {feedback.feedback.length === 0 ? (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#28a745',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '6px'
        }}>
          <h4>🎉 Great job! No issues found.</h4>
          <p>Your code looks clean and follows best practices.</p>
        </div>
      ) : (
        <div>
          <h4>
            🔍 Issues Found ({feedback.feedback.length})
          </h4>
          
          {categories.map(category => (
            <div key={category}>
              <h5 style={{ 
                marginTop: '25px', 
                marginBottom: '15px',
                color: '#495057',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {getCategoryIcon(category)}
                {category.charAt(0).toUpperCase() + category.slice(1)} Issues
                <span style={{
                  backgroundColor: '#e9ecef',
                  color: '#495057',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'normal'
                }}>
                  {groupedFeedback[category].length}
                </span>
              </h5>
              
              {groupedFeedback[category].map((item, index) => (
                <div key={`${category}-${index}`} className="feedback-item">
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
                  </div>
                  <div className="feedback-message">
                    {item.message}
                  </div>
                  <div className="feedback-suggestion">
                    💡 {item.suggestion}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackDisplay;
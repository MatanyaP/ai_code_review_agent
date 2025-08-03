export type SupportedLanguage = 
  | 'python'
  | 'typescript'
  | 'javascript'
  | 'java'
  | 'cpp'
  | 'csharp';

export interface FeedbackItem {
  category: 'security' | 'performance' | 'logic' | 'style';
  severity: 'high' | 'medium' | 'low';
  line: number;
  message: string;
  suggestion: string;
  filename?: string;
}

export interface CodeReviewResponse {
  feedback: FeedbackItem[];
  summary: string;
  overall_score: number;
}

export interface CodeSubmission {
  code: string;
  language: SupportedLanguage;
}

export interface FileInfo {
  filename: string;
  content: string;
  language: SupportedLanguage;
}

export interface MultiFileSubmission {
  files: FileInfo[];
  project_name?: string;
}

export interface FileFeedback {
  filename: string;
  feedback: FeedbackItem[];
  summary: string;
  score: number;
}

export interface MultiFileReviewResponse {
  project_name: string;
  files: FileFeedback[];
  cross_file_issues: FeedbackItem[];
  overall_summary: string;
  overall_score: number;
  total_files: number;
  total_issues: number;
}

export type ReportFormat = 'pdf' | 'markdown';

export interface ReportRequest {
  review_data: MultiFileReviewResponse;
  format: ReportFormat;
  include_code: boolean;
}
import axios from 'axios';
import { saveAs } from 'file-saver';
import { 
  CodeSubmission, 
  CodeReviewResponse, 
  SupportedLanguage,
  MultiFileSubmission,
  MultiFileReviewResponse,
  ReportRequest
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || (
  // In production Docker, use relative path with nginx proxy
  process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8000'
);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const codeReviewAPI = {
  reviewCode: async (submission: CodeSubmission): Promise<CodeReviewResponse> => {
    const response = await api.post<CodeReviewResponse>('/review-code', submission);
    return response.data;
  },

  reviewCodebase: async (submission: MultiFileSubmission): Promise<MultiFileReviewResponse> => {
    const response = await api.post<MultiFileReviewResponse>('/review-codebase', submission);
    return response.data;
  },

  uploadFiles: async (files: File[], projectName: string = 'Uploaded Project'): Promise<MultiFileReviewResponse> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('project_name', projectName);

    const response = await api.post<MultiFileReviewResponse>('/upload-files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  generateReport: async (reportRequest: ReportRequest): Promise<void> => {
    const response = await api.post('/generate-report', reportRequest, {
      responseType: 'blob',
    });

    const filename = reportRequest.format === 'pdf' 
      ? `${reportRequest.review_data.project_name}_report.pdf`
      : `${reportRequest.review_data.project_name}_report.md`;

    saveAs(response.data, filename);
  },

  getSupportedLanguages: async (): Promise<{ languages: SupportedLanguage[] }> => {
    const response = await api.get<{ languages: SupportedLanguage[] }>('/supported-languages');
    return response.data;
  },

  healthCheck: async (): Promise<{ status: string }> => {
    const response = await api.get<{ status: string }>('/health');
    return response.data;
  },
};

export default api;
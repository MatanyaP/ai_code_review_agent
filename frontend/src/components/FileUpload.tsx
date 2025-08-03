import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileInfo, SupportedLanguage } from '../types';

interface FileUploadProps {
  onFilesSelected: (files: FileInfo[]) => void;
  maxFiles?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, maxFiles = 10 }) => {
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);

  const detectLanguageFromExtension = (filename: string): SupportedLanguage => {
    const extension = filename.toLowerCase().split('.').pop() || '';
    const extensionMap: Record<string, SupportedLanguage> = {
      'py': 'python',
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'java': 'java',
      'cpp': 'cpp',
      'cc': 'cpp',
      'cxx': 'cpp',
      'c': 'cpp',
      'h': 'cpp',
      'hpp': 'cpp',
      'cs': 'csharp',
    };
    return extensionMap[extension] || 'python';
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const fileInfos: FileInfo[] = [];
    
    for (const file of acceptedFiles) {
      try {
        const content = await file.text();
        const fileInfo: FileInfo = {
          filename: file.name,
          content,
          language: detectLanguageFromExtension(file.name)
        };
        fileInfos.push(fileInfo);
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error);
      }
    }
    
    const newFiles = [...uploadedFiles, ...fileInfos].slice(0, maxFiles);
    setUploadedFiles(newFiles);
    onFilesSelected(newFiles);
  }, [uploadedFiles, onFilesSelected, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/*': ['.py', '.ts', '.tsx', '.js', '.jsx', '.java', '.cpp', '.cc', '.cxx', '.c', '.h', '.hpp', '.cs'],
    },
    maxFiles,
    multiple: true,
  });

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const updateFileLanguage = (index: number, language: SupportedLanguage) => {
    const newFiles = [...uploadedFiles];
    newFiles[index] = { ...newFiles[index], language };
    setUploadedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  return (
    <div className="file-upload-container">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
        style={{
          border: '2px dashed #ccc',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? '#f0f8ff' : '#fafafa',
          borderColor: isDragActive ? '#007bff' : '#ccc',
          transition: 'all 0.2s ease',
        }}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <div>
            <p style={{ fontSize: '18px', color: '#007bff' }}>📁 Drop files here...</p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '18px', marginBottom: '10px' }}>
              📁 Drag & drop code files here, or click to browse
            </p>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Supports: .py, .ts, .tsx, .js, .jsx, .java, .cpp, .cs and more
            </p>
            <p style={{ fontSize: '12px', color: '#999' }}>
              Maximum {maxFiles} files
            </p>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files" style={{ marginTop: '20px' }}>
          <h4>📂 Selected Files ({uploadedFiles.length})</h4>
          <div className="file-list">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="file-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  backgroundColor: 'white',
                }}
              >
                <div className="file-info" style={{ flex: 1 }}>
                  <strong>{file.filename}</strong>
                  <span style={{ marginLeft: '10px', color: '#666' }}>
                    ({file.content.split('\n').length} lines)
                  </span>
                </div>
                
                <div className="file-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <select
                    value={file.language}
                    onChange={(e) => updateFileLanguage(index, e.target.value as SupportedLanguage)}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  >
                    <option value="python">Python</option>
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="csharp">C#</option>
                  </select>
                  
                  <button
                    onClick={() => removeFile(index)}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
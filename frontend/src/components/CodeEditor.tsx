import React, { useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { SupportedLanguage } from '../types';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: SupportedLanguage;
  height?: string;
  theme?: 'vs' | 'vs-dark' | 'hc-black';
  readOnly?: boolean;
  showMinimap?: boolean;
}

const languageMap: Record<SupportedLanguage, string> = {
  python: 'python',
  typescript: 'typescript',
  javascript: 'javascript',
  java: 'java',
  cpp: 'cpp',
  csharp: 'csharp',
};

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  value, 
  onChange, 
  language,
  height = '400px',
  theme = 'vs',
  readOnly = false,
  showMinimap = false
}) => {
  const editorRef = useRef<any>(null);

  const handleEditorChange = (newValue: string | undefined) => {
    if (!readOnly) {
      onChange(newValue || '');
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    
    monaco.languages.setMonarchTokensProvider('python', {
      tokenizer: {
        root: [
          [/\b(def|class|if|elif|else|for|while|try|except|finally|with|import|from|as|return|yield|lambda|and|or|not|in|is|None|True|False)\b/, 'keyword'],
          [/\b(int|float|str|list|dict|tuple|set|bool)\b/, 'type'],
          [/#.*$/, 'comment'],
          [/""".*?"""/, 'string'],
          [/'''.*?'''/, 'string'],
          [/".*?"/, 'string'],
          [/'.*?'/, 'string'],
          [/\b\d+\b/, 'number'],
        ]
      }
    });

    monaco.editor.setModelMarkers(editor.getModel()!, 'owner', []);
    
    monaco.editor.defineTheme('enhanced-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editor.lineHighlightBackground': '#2D2D30',
        'editor.selectionBackground': '#264F78',
      }
    });

    monaco.editor.defineTheme('enhanced-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '008000', fontStyle: 'italic' },
        { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
        { token: 'string', foreground: 'A31515' },
        { token: 'number', foreground: '098658' },
        { token: 'type', foreground: '267F99' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#000000',
        'editor.lineHighlightBackground': '#F0F0F0',
        'editor.selectionBackground': '#ADD6FF',
      }
    });
  };

  const getTheme = () => {
    switch (theme) {
      case 'vs-dark':
        return 'enhanced-dark';
      case 'vs':
        return 'enhanced-light';
      default:
        return theme;
    }
  };

  return (
    <div style={{ 
      height, 
      border: '1px solid #ddd', 
      borderRadius: '4px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Editor
        height="100%"
        language={languageMap[language]}
        theme={getTheme()}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: showMinimap },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: language === 'python' ? 4 : 2,
          wordWrap: 'on',
          readOnly,
          contextmenu: true,
          folding: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'mouseover',
          unfoldOnClickAfterEndOfLine: true,
          cursorBlinking: 'blink',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          mouseWheelZoom: true,
          bracketPairColorization: {
            enabled: true,
          },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          suggest: {
            showKeywords: true,
            showSnippets: true,
          },
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false,
          },
          parameterHints: {
            enabled: true,
          },
          formatOnPaste: true,
          formatOnType: true,
        }}
        loading={
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            color: '#666',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div className="loading-spinner" style={{
              width: '30px',
              height: '30px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <div>Loading enhanced code editor...</div>
          </div>
        }
      />
      
    </div>
  );
};

export default CodeEditor;

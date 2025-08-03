# Code Review Agent

> **Home Assignment - Full-Stack Developer Position**

A production-ready, full-stack web application that performs intelligent code review using Google's Gemini AI. The system analyzes single files or entire codebases and provides structured feedback covering security, performance, style, and logic issues.

## Assignment Overview

This project demonstrates proficiency in:
- **Full-Stack Development**: React (TypeScript) + Python (FastAPI)
- **AI Integration**: Google Gemini API with structured output processing
- **Modern DevOps**: Docker containerization with multi-stage builds
- **Professional Architecture**: Scalable, maintainable, and secure code structure
- **User Experience**: Intuitive drag-and-drop interface with real-time feedback

## Features

### AI Agent Capabilities
- **Syntax Analysis**: Basic syntax checking and validation
- **Security Review**: Identify potential security vulnerabilities  
- **Performance Analysis**: Suggest optimization opportunities
- **Code Quality**: Review style, maintainability, and best practices
- **Contextual Suggestions**: Provide specific, actionable recommendations

### Core Features
- **Multi-language Support**: Python, TypeScript, JavaScript, Java, C++, C#
- **Monaco Editor**: Professional code editor with enhanced syntax highlighting
- **Structured Feedback**: Categorized feedback with severity levels
- **Real-time Analysis**: Fast AI-powered code review
- **Responsive Design**: Works on desktop and mobile devices

### Bonus Features
- Multiple File Support**: Analyze entire codebases with cross-file dependency detection
- Export Reports**: Generate comprehensive PDF and Markdown reports
- Enhanced Syntax Highlighting**: Advanced code visualization with custom themes
- Cross-File Analysis**: Detect architectural issues and dependencies across files
- Drag & Drop Upload**: Easy file upload with automatic language detection

### 📊 Feedback Categories
- **Security**: Potential vulnerabilities, injection risks
- **Performance**: Optimization opportunities, efficiency improvements  
- **Logic & Bugs**: Potential logical errors, edge cases
- **Style & Best Practices**: Code formatting, naming conventions, maintainability

## Quick Start

### Option 1: Docker

**Prerequisites:**
- Docker & Docker Compose
- Google Gemini API key

**Steps:**
1. **Clone and setup environment**
   ```bash
   git clone <repository-url>
   cd code_review_agent
   cp .env.example .env
   # Edit .env and add your Gemini API key
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Option 2: Local Development

**Prerequisites:**
- Python 3.10+
- Node.js 18+
- Google Gemini API key

**Backend Setup:**
```bash
# Activate virtual environment
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Set up environment
cp .env.example backend/.env
# Edit backend/.env and add your API key

# Start backend
cd backend && python main.py
```

**Frontend Setup:**
```bash
# Install dependencies
cd frontend && npm install

# Start development server
npm start
```

### Option 3: Development with Hot Reloading

For active development with automatic reloading:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

## API Documentation

### Endpoints

#### `GET /`
Basic API information
```json
{
  "message": "Code Review Agent API"
}
```

#### `GET /health`
Health check endpoint
```json
{
  "status": "healthy"
}
```

#### `GET /supported-languages`
Get list of supported programming languages
```json
{
  "languages": ["python", "typescript", "javascript", "java", "cpp", "csharp"]
}
```

#### `POST /review-code`
Submit single file for analysis

**Request Body:**
```json
{
  "code": "def get_user_data(user_id):\n    query = \"SELECT * FROM users WHERE id = \" + str(user_id)\n    cursor.execute(query)\n    return cursor.fetchall()",
  "language": "python"
}
```

**Response:**
```json
{
  "feedback": [
    {
      "category": "security",
      "severity": "high",
      "line": 2,
      "message": "SQL injection vulnerability detected",
      "suggestion": "Use parameterized queries to prevent SQL injection attacks"
    }
  ],
  "summary": "Code has critical security issues that need immediate attention",
  "overall_score": 4
}
```

#### `POST /review-codebase`
Submit multiple files for comprehensive analysis

**Request Body:**
```json
{
  "files": [
    {
      "filename": "main.py",
      "content": "from database import get_user\n\ndef main():\n    user = get_user(1)\n    print(user)",
      "language": "python"
    },
    {
      "filename": "database.py", 
      "content": "def get_user(user_id):\n    query = f\"SELECT * FROM users WHERE id = {user_id}\"\n    return execute_query(query)",
      "language": "python"
    }
  ],
  "project_name": "My Python Project"
}
```

**Response:**
```json
{
  "project_name": "My Python Project",
  "files": [
    {
      "filename": "main.py",
      "feedback": [],
      "summary": "Clean main file with good structure",
      "score": 8
    },
    {
      "filename": "database.py",
      "feedback": [
        {
          "category": "security",
          "severity": "high",
          "line": 2,
          "message": "SQL injection vulnerability in f-string",
          "suggestion": "Use parameterized queries",
          "filename": "database.py"
        }
      ],
      "summary": "Security vulnerabilities found",
      "score": 3
    }
  ],
  "cross_file_issues": [
    {
      "category": "architecture",
      "severity": "medium",
      "line": 1,
      "message": "Missing error handling for database operations",
      "suggestion": "Add try-catch blocks and proper error handling",
      "filename": "multiple_files"
    }
  ],
  "overall_summary": "Project has critical security issues requiring immediate attention",
  "overall_score": 4,
  "total_files": 2,
  "total_issues": 2
}
```

#### `POST /upload-files`
Upload and analyze multiple files via form data

**Form Data:**
- `files`: Multiple file uploads
- `project_name`: Project name (optional)

**Response:** Same as `/review-codebase`

#### `POST /generate-report`
Generate downloadable report in PDF or Markdown format

**Request Body:**
```json
{
  "review_data": { /* MultiFileReviewResponse object */ },
  "format": "pdf",
  "include_code": true
}
```

## Test Cases

### Test Case 1: Python SQL Injection
**Input:**
```python
def get_user_data(user_id):
    query = "SELECT * FROM users WHERE id = " + str(user_id)
    cursor.execute(query)
    return cursor.fetchall()
```

**Expected Output:**
- **Security**: SQL injection vulnerability - use parameterized queries
- **Style**: Function lacks type hints and docstring  
- **Performance**: Consider using fetchone() if expecting single user

### Test Case 2: TypeScript Performance Issue
**Input:**
```typescript
function processItems(items: any[]) {
    let result = [];
    for (let i = 0; i < items.length; i++) {
        for (let j = 0; j < items.length; j++) {
            if (items[i].id === items[j].parentId) {
                result.push({...items[i], ...items[j]});
            }
        }
    }
    return result;
}
```

**Expected Output:**
- **Performance**: O(n²) complexity - consider using Map for lookups
- **Style**: Use proper TypeScript types instead of 'any'
- **Logic**: Potential for duplicate entries in result

### Test Case 3: Java Best Practices
**Input:**
```java
public class UserManager {
    public static String password = "admin123";
    
    public void authenticateUser(String user, String pass) {
        if (pass.equals(password)) {
            System.out.println("Login successful");
        }
    }
}
```

**Expected Output:**
- **Security**: Hardcoded password is a security risk
- **Security**: Use secure comparison for passwords  
- **Style**: Follow proper encapsulation principles

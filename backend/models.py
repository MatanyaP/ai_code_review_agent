from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from enum import Enum

class SupportedLanguage(str, Enum):
    PYTHON = "python"
    TYPESCRIPT = "typescript"
    JAVASCRIPT = "javascript"
    JAVA = "java"
    CPP = "cpp"
    CSHARP = "csharp"

class FileInfo(BaseModel):
    filename: str
    content: str
    language: SupportedLanguage

class CodeSubmission(BaseModel):
    code: str
    language: SupportedLanguage

class MultiFileSubmission(BaseModel):
    files: List[FileInfo]
    project_name: Optional[str] = "Unnamed Project"

class FeedbackItem(BaseModel):
    category: str
    severity: str
    line: int
    message: str
    suggestion: str
    filename: Optional[str] = None

class FileFeedback(BaseModel):
    filename: str
    feedback: List[FeedbackItem]
    summary: str
    score: int

class CodeReviewResponse(BaseModel):
    feedback: List[FeedbackItem]
    summary: str
    overall_score: int

class MultiFileReviewResponse(BaseModel):
    project_name: str
    files: List[FileFeedback]
    cross_file_issues: List[FeedbackItem]
    overall_summary: str
    overall_score: int
    total_files: int
    total_issues: int

class ReportFormat(str, Enum):
    PDF = "pdf"
    MARKDOWN = "markdown"

class ReportRequest(BaseModel):
    review_data: MultiFileReviewResponse
    format: ReportFormat
    include_code: bool = True
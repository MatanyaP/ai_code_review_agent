from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any
import os
import io
from dotenv import load_dotenv
from google import genai
from enum import Enum
from ai_service import AIService
from multi_file_service import MultiFileAnalysisService
from report_service import ReportGenerationService
from models import (
    SupportedLanguage, CodeSubmission, MultiFileSubmission, 
    CodeReviewResponse, MultiFileReviewResponse, FeedbackItem,
    ReportRequest, ReportFormat, FileInfo
)

load_dotenv()

app = FastAPI(title="Code Review Agent", version="1.0.0")

try:
    ai_service = AIService()
    multi_file_service = MultiFileAnalysisService()
    report_service = ReportGenerationService()
except ValueError as e:
    print(f"Warning: {e}")
    ai_service = None
    multi_file_service = None
    report_service = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Code Review Agent API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/supported-languages")
async def get_supported_languages():
    return {"languages": [lang.value for lang in SupportedLanguage]}

@app.post("/review-code", response_model=CodeReviewResponse)
async def review_code(submission: CodeSubmission):
    """Analyze submitted code and return structured feedback"""
    
    if not ai_service:
        raise HTTPException(
            status_code=500, 
            detail="AI service not available. Please check API key configuration."
        )
    
    if not submission.code.strip():
        raise HTTPException(
            status_code=400,
            detail="Code cannot be empty"
        )
    
    try:
        analysis = ai_service.analyze_code(submission.code, submission.language.value)
        
        feedback_items = [
            FeedbackItem(**item) for item in analysis["feedback"]
        ]
        
        return CodeReviewResponse(
            feedback=feedback_items,
            summary=analysis["summary"],
            overall_score=analysis["overall_score"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing code: {str(e)}"
        )

@app.post("/review-codebase", response_model=MultiFileReviewResponse)
async def review_codebase(submission: MultiFileSubmission):
    """Analyze multiple files with cross-file dependency analysis"""
    
    if not multi_file_service:
        raise HTTPException(
            status_code=500,
            detail="Multi-file analysis service not available. Please check API key configuration."
        )
    
    if not submission.files:
        raise HTTPException(
            status_code=400,
            detail="At least one file must be provided"
        )
    
    for file_info in submission.files:
        if not file_info.content.strip():
            raise HTTPException(
                status_code=400,
                detail=f"File {file_info.filename} cannot be empty"
            )
    
    try:
        analysis = multi_file_service.analyze_codebase(
            submission.files, 
            submission.project_name or "Unnamed Project"
        )
        return analysis
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing codebase: {str(e)}"
        )

@app.post("/upload-files", response_model=MultiFileReviewResponse)
async def upload_and_analyze(files: List[UploadFile] = File(...), project_name: str = "Uploaded Project"):
    """Upload multiple files and analyze them"""
    
    if not multi_file_service:
        raise HTTPException(
            status_code=500,
            detail="Multi-file analysis service not available."
        )
    
    if not files:
        raise HTTPException(
            status_code=400,
            detail="At least one file must be uploaded"
        )
    
    try:
        file_infos = []
        
        for uploaded_file in files:

            content = await uploaded_file.read()
            content_str = content.decode('utf-8')
            
            filename = uploaded_file.filename or "unknown.txt"
            language = ai_service.detect_language_from_filename(filename)
            
            file_infos.append(FileInfo(
                filename=filename,
                content=content_str,
                language=language
            ))
        
        analysis = multi_file_service.analyze_codebase(file_infos, project_name)
        return analysis
        
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Unable to decode file content. Please ensure files are text-based."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing uploaded files: {str(e)}"
        )

@app.post("/generate-report")
async def generate_report(report_request: ReportRequest):
    """Generate and download a report in PDF or Markdown format"""
    
    if not report_service:
        raise HTTPException(
            status_code=500,
            detail="Report generation service not available."
        )
    
    try:
        report_data = report_service.generate_report(
            report_request.review_data,
            report_request.format,
            report_request.include_code
        )
        
        if report_request.format == ReportFormat.PDF:
            media_type = "application/pdf"
            filename = f"{report_request.review_data.project_name}_report.pdf"
        else:
            media_type = "text/markdown"
            filename = f"{report_request.review_data.project_name}_report.md"
        
        return StreamingResponse(
            io.BytesIO(report_data),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating report: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

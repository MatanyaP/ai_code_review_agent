from google import genai
from google.genai import types
import os
from typing import List, Dict, Any
from models import FileInfo, FileFeedback, FeedbackItem, MultiFileReviewResponse
import json


class MultiFileAnalysisService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")

        self.client = genai.Client(api_key=api_key)
        self.model_name = "gemini-2.0-flash-001"

    def analyze_codebase(
        self, files: List[FileInfo], project_name: str
    ) -> MultiFileReviewResponse:
        """Analyze multiple files with cross-file dependency analysis"""

        file_analyses = []
        all_feedback = []

        for file_info in files:
            file_analysis = self.analyze_single_file(file_info, files)
            file_analyses.append(file_analysis)
            all_feedback.extend(file_analysis.feedback)

        cross_file_issues = self.analyze_cross_file_dependencies(files)
        all_feedback.extend(cross_file_issues)

        overall_summary = self.generate_overall_summary(
            file_analyses, cross_file_issues
        )
        overall_score = self.calculate_overall_score(file_analyses)

        return MultiFileReviewResponse(
            project_name=project_name,
            files=file_analyses,
            cross_file_issues=cross_file_issues,
            overall_summary=overall_summary,
            overall_score=overall_score,
            total_files=len(files),
            total_issues=len(all_feedback),
        )

    def analyze_single_file(
        self, file_info: FileInfo, all_files: List[FileInfo]
    ) -> FileFeedback:
        """Analyze a single file with context from other files"""

        file_context = self.create_file_context(all_files, file_info.filename)

        prompt = f"""
        You are an expert code reviewer analyzing a file in a larger codebase.
        
        Current file: {file_info.filename}
        Language: {file_info.language}
        
        File content:
        ```{file_info.language}
        {file_info.content}
        ```
        
        Context from other files in the project:
        {file_context}
        
        Provide analysis in JSON format:
        {{
            "feedback": [
                {{
                    "category": "security|performance|logic|style",
                    "severity": "high|medium|low",
                    "line": number,
                    "message": "Brief description",
                    "suggestion": "Actionable recommendation",
                    "filename": "{file_info.filename}"
                }}
            ],
            "summary": "File-specific assessment",
            "score": number_between_1_and_10
        }}
        
        Focus on:
        - File-specific issues
        - Dependencies and imports
        - Code organization within this file
        - Potential integration issues with other files
        """

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            result = self.parse_ai_response(response.text)

            feedback_items = [
                FeedbackItem(**{**item, "filename": file_info.filename})
                for item in result.get("feedback", [])
            ]

            return FileFeedback(
                filename=file_info.filename,
                feedback=feedback_items,
                summary=result.get("summary", f"Analysis for {file_info.filename}"),
                score=result.get("score", 5),
            )

        except Exception as e:
            return FileFeedback(
                filename=file_info.filename,
                feedback=[
                    FeedbackItem(
                        category="logic",
                        severity="low",
                        line=1,
                        message=f"Analysis error: {str(e)}",
                        suggestion="Please verify file content and try again",
                        filename=file_info.filename,
                    )
                ],
                summary=f"Unable to analyze {file_info.filename}",
                score=5,
            )

    def analyze_cross_file_dependencies(
        self, files: List[FileInfo]
    ) -> List[FeedbackItem]:
        """Analyze cross-file dependencies and architecture issues"""

        if len(files) < 2:
            return []

        files_summary = "\n".join(
            [
                f"File: {f.filename} ({f.language})\n{f.content[:500]}...\n"
                for f in files
            ]
        )

        prompt = f"""
        Analyze the following codebase for cross-file issues and architectural problems.
        
        Files in the project:
        {files_summary}
        
        Look for:
        - Missing imports or dependencies
        - Circular dependencies
        - Inconsistent naming conventions across files
        - Architecture violations
        - Duplicate code across files
        - Missing interfaces or contracts
        
        Return JSON array of cross-file issues:
        [
            {{
                "category": "architecture|dependencies|style|logic",
                "severity": "high|medium|low",
                "line": 1,
                "message": "Cross-file issue description",
                "suggestion": "How to fix across multiple files",
                "filename": "multiple_files"
            }}
        ]
        """

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            result = self.parse_ai_response(response.text)

            if isinstance(result, list):
                return [FeedbackItem(**item) for item in result]
            elif isinstance(result, dict) and "feedback" in result:
                return [FeedbackItem(**item) for item in result["feedback"]]
            else:
                return []

        except Exception as e:
            return [
                FeedbackItem(
                    category="logic",
                    severity="low",
                    line=1,
                    message=f"Cross-file analysis error: {str(e)}",
                    suggestion="Manual review recommended for cross-file dependencies",
                    filename="multiple_files",
                )
            ]

    def create_file_context(
        self, all_files: List[FileInfo], current_filename: str
    ) -> str:
        """Create context string about other files in the project"""

        context_parts = []
        for file_info in all_files:
            if file_info.filename != current_filename:
                lines = file_info.content.split("\n")[:10]
                context_parts.append(f"File: {file_info.filename}\n" + "\n".join(lines))

        return "\n\n".join(context_parts)

    def generate_overall_summary(
        self, file_analyses: List[FileFeedback], cross_file_issues: List[FeedbackItem]
    ) -> str:
        """Generate overall project summary"""

        total_issues = sum(len(fa.feedback) for fa in file_analyses) + len(
            cross_file_issues
        )
        high_severity = sum(
            len([f for f in fa.feedback if f.severity == "high"])
            for fa in file_analyses
        ) + len([f for f in cross_file_issues if f.severity == "high"])

        if total_issues == 0:
            return "Excellent codebase! No significant issues found across all files."
        elif high_severity > 0:
            return f"Codebase needs attention: {total_issues} total issues found, including {high_severity} high-severity issues."
        else:
            return f"Good codebase with room for improvement: {total_issues} minor to medium issues found."

    def calculate_overall_score(self, file_analyses: List[FileFeedback]) -> int:
        """Calculate overall project score"""

        if not file_analyses:
            return 5

        avg_score = sum(fa.score for fa in file_analyses) / len(file_analyses)
        return int(round(avg_score))

    def parse_ai_response(self, response_text: str) -> Dict[str, Any]:
        """Parse AI response with fallback handling"""

        try:
            response_text = response_text.strip()

            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                json_content = response_text[json_start:json_end].strip()
            elif response_text.startswith(("{", "[")):
                json_content = response_text
            else:
                start_brace = response_text.find("{")
                end_brace = response_text.rfind("}") + 1
                if start_brace != -1 and end_brace != 0:
                    json_content = response_text[start_brace:end_brace]
                else:
                    raise ValueError("No valid JSON found")

            return json.loads(json_content)

        except (json.JSONDecodeError, ValueError):
            return {
                "feedback": [
                    {
                        "category": "style",
                        "severity": "medium",
                        "line": 1,
                        "message": "Unable to parse analysis response",
                        "suggestion": "Please try again or check file syntax",
                    }
                ],
                "summary": "Analysis completed with parsing issues",
                "score": 5,
            }


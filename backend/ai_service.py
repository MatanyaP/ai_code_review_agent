from google import genai
from google.genai import types
import os
from typing import List, Dict, Any
from pydantic import BaseModel
import json

from models import SupportedLanguage


class AIService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")

        self.client = genai.Client(api_key=api_key)
        self.model_name = "gemini-2.0-flash-001"

    def analyze_code(self, code: str, language: str) -> Dict[str, Any]:
        """Analyze code using Gemini AI with structured output"""

        prompt = f"""
        You are an expert code reviewer. Analyze the following {language} code and provide structured feedback.

        Code to analyze:
        ```{language}
        {code}
        ```

        Provide your analysis in the following JSON format:
        {{
            "feedback": [
                {{
                    "category": "security|performance|logic|style",
                    "severity": "high|medium|low",
                    "line": number,
                    "message": "Brief description of the issue",
                    "suggestion": "Specific actionable recommendation"
                }}
            ],
            "summary": "Overall assessment of the code",
            "overall_score": number_between_1_and_10
        }}

        Categories:
        - security: Potential vulnerabilities, injection risks, authentication issues
        - performance: Optimization opportunities, efficiency improvements, resource usage
        - logic: Potential bugs, edge cases, logical errors, error handling
        - style: Code formatting, naming conventions, maintainability, best practices

        Severity levels:
        - high: Critical issues that must be fixed
        - medium: Important issues that should be addressed
        - low: Minor improvements or suggestions

        Focus on providing specific, actionable feedback with line numbers where applicable.
        """

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )

            response_text = response.text.strip()

            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                json_content = response_text[json_start:json_end].strip()
            elif response_text.startswith("{"):
                json_content = response_text
            else:
                start_brace = response_text.find("{")
                end_brace = response_text.rfind("}") + 1
                if start_brace != -1 and end_brace != 0:
                    json_content = response_text[start_brace:end_brace]
                else:
                    raise ValueError("No valid JSON found in response")

            result = json.loads(json_content)

            if not isinstance(result, dict) or "feedback" not in result:
                raise ValueError("Invalid response structure")

            if not isinstance(result["feedback"], list):
                result["feedback"] = []

            result.setdefault("summary", "Code analysis completed")
            result.setdefault("overall_score", 5)

            for item in result["feedback"]:
                item.setdefault("line", 1)
                item.setdefault("category", "style")
                item.setdefault("severity", "medium")
                item.setdefault("message", "Issue identified")
                item.setdefault("suggestion", "Consider reviewing this code")

            return result

        except json.JSONDecodeError as e:
            return {
                "feedback": [
                    {
                        "category": "style",
                        "severity": "medium",
                        "line": 1,
                        "message": "Unable to parse AI response, but code was analyzed",
                        "suggestion": "Please try again or check the code syntax",
                    }
                ],
                "summary": "Analysis completed with parsing issues",
                "overall_score": 5,
            }
        except Exception as e:
            return {
                "feedback": [
                    {
                        "category": "logic",
                        "severity": "low",
                        "line": 1,
                        "message": f"Analysis error: {str(e)}",
                        "suggestion": "Please verify your code and try again",
                    }
                ],
                "summary": "Unable to complete full analysis",
                "overall_score": 5,
            }

    @staticmethod
    def detect_language_from_filename(filename: str) -> SupportedLanguage:
        """Detect programming language from file extension"""

        extension = filename.lower().split(".")[-1] if "." in filename else ""

        extension_map = {
            "py": SupportedLanguage.PYTHON,
            "ts": SupportedLanguage.TYPESCRIPT,
            "tsx": SupportedLanguage.TYPESCRIPT,
            "js": SupportedLanguage.JAVASCRIPT,
            "jsx": SupportedLanguage.JAVASCRIPT,
            "java": SupportedLanguage.JAVA,
            "cpp": SupportedLanguage.CPP,
            "cc": SupportedLanguage.CPP,
            "cxx": SupportedLanguage.CPP,
            "c": SupportedLanguage.CPP,
            "h": SupportedLanguage.CPP,
            "hpp": SupportedLanguage.CPP,
            "cs": SupportedLanguage.CSHARP,
        }

        return extension_map.get(extension, SupportedLanguage.PYTHON)

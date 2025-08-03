from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
import markdown
from datetime import datetime
import io
import os
from typing import List, Dict, Any
from models import MultiFileReviewResponse, FeedbackItem, ReportFormat

class ReportGenerationService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()
    
    def setup_custom_styles(self):
        """Setup custom paragraph styles for PDF generation"""
        
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.darkblue,
            spaceAfter=30,
            alignment=TA_CENTER
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.darkblue,
            spaceBefore=20,
            spaceAfter=10
        ))
        
        self.styles.add(ParagraphStyle(
            name='FileHeader',
            parent=self.styles['Heading3'],
            fontSize=14,
            textColor=colors.darkgreen,
            spaceBefore=15,
            spaceAfter=8
        ))
        
        self.styles.add(ParagraphStyle(
            name='IssueText',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceBefore=5,
            spaceAfter=5,
            leftIndent=20
        ))
    
    def generate_report(self, review_data: MultiFileReviewResponse, format: ReportFormat, include_code: bool = True) -> bytes:
        """Generate report in specified format"""
        
        if format == ReportFormat.PDF:
            return self.generate_pdf_report(review_data, include_code)
        elif format == ReportFormat.MARKDOWN:
            return self.generate_markdown_report(review_data, include_code)
        else:
            raise ValueError(f"Unsupported report format: {format}")
    
    def generate_pdf_report(self, review_data: MultiFileReviewResponse, include_code: bool) -> bytes:
        """Generate PDF report using ReportLab"""
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*inch, bottomMargin=1*inch)
        story = []
        
        story.append(Paragraph(f"Code Review Report: {review_data.project_name}", self.styles['CustomTitle']))
        story.append(Spacer(1, 20))
        
        summary_data = [
            ['Report Generated', datetime.now().strftime('%Y-%m-%d %H:%M:%S')],
            ['Total Files', str(review_data.total_files)],
            ['Total Issues', str(review_data.total_issues)],
            ['Overall Score', f"{review_data.overall_score}/10"],
        ]
        
        summary_table = Table(summary_data, colWidths=[2*inch, 3*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(summary_table)
        story.append(Spacer(1, 20))
        
        story.append(Paragraph("Overall Summary", self.styles['SectionHeader']))
        story.append(Paragraph(review_data.overall_summary, self.styles['Normal']))
        story.append(Spacer(1, 15))
        
        if review_data.cross_file_issues:
            story.append(Paragraph("Cross-File Issues", self.styles['SectionHeader']))
            for issue in review_data.cross_file_issues:
                story.append(self.create_issue_paragraph(issue))
            story.append(Spacer(1, 15))
        
        story.append(Paragraph("File Analysis", self.styles['SectionHeader']))
        
        for file_feedback in review_data.files:
            story.append(Paragraph(f"📁 {file_feedback.filename}", self.styles['FileHeader']))
            story.append(Paragraph(f"Score: {file_feedback.score}/10", self.styles['Normal']))
            story.append(Paragraph(file_feedback.summary, self.styles['Normal']))
            story.append(Spacer(1, 10))
            
            if file_feedback.feedback:
                high_issues = [f for f in file_feedback.feedback if f.severity == 'high']
                medium_issues = [f for f in file_feedback.feedback if f.severity == 'medium']
                low_issues = [f for f in file_feedback.feedback if f.severity == 'low']
                
                for severity, issues in [('High', high_issues), ('Medium', medium_issues), ('Low', low_issues)]:
                    if issues:
                        story.append(Paragraph(f"{severity} Priority Issues:", self.styles['Heading4']))
                        for issue in issues:
                            story.append(self.create_issue_paragraph(issue))
                        story.append(Spacer(1, 10))
            else:
                story.append(Paragraph("✅ No issues found in this file.", self.styles['Normal']))
            
            story.append(Spacer(1, 15))
        
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
    
    def create_issue_paragraph(self, issue: FeedbackItem) -> Paragraph:
        """Create a formatted paragraph for an issue"""
        
        severity_color = {
            'high': colors.red,
            'medium': colors.orange,
            'low': colors.blue
        }.get(issue.severity, colors.black)
        
        category_emoji = {
            'security': '🔒',
            'performance': '⚡',
            'logic': '🧠',
            'style': '🎨'
        }.get(issue.category, '📝')
        
        text = f"""
        <b>{category_emoji} {issue.category.upper()} - Line {issue.line}</b><br/>
        <font color="{severity_color.hexval()}"><b>[{issue.severity.upper()}]</b></font> {issue.message}<br/>
        <i>💡 Suggestion: {issue.suggestion}</i>
        """
        
        return Paragraph(text, self.styles['IssueText'])
    
    def generate_markdown_report(self, review_data: MultiFileReviewResponse, include_code: bool) -> bytes:
        """Generate Markdown report"""
        
        md_content = f"""# Code Review Report: {review_data.project_name}

**Report Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Summary

| Metric | Value |
|--------|-------|
| Total Files | {review_data.total_files} |
| Total Issues | {review_data.total_issues} |
| Overall Score | {review_data.overall_score}/10 |

## Overall Assessment

{review_data.overall_summary}

"""

        if review_data.cross_file_issues:
            md_content += """## Cross-File Issues

These issues span multiple files and may indicate architectural concerns:

"""
            for issue in review_data.cross_file_issues:
                md_content += self.format_issue_markdown(issue)
                md_content += "\n"

        md_content += "## File Analysis\n\n"
        
        for file_feedback in review_data.files:
            md_content += f"""### {file_feedback.filename}

**Score:** {file_feedback.score}/10

**Summary:** {file_feedback.summary}

"""
            
            if file_feedback.feedback:
                high_issues = [f for f in file_feedback.feedback if f.severity == 'high']
                medium_issues = [f for f in file_feedback.feedback if f.severity == 'medium']
                low_issues = [f for f in file_feedback.feedback if f.severity == 'low']
                
                for severity, issues, emoji in [
                    ('High', high_issues, '🚨'), 
                    ('Medium', medium_issues, '⚠️'), 
                    ('Low', low_issues, 'ℹ️')
                ]:
                    if issues:
                        md_content += f"#### {emoji} {severity} Priority Issues\n\n"
                        for issue in issues:
                            md_content += self.format_issue_markdown(issue)
                        md_content += "\n"
            else:
                md_content += "✅ **No issues found in this file.**\n\n"
            
            md_content += "---\n\n"
        
        # Footer
        md_content += f"""
---

*Report generated by Code Review Agent*  
*Generated on {datetime.now().strftime('%Y-%m-%d at %H:%M:%S')}*
"""
        
        return md_content.encode('utf-8')
    
    def format_issue_markdown(self, issue: FeedbackItem) -> str:
        """Format an issue for Markdown output"""
        
        category_emoji = {
            'security': '🔒',
            'performance': '⚡',
            'logic': '🧠',
            'style': '🎨'
        }.get(issue.category, '📝')
        
        severity_badge = {
            'high': '![High](https://img.shields.io/badge/severity-high-red)',
            'medium': '![Medium](https://img.shields.io/badge/severity-medium-orange)',
            'low': '![Low](https://img.shields.io/badge/severity-low-blue)'
        }.get(issue.severity, '')
        
        filename_info = f" in `{issue.filename}`" if issue.filename and issue.filename != "multiple_files" else ""
        
        return f"""
**{category_emoji} {issue.category.title()} Issue{filename_info}** {severity_badge}  
**Line {issue.line}:** {issue.message}  
💡 **Suggestion:** {issue.suggestion}

"""

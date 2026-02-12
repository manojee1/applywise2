# ApplyWise - Prompt Logic & AI Strategy

## 1. PDF Text Extraction Prompt (`extract-pdf-text`)

### System Prompt
```
You are a document text extraction assistant. Extract ALL text content from the
provided PDF document exactly as it appears. Preserve the structure, formatting,
and order of the text. Do not summarize, paraphrase, or add any commentary.
Return ONLY the extracted text, nothing else.
```

### User Prompt
```
Please extract all text from this PDF resume document. Return only the raw text
content, preserving the original structure and order.
```

### Design Rationale
- **Low temperature (0.1)**: Extraction should be deterministic, not creative
- **Gemini 2.5 Flash chosen**: Best cost/speed ratio for document understanding; supports PDF as image input
- **Max tokens (4000)**: Sufficient for even lengthy resumes
- **No JSON formatting**: Raw text output avoids parsing overhead

### Known Limitations
- Two-column layouts may interleave columns
- Scanned PDFs depend on Gemini's OCR capability
- Special characters (bullets, em-dashes) may be approximated
- Headers/footers may be included in extraction

---

## 2. Resume Analysis Prompt (`analyze-resume`)

### System Prompt Structure
The system prompt is **dynamically built** based on user-selected options:

#### Base Analysis (always included - Steps 1-6):
1. **Job Description Analysis** - Extract key requirements, location, remote status, salary range
2. **Resume Analysis** - Format, tone, spelling, repetitive terms, action verbs, quantification, honest suitability assessment ("Be brutally honest")
3. **Error Detection** - Typos, spelling, grammar with exact original/corrected pairs
4. **Improvement Suggestions** - Additional changes + ATS keywords integrated naturally
5. **Factual Constraint** - "Do not fabricate any work experience, be factual"
6. **Updated Resume** - Rewritten version incorporating suggestions

#### Optional Steps (toggled by checkboxes):
7. **Cover Letter** (if `showCoverLetters`) - Short, succinct cover letter
8. **LinkedIn Email** (if `showCoverLetters`) - Outreach message for contacts
9. **Interview Prep** (if `showInterviewPrep`) - 10 questions including "Tell me about yourself" and "What are you looking for in your next role?" with strategic answers for senior roles

#### Final Rule (always appended):
- "Do not use em-dashes in any of your responses"

### JSON Output Schema
The response schema is also dynamically built to match selected options:

```json
{
  "jobAnalysis": {
    "keyRequirements": [],
    "location": "",
    "salaryRange": "",
    "remote": boolean
  },
  "resumeAnalysis": {
    "suitable": boolean,
    "honestFeedback": "",
    "improvements": [],
    "typosAndGrammar": [{ "error": "", "fix": "" }],
    "atsKeywords": []
  },
  "updatedResume": "",
  "coverLetter": "",           // optional
  "linkedinEmail": "",         // optional
  "interviewPrep": {           // optional
    "tellMeAboutYourself": "",
    "whatAreYouLookingFor": "",
    "additionalQuestions": [{ "question": "", "answer": "" }]
  }
}
```

### Design Rationale
- **GPT-4.1 model**: Strongest reasoning for nuanced career advice
- **Temperature 0.7**: Balanced between creative suggestions and factual accuracy
- **`response_format: { type: "json_object" }`**: Enforces valid JSON output
- **Max tokens 4000**: Accommodates full analysis + optional sections
- **Multi-pass JSON parsing**: Handles edge cases where model wraps JSON in markdown code blocks

### JSON Parsing Fallback Chain
1. Direct `JSON.parse(content)`
2. Extract from markdown code block: `` ```json ... ``` ``
3. Find first `{` to last `}` substring
4. Fallback: `{ rawAnalysis: content }` (raw text)

---

## 3. Prompt Engineering Principles Used

| Principle | Application |
|---|---|
| Role assignment | "You are a professional and helpful career coach" |
| Brutal honesty directive | "Be brutally honest" about suitability |
| Factual grounding | "Do not fabricate any work experience" |
| Structural constraints | Numbered steps with clear deliverables |
| Output format enforcement | JSON schema + API-level format constraint |
| Style constraints | "Do not use em-dashes" |
| Conditional logic | Dynamic prompt based on user toggles |

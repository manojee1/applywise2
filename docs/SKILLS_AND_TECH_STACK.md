# ApplyWise - Skills & Technology Stack

## Overview
ApplyWise is a resume analysis tool that uses AI to provide actionable feedback on job applications. It compares resumes against job descriptions and delivers structured coaching.

## Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| Tailwind CSS | Utility-first styling |
| shadcn/ui | Component library (Radix primitives) |
| React Router v6 | Client-side routing |
| TanStack React Query | Server state management |
| Lucide React | Icon library |
| Framer Motion (available) | Animation library |

## Backend
| Technology | Purpose |
|---|---|
| Supabase (Lovable Cloud) | Backend-as-a-service |
| Supabase Edge Functions (Deno) | Serverless API endpoints |
| Lovable AI Gateway | Proxied access to Google Gemini models |
| OpenAI API (GPT-4.1) | Resume analysis engine |

## Edge Functions

### `analyze-resume`
- **Model**: OpenAI GPT-4.1 (`gpt-4.1-2025-04-14`)
- **Auth**: JWT verification disabled (public)
- **Purpose**: Full resume-vs-job-description analysis
- **Input**: `{ jobDescription, resumeText, showCoverLetters, showInterviewPrep }`
- **Output**: Structured JSON with job analysis, resume feedback, updated resume, optional cover letter/interview prep

### `extract-pdf-text`
- **Model**: Google Gemini 2.5 Flash via Lovable AI Gateway
- **Auth**: JWT verification disabled (public)
- **Purpose**: Extract raw text from uploaded PDF resumes
- **Input**: `{ pdfBase64 }` (base64-encoded PDF)
- **Output**: `{ text }` (extracted plain text)

## Database (Supabase/Postgres)
| Table | Purpose |
|---|---|
| `profiles` | User profile data |
| `user_usage` | Rate limiting / usage tracking per endpoint |

## Key Architectural Decisions
1. **PDF extraction is separate from analysis** - allows users to review/edit extracted text before spending tokens on analysis
2. **No authentication required** - edge functions are public (`verify_jwt = false`)
3. **Client-side word count validation** - prevents sending oversized payloads (900 words JD, 1000 words resume)
4. **JSON response format enforced** - `response_format: { type: "json_object" }` ensures parseable output from GPT-4.1

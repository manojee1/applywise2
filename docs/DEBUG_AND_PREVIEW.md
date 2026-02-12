# ApplyWise - Debug & Preview Mode

## Development Environment

### Preview Mode (Lovable)
- **Live preview URL**: `https://id-preview--0855f053-75fb-4a99-a42f-880cf9b20035.lovable.app`
- **Published URL**: `https://applywise2.lovable.app`
- Changes are reflected instantly in the preview iframe
- Edge functions are deployed and testable against the preview environment

### Debugging Tools Available

#### 1. Console Logs
- Browser console logs from the preview iframe
- Edge function logs via Supabase analytics
- Filter by `error`, `warning`, `info`

#### 2. Network Request Inspection
- Monitor Supabase edge function calls
- Check request/response payloads
- Verify status codes (200, 402, 429, 500)

#### 3. Edge Function Logs
- `supabase--edge-function-logs` for `analyze-resume` and `extract-pdf-text`
- Shows `console.log` and `console.error` output from Deno runtime

#### 4. Direct Edge Function Testing
- `supabase--curl_edge_functions` to call functions directly
- Bypasses the UI for isolated testing

---

## Error Handling Strategy

### PDF Extraction (`extract-pdf-text`)
| Status | Meaning | User Message |
|---|---|---|
| 200 | Success | "PDF text extracted!" |
| 402 | Credits exhausted | "AI credits exhausted. Please add funds to continue." |
| 429 | Rate limited | "Rate limit exceeded. Please try again in a moment." |
| 500 | Server error | Shows error message from function |

### Resume Analysis (`analyze-resume`)
| Status | Meaning | User Message |
|---|---|---|
| 200 | Success | Navigates to `/results` |
| 500 | OpenAI API error or missing key | Shows error message |

### Client-Side Validations
| Check | Limit | Behavior |
|---|---|---|
| Job description word count | 900 words | Toast warning + field selected on blur |
| Resume text word count | 1000 words | Toast warning + field selected on blur |
| Empty job description | Required | Toast error, blocks submission |
| Empty resume text | Required | Toast error, blocks submission |
| PDF file type | `.pdf` only | Toast error, input cleared |
| PDF file size | 10MB max | Toast error, input cleared |

---

## Testing Checklist (Manual)

### PDF Upload Flow
- [ ] Upload valid single-page PDF - text extracted correctly
- [ ] Upload valid multi-page PDF - all pages extracted
- [ ] Upload non-PDF file - error toast shown
- [ ] Upload PDF > 10MB - error toast shown
- [ ] Upload two-column resume - verify column text ordering
- [ ] Clear uploaded PDF - text area and filename reset
- [ ] Edit extracted text before analysis - changes preserved

### Analysis Flow
- [ ] Submit with both fields filled - analysis completes
- [ ] Submit with empty job description - error toast
- [ ] Submit with empty resume - error toast
- [ ] Submit with > 900 word JD - warning toast
- [ ] Submit with > 1000 word resume - warning toast
- [ ] Toggle cover letter checkbox - results include cover letter
- [ ] Toggle interview prep checkbox - results include interview prep
- [ ] Analysis progress overlay appears during processing
- [ ] Results page displays all sections correctly

### Edge Cases
- [ ] Network timeout during extraction
- [ ] Network timeout during analysis
- [ ] Rate limit (429) during extraction
- [ ] Invalid JSON response from GPT - fallback parsing works

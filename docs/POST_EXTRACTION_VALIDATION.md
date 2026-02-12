# ApplyWise - Post-Extraction Validation

## Overview
After PDF text extraction via Gemini 2.5 Flash, we validate the output quality using two complementary approaches:

1. **User-facing checklist** - Quick visual confirmation that key sections were captured
2. **Automated AI validation** - Programmatic checks for completeness and accuracy

---

## 1. User-Facing Checklist

After PDF extraction, the UI displays a checklist of expected resume sections. The user confirms which sections were captured correctly.

### Sections Checked
| Section | Detection Method | Why It Matters |
|---|---|---|
| Name / Contact Info | Look for email pattern, phone pattern | Identity must be present |
| Work Experience | Header keywords: "experience", "employment", "work history" | Core resume content |
| Education | Header keywords: "education", "degree", "university" | Required for most roles |
| Skills | Header keywords: "skills", "technologies", "proficiencies" | ATS keyword matching depends on this |
| Dates | Regex for year patterns (20XX, 19XX) | Timeline integrity |

### User Actions
- **All checked**: Proceed to analysis with confidence
- **Some missing**: User can manually edit the text area to add missing content
- **Major issues**: User re-uploads or pastes manually

---

## 2. Automated Validation (Programmatic)

These checks run automatically on the extracted text before the user even reviews it.

### Checks Performed

#### a. Minimum Content Check
```
Word count >= 50
```
- A real resume should have at least 50 words
- If under 50, likely a failed extraction (scanned image, encrypted PDF)

#### b. Contact Info Detection
```regex
Email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
Phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/
```
- At least one of email or phone should be present
- Missing both suggests header was not extracted

#### c. Section Header Detection
```regex
/(experience|education|skills|summary|objective|certifications|projects)/i
```
- Expect at least 2 of these section headers
- Fewer than 2 suggests structural extraction failure

#### d. Date Presence
```regex
/(19|20)\d{2}/
```
- Resumes almost always contain year references
- Missing dates suggests content was lost

#### e. Garbage Character Detection
```regex
/[^\x20-\x7E\n\r\t]/g  (non-ASCII characters)
```
- High ratio of non-printable characters indicates OCR/encoding issues
- Threshold: > 5% non-ASCII is flagged as suspicious

### Validation Result Object
```typescript
interface ExtractionValidation {
  isValid: boolean;           // all critical checks pass
  wordCount: number;
  hasContactInfo: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  sectionHeadersFound: string[];
  hasDates: boolean;
  garbageCharRatio: number;
  warnings: string[];         // human-readable issues
}
```

### Warning Messages
| Condition | Warning |
|---|---|
| wordCount < 50 | "Very little text extracted. The PDF may be image-based or encrypted." |
| !hasContactInfo | "No email or phone number detected. Check if your contact info was captured." |
| sectionHeadersFound.length < 2 | "Few section headers found. The resume structure may not have been preserved." |
| !hasDates | "No dates detected. Work history timeline may be missing." |
| garbageCharRatio > 0.05 | "High proportion of unusual characters detected. Text quality may be poor." |

---

## 3. Implementation Location

### Validation Utility
- **File**: `src/utils/extractionValidator.ts`
- Pure function, no side effects
- Called immediately after `extract-pdf-text` returns

### UI Component
- **File**: `src/components/ExtractionChecklist.tsx`
- Renders validation results as a visual checklist
- Shown between PDF upload and resume text area
- Color-coded: green (pass), yellow (warning), red (fail)

---

## 4. Evaluation Metrics (for ongoing quality monitoring)

If tracking extraction quality over time:

| Metric | Measurement |
|---|---|
| **Extraction Success Rate** | % of uploads where wordCount >= 50 |
| **Contact Detection Rate** | % of extractions with email or phone found |
| **Structure Preservation Rate** | % with >= 2 section headers detected |
| **User Edit Rate** | % of users who modify extracted text before analysis |
| **Re-upload Rate** | % of users who clear and re-upload |

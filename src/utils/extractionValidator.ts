export interface ExtractionValidation {
  isValid: boolean;
  wordCount: number;
  hasContactInfo: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  sectionHeadersFound: string[];
  hasDates: boolean;
  garbageCharRatio: number;
  warnings: string[];
}

const SECTION_KEYWORDS = [
  "experience",
  "education",
  "skills",
  "summary",
  "objective",
  "certifications",
  "projects",
  "employment",
  "work history",
  "qualifications",
  "proficiencies",
  "achievements",
];

export function validateExtraction(text: string): ExtractionValidation {
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;

  // Contact info
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text);
  const hasContactInfo = hasEmail || hasPhone;

  // Section headers
  const lowerText = text.toLowerCase();
  const sectionHeadersFound = SECTION_KEYWORDS.filter((kw) =>
    lowerText.includes(kw)
  );

  // Dates
  const hasDates = /(19|20)\d{2}/.test(text);

  // Garbage characters
  const nonAscii = text.replace(/[\x20-\x7E\n\r\t]/g, "");
  const garbageCharRatio = text.length > 0 ? nonAscii.length / text.length : 0;

  // Build warnings
  const warnings: string[] = [];
  if (wordCount < 50) {
    warnings.push(
      "Very little text extracted. The PDF may be image-based or encrypted."
    );
  }
  if (!hasContactInfo) {
    warnings.push(
      "No email or phone number detected. Check if your contact info was captured."
    );
  }
  if (sectionHeadersFound.length < 2) {
    warnings.push(
      "Few section headers found. The resume structure may not have been preserved."
    );
  }
  if (!hasDates) {
    warnings.push(
      "No dates detected. Work history timeline may be missing."
    );
  }
  if (garbageCharRatio > 0.05) {
    warnings.push(
      "High proportion of unusual characters detected. Text quality may be poor."
    );
  }

  const isValid = wordCount >= 50 && warnings.length <= 1;

  return {
    isValid,
    wordCount,
    hasContactInfo,
    hasEmail,
    hasPhone,
    sectionHeadersFound,
    hasDates,
    garbageCharRatio,
    warnings,
  };
}

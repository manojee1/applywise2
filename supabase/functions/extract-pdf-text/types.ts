
export interface ExtractedText {
  text: string;
  source: 'parentheses' | 'brackets' | 'text-blocks';
}

export interface PDFParseResult {
  extractedTexts: string[];
  totalSegments: number;
}

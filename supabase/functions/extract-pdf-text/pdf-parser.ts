
import { extractTextInParentheses, extractTextInBrackets, extractTextBlocks } from './text-extractor.ts';
import { finalizeText } from './text-cleaner.ts';
import type { PDFParseResult } from './types.ts';

export async function extractTextFromPDF(pdfBytes: Uint8Array): Promise<string> {
  try {
    // Convert bytes to string for text pattern matching
    const decoder = new TextDecoder('latin1'); // Use latin1 to preserve byte values
    const pdfString = decoder.decode(pdfBytes);
    
    console.log('PDF string length:', pdfString.length);
    
    // Extract all text strings from the PDF
    const extractedTexts: string[] = [];
    
    // Pattern 1: Look for text in parentheses - basic text strings
    const parenthesesTexts = extractTextInParentheses(pdfString);
    extractedTexts.push(...parenthesesTexts);
    
    // Pattern 2: Look for text in angle brackets - hex encoded strings
    const bracketsTexts = extractTextInBrackets(pdfString);
    extractedTexts.push(...bracketsTexts);
    
    // Pattern 3: Look for text between BT and ET operators (text blocks)
    const blockTexts = extractTextBlocks(pdfString);
    extractedTexts.push(...blockTexts);
    
    console.log('Total extracted text segments:', extractedTexts.length);
    
    const finalText = finalizeText(extractedTexts);
    console.log('Final extracted text length:', finalText.length);
    
    return finalText;
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

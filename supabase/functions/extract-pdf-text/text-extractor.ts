
import { cleanExtractedText, decodeHexText, isReadableText } from './text-cleaner.ts';

export function extractTextInParentheses(pdfString: string): string[] {
  const extractedTexts: string[] = [];
  const textInParentheses = pdfString.match(/\(([^)]+)\)/g);
  
  if (textInParentheses) {
    console.log('Found text in parentheses:', textInParentheses.length);
    for (const match of textInParentheses) {
      const text = match.slice(1, -1); // Remove parentheses
      const cleanText = cleanExtractedText(text);
      if (cleanText.length > 1 && isReadableText(cleanText)) {
        extractedTexts.push(cleanText);
      }
    }
  }
  
  return extractedTexts;
}

export function extractTextInBrackets(pdfString: string): string[] {
  const extractedTexts: string[] = [];
  const textInBrackets = pdfString.match(/<([^>]+)>/g);
  
  if (textInBrackets) {
    console.log('Found text in brackets:', textInBrackets.length);
    for (const match of textInBrackets) {
      const hexText = match.slice(1, -1); // Remove brackets
      const decodedText = decodeHexText(hexText);
      if (decodedText && decodedText.length > 1 && isReadableText(decodedText)) {
        extractedTexts.push(decodedText);
      }
    }
  }
  
  return extractedTexts;
}

export function extractTextFromBlock(block: string): string[] {
  const texts: string[] = [];
  
  // Look for Tj and TJ operators with better regex
  const tjMatches = block.match(/\(([^)]*)\)\s*Tj/g);
  if (tjMatches) {
    for (const match of tjMatches) {
      const text = match.match(/\(([^)]*)\)/);
      if (text) {
        const cleanText = cleanExtractedText(text[1]);
        if (cleanText.length > 0 && isReadableText(cleanText)) {
          texts.push(cleanText);
        }
      }
    }
  }
  
  // Look for TJ operators with arrays
  const tjArrayMatches = block.match(/\[([^\]]*)\]\s*TJ/g);
  if (tjArrayMatches) {
    for (const match of tjArrayMatches) {
      const arrayContent = match.match(/\[([^\]]*)\]/);
      if (arrayContent) {
        const stringMatches = arrayContent[1].match(/\(([^)]*)\)/g);
        if (stringMatches) {
          for (const stringMatch of stringMatches) {
            const text = stringMatch.slice(1, -1);
            const cleanText = cleanExtractedText(text);
            if (cleanText.length > 0 && isReadableText(cleanText)) {
              texts.push(cleanText);
            }
          }
        }
      }
    }
  }
  
  // Also extract simple text strings not in operators
  const simpleTextMatches = block.match(/\(([^)]+)\)/g);
  if (simpleTextMatches) {
    for (const match of simpleTextMatches) {
      const text = match.slice(1, -1);
      const cleanText = cleanExtractedText(text);
      if (cleanText.length > 0 && isReadableText(cleanText) && !texts.includes(cleanText)) {
        texts.push(cleanText);
      }
    }
  }
  
  return texts;
}

export function extractTextBlocks(pdfString: string): string[] {
  const extractedTexts: string[] = [];
  const textBlocks = pdfString.match(/BT\s+([^]*?)\s+ET/g);
  
  if (textBlocks) {
    console.log('Found text blocks:', textBlocks.length);
    for (const block of textBlocks) {
      const blockTexts = extractTextFromBlock(block);
      extractedTexts.push(...blockTexts);
    }
  }
  
  return extractedTexts;
}

export function cleanExtractedText(text: string): string {
  if (!text) return '';
  
  let cleaned = text
    // Handle common PDF escape sequences
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\\\/g, '\\')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    // Handle octal escape sequences
    .replace(/\\([0-7]{3})/g, (match, octal) => {
      const charCode = parseInt(octal, 8);
      return charCode >= 32 && charCode <= 126 ? String.fromCharCode(charCode) : ' ';
    })
    // Handle Unicode escape sequences
    .replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
      const charCode = parseInt(hex, 16);
      return charCode >= 32 && charCode <= 126 ? String.fromCharCode(charCode) : ' ';
    })
    // Replace non-printable characters but keep common punctuation
    .replace(/[^\x20-\x7E\u00A0-\u017F\u0100-\u024F]/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
    
  return cleaned;
}

export function decodeHexText(hexText: string): string {
  try {
    if (!hexText || hexText.length % 2 !== 0) {
      return '';
    }
    
    let result = '';
    for (let i = 0; i < hexText.length; i += 2) {
      const hexPair = hexText.substr(i, 2);
      const charCode = parseInt(hexPair, 16);
      
      // Include more character ranges for better text extraction
      if ((charCode >= 32 && charCode <= 126) || 
          (charCode >= 160 && charCode <= 255)) {
        result += String.fromCharCode(charCode);
      } else if (charCode === 10 || charCode === 13) {
        result += ' '; // Convert line breaks to spaces
      } else {
        result += ' ';
      }
    }
    return result.trim();
  } catch (error) {
    console.error('Error decoding hex text:', error);
    return '';
  }
}

export function isReadableText(text: string): boolean {
  if (!text || text.length === 0) return false;
  
  // Check if text contains readable characters (letters, numbers, common punctuation)
  const readableChars = text.match(/[a-zA-Z0-9.,!?;:\-()[\]{}@#$%&*+=<>]/g);
  const totalChars = text.replace(/\s/g, '').length;
  
  if (totalChars === 0) return false;
  
  // At least 30% of non-space characters should be readable
  const readableRatio = readableChars ? readableChars.length / totalChars : 0;
  return readableRatio >= 0.3 && text.length >= 2;
}

export function finalizeText(extractedTexts: string[]): string {
  if (extractedTexts.length === 0) {
    throw new Error('No readable text found in PDF. The PDF may be image-based or encrypted.');
  }
  
  // Remove duplicates and very short texts
  const uniqueTexts = [...new Set(extractedTexts.filter(text => text.length >= 2))];
  
  // Sort by length to prioritize longer, more meaningful text segments
  uniqueTexts.sort((a, b) => b.length - a.length);
  
  // Join all extracted text with proper spacing
  let fullText = uniqueTexts.join(' ');
  
  // Final cleanup
  fullText = fullText
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase words
    .replace(/([0-9])([A-Za-z])/g, '$1 $2') // Add space between numbers and letters
    .replace(/([A-Za-z])([0-9])/g, '$1 $2') // Add space between letters and numbers
    .trim();
  
  if (fullText.length < 10) {
    throw new Error('Insufficient text extracted from PDF. The PDF may be image-based or corrupted.');
  }
  
  // Limit text length to prevent issues
  if (fullText.length > 15000) {
    fullText = fullText.substring(0, 15000) + '... [truncated]';
  }
  
  console.log('Final processed text preview:', fullText.substring(0, 200));
  
  return fullText;
}

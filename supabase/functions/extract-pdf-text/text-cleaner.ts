
export function cleanExtractedText(text: string): string {
  return text
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\\\/g, '\\')
    .replace(/\\([0-7]{3})/g, (match, octal) => {
      // Convert octal escape sequences to characters
      const charCode = parseInt(octal, 8);
      return charCode >= 32 && charCode <= 126 ? String.fromCharCode(charCode) : ' ';
    })
    .replace(/[^\x20-\x7E]/g, ' ') // Replace non-printable characters with spaces
    .replace(/\s+/g, ' ')
    .trim();
}

export function decodeHexText(hexText: string): string {
  try {
    if (hexText.length % 2 !== 0) {
      return '';
    }
    
    let result = '';
    for (let i = 0; i < hexText.length; i += 2) {
      const hexPair = hexText.substr(i, 2);
      const charCode = parseInt(hexPair, 16);
      if (charCode >= 32 && charCode <= 126) {
        result += String.fromCharCode(charCode);
      } else {
        result += ' ';
      }
    }
    return result.trim();
  } catch (error) {
    return '';
  }
}

export function isReadableText(text: string): boolean {
  // Check if text contains readable characters
  const readableChars = text.match(/[a-zA-Z0-9]/g);
  return readableChars && readableChars.length >= text.length * 0.3;
}

export function finalizeText(extractedTexts: string[]): string {
  if (extractedTexts.length === 0) {
    throw new Error('No readable text found in PDF. The PDF may be image-based or encrypted.');
  }
  
  // Join all extracted text and clean it up
  let fullText = extractedTexts.join(' ');
  
  // Final cleanup
  fullText = fullText
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  if (fullText.length < 10) {
    throw new Error('Insufficient text extracted from PDF. The PDF may be image-based or corrupted.');
  }
  
  // Limit text length to prevent issues
  if (fullText.length > 15000) {
    fullText = fullText.substring(0, 15000) + '... [truncated]';
  }
  
  return fullText;
}

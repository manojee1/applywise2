
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const pdfFile = formData.get('pdf') as File;

    if (!pdfFile) {
      return new Response(JSON.stringify({ error: 'No PDF file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (pdfFile.type !== 'application/pdf') {
      return new Response(JSON.stringify({ error: 'File must be a PDF' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing PDF file:', pdfFile.name, 'Size:', pdfFile.size, 'bytes');

    // Convert PDF file to ArrayBuffer
    const pdfBuffer = await pdfFile.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfBuffer);

    console.log('PDF buffer size:', pdfBytes.length);

    // Extract text from PDF
    const pdfText = await extractTextFromPDF(pdfBytes);

    console.log('PDF text extraction completed, extracted text length:', pdfText.length);

    return new Response(JSON.stringify({ text: pdfText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in extract-pdf-text function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function extractTextFromPDF(pdfBytes: Uint8Array): Promise<string> {
  try {
    // Convert bytes to string for text pattern matching
    const decoder = new TextDecoder('latin1'); // Use latin1 to preserve byte values
    const pdfString = decoder.decode(pdfBytes);
    
    console.log('PDF string length:', pdfString.length);
    
    // Extract all text strings from the PDF
    const extractedTexts: string[] = [];
    
    // Pattern 1: Look for text in parentheses - basic text strings
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
    
    // Pattern 2: Look for text in angle brackets - hex encoded strings
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
    
    // Pattern 3: Look for text between BT and ET operators (text blocks)
    const textBlocks = pdfString.match(/BT\s+([^]*?)\s+ET/g);
    if (textBlocks) {
      console.log('Found text blocks:', textBlocks.length);
      for (const block of textBlocks) {
        const blockTexts = extractTextFromBlock(block);
        extractedTexts.push(...blockTexts);
      }
    }
    
    console.log('Total extracted text segments:', extractedTexts.length);
    
    if (extractedTexts.length === 0) {
      throw new Error('No readable text found in PDF. The PDF may be image-based or encrypted.');
    }
    
    // Join all extracted text and clean it up
    let fullText = extractedTexts.join(' ');
    
    // Final cleanup
    fullText = fullText
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    console.log('Final extracted text length:', fullText.length);
    
    if (fullText.length < 10) {
      throw new Error('Insufficient text extracted from PDF. The PDF may be image-based or corrupted.');
    }
    
    // Limit text length to prevent issues
    if (fullText.length > 15000) {
      fullText = fullText.substring(0, 15000) + '... [truncated]';
    }
    
    return fullText;
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

function cleanExtractedText(text: string): string {
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

function decodeHexText(hexText: string): string {
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

function extractTextFromBlock(block: string): string[] {
  const texts: string[] = [];
  
  // Look for Tj and TJ operators
  const tjMatches = block.match(/\(([^)]*)\)\s*Tj/g);
  if (tjMatches) {
    for (const match of tjMatches) {
      const text = match.match(/\(([^)]*)\)/);
      if (text) {
        const cleanText = cleanExtractedText(text[1]);
        if (cleanText.length > 1 && isReadableText(cleanText)) {
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
            if (cleanText.length > 1 && isReadableText(cleanText)) {
              texts.push(cleanText);
            }
          }
        }
      }
    }
  }
  
  return texts;
}

function isReadableText(text: string): boolean {
  // Check if text contains readable characters
  const readableChars = text.match(/[a-zA-Z0-9]/g);
  return readableChars && readableChars.length >= text.length * 0.3;
}

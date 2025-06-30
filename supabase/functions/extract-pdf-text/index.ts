
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
      throw new Error('No PDF file provided');
    }

    if (pdfFile.type !== 'application/pdf') {
      throw new Error('File must be a PDF');
    }

    console.log('Processing PDF file:', pdfFile.name, 'Size:', pdfFile.size, 'bytes');

    // Convert PDF file to ArrayBuffer
    const pdfBuffer = await pdfFile.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfBuffer);

    console.log('PDF buffer size:', pdfBytes.length);

    // Extract text from PDF
    const pdfText = await extractTextFromPDF(pdfBytes);

    console.log('PDF text extraction completed, extracted text length:', pdfText.length);
    console.log('First 200 chars of extracted text:', pdfText.substring(0, 200));

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
    console.log('Starting PDF text extraction...');
    
    // Convert PDF bytes to a string for parsing (using latin1 to preserve bytes)
    let pdfContent = '';
    for (let i = 0; i < pdfBytes.length; i++) {
      pdfContent += String.fromCharCode(pdfBytes[i]);
    }
    
    console.log('PDF content length:', pdfContent.length);
    
    const textParts: string[] = [];
    
    // Method 1: Extract text from stream objects
    const streamPattern = /stream\s*([\s\S]*?)\s*endstream/g;
    let streamMatch;
    let streamCount = 0;
    
    while ((streamMatch = streamPattern.exec(pdfContent)) !== null) {
      streamCount++;
      const streamData = streamMatch[1];
      
      // Look for text operations within the stream
      const textBlocks = extractTextFromStream(streamData);
      textParts.push(...textBlocks);
    }
    
    console.log(`Processed ${streamCount} streams`);
    
    // Method 2: Look for text outside of streams (direct text objects)
    const directTextPattern = /BT\s*([\s\S]*?)\s*ET/g;
    let directMatch;
    let directCount = 0;
    
    while ((directMatch = directTextPattern.exec(pdfContent)) !== null) {
      directCount++;
      const textBlock = directMatch[1];
      const textParts2 = extractTextFromTextBlock(textBlock);
      textParts.push(...textParts2);
    }
    
    console.log(`Found ${directCount} direct text blocks`);
    
    // Clean and combine all text parts
    const cleanedParts = textParts
      .map(part => cleanText(part))
      .filter(part => part.length > 0 && /[a-zA-Z0-9]/.test(part));
    
    console.log(`Extracted ${cleanedParts.length} text segments`);
    
    if (cleanedParts.length === 0) {
      // Try a more aggressive approach - look for any parentheses content
      const fallbackPattern = /\(([^)]*)\)/g;
      let fallbackMatch;
      
      while ((fallbackMatch = fallbackPattern.exec(pdfContent)) !== null) {
        const text = cleanText(fallbackMatch[1]);
        if (text.length > 1 && /[a-zA-Z]/.test(text)) {
          cleanedParts.push(text);
        }
      }
      
      console.log(`Fallback method found ${cleanedParts.length} text segments`);
    }
    
    if (cleanedParts.length === 0) {
      throw new Error('No readable text found in PDF. This may be a scanned document (image-based PDF) or use an unsupported text encoding. Please try: 1) Converting to a searchable PDF, 2) Using OCR software, or 3) Manually copying the text.');
    }
    
    // Join all text parts
    let extractedText = cleanedParts.join(' ').replace(/\s+/g, ' ').trim();
    
    // Limit text length to prevent API issues
    if (extractedText.length > 12000) {
      extractedText = extractedText.substring(0, 12000) + '... [truncated]';
      console.log('Text truncated to prevent API limits');
    }
    
    console.log('Final extracted text length:', extractedText.length);
    console.log('Text sample:', extractedText.substring(0, 200) + '...');
    
    return extractedText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw error;
  }
}

function extractTextFromStream(streamData: string): string[] {
  const textParts: string[] = [];
  
  // Look for text blocks within the stream
  const textBlockPattern = /BT\s*([\s\S]*?)\s*ET/g;
  let match;
  
  while ((match = textBlockPattern.exec(streamData)) !== null) {
    const textBlock = match[1];
    const parts = extractTextFromTextBlock(textBlock);
    textParts.push(...parts);
  }
  
  return textParts;
}

function extractTextFromTextBlock(textBlock: string): string[] {
  const textParts: string[] = [];
  
  // Method 1: Look for (text) Tj patterns
  const tjPattern = /\(([^)]*)\)\s*Tj/g;
  let match;
  
  while ((match = tjPattern.exec(textBlock)) !== null) {
    textParts.push(match[1]);
  }
  
  // Method 2: Look for [(text)] TJ patterns (array format)
  const tjArrayPattern = /\[([^\]]*)\]\s*TJ/g;
  while ((match = tjArrayPattern.exec(textBlock)) !== null) {
    const arrayContent = match[1];
    const stringMatches = arrayContent.match(/\(([^)]*)\)/g);
    if (stringMatches) {
      stringMatches.forEach(str => {
        textParts.push(str.slice(1, -1)); // Remove parentheses
      });
    }
  }
  
  // Method 3: Look for simple (text) patterns
  const simpleTextPattern = /\(([^)]*)\)/g;
  while ((match = simpleTextPattern.exec(textBlock)) !== null) {
    textParts.push(match[1]);
  }
  
  return textParts;
}

function cleanText(text: string): string {
  return text
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\\\/g, '\\')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\([0-7]{3})/g, (match, octal) => {
      try {
        return String.fromCharCode(parseInt(octal, 8));
      } catch {
        return '';
      }
    })
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ')
    .trim();
}

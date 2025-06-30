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
    // Convert bytes to string for text extraction - using UTF-8 decoder
    const pdfString = new TextDecoder('utf-8', { fatal: false }).decode(pdfBytes);
    console.log('PDF string length:', pdfString.length);
    
    const textBlocks: string[] = [];
    
    // Method 1: Look for text between parentheses in PDF streams
    // This is the most common way text is stored in PDFs
    const textInParentheses = /\(([^)]+)\)/g;
    let match;
    
    while ((match = textInParentheses.exec(pdfString)) !== null) {
      const text = match[1];
      // Filter out control characters and keep only printable text
      const cleanText = text
        .replace(/\\n/g, ' ')
        .replace(/\\r/g, ' ')
        .replace(/\\t/g, ' ')
        .replace(/\\\\/g, '\\')
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
        .trim();
      
      // Only include text that has actual letters and is reasonably long
      if (cleanText.length > 2 && /[a-zA-Z]/.test(cleanText)) {
        textBlocks.push(cleanText);
      }
    }
    
    console.log(`Found ${textBlocks.length} text segments from parentheses method`);
    
    // Method 2: Look for text in array format [(text)] TJ
    const arrayTextRegex = /\[([^\]]*)\]\s*TJ/g;
    while ((match = arrayTextRegex.exec(pdfString)) !== null) {
      const arrayContent = match[1];
      const textMatches = arrayContent.match(/\(([^)]*)\)/g);
      if (textMatches) {
        textMatches.forEach(text => {
          const cleanText = text.slice(1, -1) // Remove parentheses
            .replace(/\\n/g, ' ')
            .replace(/\\r/g, ' ')
            .replace(/\\t/g, ' ')
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
            .trim();
          
          if (cleanText.length > 2 && /[a-zA-Z]/.test(cleanText)) {
            textBlocks.push(cleanText);
          }
        });
      }
    }
    
    console.log(`Total text segments found: ${textBlocks.length}`);
    
    // Method 3: Fallback - look for readable text patterns
    if (textBlocks.length === 0) {
      console.log('No text found with standard methods, trying fallback...');
      
      // Look for sequences of readable characters
      const readableTextRegex = /[A-Za-z][A-Za-z\s.,!?;:'"()-]{10,}/g;
      const readableMatches = pdfString.match(readableTextRegex);
      
      if (readableMatches) {
        readableMatches.forEach(text => {
          const cleanText = text.replace(/\s+/g, ' ').trim();
          if (cleanText.length > 10) {
            textBlocks.push(cleanText);
          }
        });
      }
    }
    
    // Join all text blocks and clean up
    let extractedText = textBlocks
      .join(' ')
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    console.log(`Final extracted text length: ${extractedText.length}`);
    
    // If we still don't have meaningful text, throw an error
    if (!extractedText || extractedText.length < 50) {
      throw new Error('Unable to extract readable text from PDF. This PDF may be image-based, password-protected, or have an unsupported format. Please try converting it to a text-based PDF or use OCR to extract the text first.');
    }
    
    // Limit the text length to prevent token issues (max ~15,000 characters)
    if (extractedText.length > 15000) {
      extractedText = extractedText.substring(0, 15000) + '... [text truncated due to length]';
      console.log('Text truncated to prevent token limit issues');
    }
    
    console.log('Successfully extracted text:', extractedText.substring(0, 100) + '...');
    return extractedText;
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
}

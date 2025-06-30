
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
    // Convert bytes to string for text extraction
    const pdfString = new TextDecoder('latin1').decode(pdfBytes);
    console.log('PDF string length:', pdfString.length);
    
    const textBlocks: string[] = [];
    
    // Method 1: Extract text from BT/ET blocks (Begin Text/End Text operators)
    const textRegex = /BT\s*([\s\S]*?)\s*ET/g;
    let match;
    let btEtBlocks = 0;
    
    while ((match = textRegex.exec(pdfString)) !== null) {
      btEtBlocks++;
      let textContent = match[1];
      
      // Extract text from Tj operators - (text) Tj
      const tjRegex = /\(([^)]*)\)\s*Tj/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(textContent)) !== null) {
        const text = tjMatch[1];
        if (text && text.trim().length > 0) {
          textBlocks.push(text.trim());
        }
      }
      
      // Extract text from TJ operators - [(text)] TJ
      const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
      while ((tjMatch = tjArrayRegex.exec(textContent)) !== null) {
        const arrayContent = tjMatch[1];
        // Parse array format and extract text
        const textMatches = arrayContent.match(/\(([^)]*)\)/g);
        if (textMatches) {
          textMatches.forEach(text => {
            const cleanText = text.slice(1, -1).trim(); // Remove parentheses
            if (cleanText.length > 0) {
              textBlocks.push(cleanText);
            }
          });
        }
      }
    }
    
    console.log(`Found ${btEtBlocks} BT/ET blocks, extracted ${textBlocks.length} text segments`);
    
    // Method 2: Extract text from stream objects
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
    let streamCount = 0;
    while ((match = streamRegex.exec(pdfString)) !== null) {
      streamCount++;
      const streamContent = match[1];
      
      // Look for text in parentheses within streams
      const textMatches = streamContent.match(/\(([^)]+)\)/g);
      if (textMatches) {
        textMatches.forEach(text => {
          const cleanText = text.slice(1, -1).trim(); // Remove parentheses
          if (cleanText.length > 2 && /[a-zA-Z]/.test(cleanText)) { // Only meaningful text with letters
            textBlocks.push(cleanText);
          }
        });
      }
    }
    
    console.log(`Found ${streamCount} stream objects`);
    
    // Method 3: Look for text objects and strings
    const textObjectRegex = /\/F\d+\s+\d+\s+Tf\s*([^/]*?)(?=\/F\d+|\s*endstream|\s*ET)/g;
    while ((match = textObjectRegex.exec(pdfString)) !== null) {
      const textContent = match[1];
      const textMatches = textContent.match(/\(([^)]+)\)/g);
      if (textMatches) {
        textMatches.forEach(text => {
          const cleanText = text.slice(1, -1).trim();
          if (cleanText.length > 0 && /[a-zA-Z]/.test(cleanText)) {
            textBlocks.push(cleanText);
          }
        });
      }
    }
    
    // Method 4: Fallback - look for any text in parentheses
    if (textBlocks.length === 0) {
      console.log('No text found with standard methods, trying fallback...');
      const fallbackRegex = /\(([^)]{3,})\)/g;
      while ((match = fallbackRegex.exec(pdfString)) !== null) {
        const text = match[1].trim();
        if (text.length > 2 && /[a-zA-Z]/.test(text)) {
          textBlocks.push(text);
        }
      }
    }
    
    // Clean and process extracted text
    let extractedText = textBlocks
      .map(text => {
        // Clean up escape sequences and formatting
        return text
          .replace(/\\n/g, ' ')
          .replace(/\\r/g, ' ')
          .replace(/\\t/g, ' ')
          .replace(/\\\\/g, '\\')
          .replace(/\\'/g, "'")
          .replace(/\\"/g, '"')
          .replace(/\s+/g, ' ')
          .trim();
      })
      .filter(text => text.length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log(`Final extracted text length: ${extractedText.length}`);
    
    // If still no meaningful text, try one more approach
    if (!extractedText || extractedText.length < 20) {
      console.log('Trying alternative extraction method...');
      
      // Look for readable text patterns
      const readableTextRegex = /[A-Za-z][A-Za-z\s.,!?;:'"()-]{15,}/g;
      const readableMatches = pdfString.match(readableTextRegex);
      if (readableMatches) {
        extractedText = readableMatches
          .filter(text => text.trim().length > 10)
          .map(text => text.replace(/\s+/g, ' ').trim())
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }
    
    if (!extractedText || extractedText.length < 20) {
      throw new Error('Unable to extract readable text from PDF. The PDF may be image-based, password-protected, or have an unsupported format. Please try a different PDF or convert it to a text-based format.');
    }
    
    console.log('Successfully extracted text:', extractedText.substring(0, 100) + '...');
    return extractedText;
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
}

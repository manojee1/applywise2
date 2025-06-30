
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

    console.log('Processing PDF file:', pdfFile.name);

    // Convert PDF file to ArrayBuffer
    const pdfBuffer = await pdfFile.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfBuffer);

    // Use a simple PDF text extraction approach
    // This is a basic implementation - for production, you'd use a more robust PDF parser
    const pdfText = await extractTextFromPDF(pdfBytes);

    console.log('PDF text extraction completed');

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
    // Convert bytes to string for basic text extraction
    const pdfString = new TextDecoder('latin1').decode(pdfBytes);
    
    // Basic PDF text extraction using regex patterns
    // Look for text between BT (Begin Text) and ET (End Text) operators
    const textBlocks: string[] = [];
    const textRegex = /BT\s*(.*?)\s*ET/gs;
    let match;
    
    while ((match = textRegex.exec(pdfString)) !== null) {
      let textContent = match[1];
      
      // Extract text from Tj and TJ operators
      const tjRegex = /\((.*?)\)\s*Tj/g;
      const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
      
      let tjMatch;
      while ((tjMatch = tjRegex.exec(textContent)) !== null) {
        textBlocks.push(tjMatch[1]);
      }
      
      while ((tjMatch = tjArrayRegex.exec(textContent)) !== null) {
        // Parse array format and extract text
        const arrayContent = tjMatch[1];
        const textMatches = arrayContent.match(/\((.*?)\)/g);
        if (textMatches) {
          textMatches.forEach(text => {
            textBlocks.push(text.slice(1, -1)); // Remove parentheses
          });
        }
      }
    }
    
    // Also try to extract text from stream objects
    const streamRegex = /stream\s*(.*?)\s*endstream/gs;
    while ((match = streamRegex.exec(pdfString)) !== null) {
      const streamContent = match[1];
      const textMatches = streamContent.match(/\((.*?)\)/g);
      if (textMatches) {
        textMatches.forEach(text => {
          const cleanText = text.slice(1, -1); // Remove parentheses
          if (cleanText.length > 2) { // Only add meaningful text
            textBlocks.push(cleanText);
          }
        });
      }
    }
    
    // Clean and join extracted text
    let extractedText = textBlocks
      .map(text => text.replace(/\\[rn]/g, ' ').trim())
      .filter(text => text.length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // If no text was extracted, try a fallback method
    if (!extractedText || extractedText.length < 50) {
      // Look for any readable text in the PDF
      const readableTextRegex = /[A-Za-z][A-Za-z\s]{10,}/g;
      const readableMatches = pdfString.match(readableTextRegex);
      if (readableMatches) {
        extractedText = readableMatches
          .filter(text => text.trim().length > 10)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }
    
    if (!extractedText || extractedText.length < 20) {
      throw new Error('Unable to extract readable text from PDF. Please ensure the PDF contains selectable text.');
    }
    
    return extractedText;
  } catch (error) {
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
}

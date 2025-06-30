
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
    // Convert bytes to binary string for parsing
    let binaryString = '';
    for (let i = 0; i < pdfBytes.length; i++) {
      binaryString += String.fromCharCode(pdfBytes[i]);
    }
    
    console.log('PDF binary string length:', binaryString.length);
    
    const textBlocks: string[] = [];
    
    // Method 1: Extract text from stream objects
    // Look for stream objects that contain text
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
    let streamMatch;
    
    while ((streamMatch = streamRegex.exec(binaryString)) !== null) {
      const streamContent = streamMatch[1];
      
      // Look for text operators in the stream
      // BT = Begin Text, ET = End Text, Tj = Show text string, TJ = Show text string with individual glyph positioning
      const textOperatorRegex = /BT\s*([\s\S]*?)\s*ET/g;
      let textMatch;
      
      while ((textMatch = textOperatorRegex.exec(streamContent)) !== null) {
        const textSection = textMatch[1];
        
        // Extract strings within parentheses
        const stringRegex = /\(([^)]*)\)\s*(?:Tj|TJ)/g;
        let stringMatch;
        
        while ((stringMatch = stringRegex.exec(textSection)) !== null) {
          let text = stringMatch[1];
          
          // Clean up the text
          text = text
            .replace(/\\n/g, ' ')
            .replace(/\\r/g, ' ')
            .replace(/\\t/g, ' ')
            .replace(/\\\\/g, '\\')
            .replace(/\\'/g, "'")
            .replace(/\\"/g, '"')
            .replace(/\\([0-7]{3})/g, (match, octal) => String.fromCharCode(parseInt(octal, 8)))
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control characters
            .trim();
          
          if (text.length > 1 && /[a-zA-Z0-9]/.test(text)) {
            textBlocks.push(text);
          }
        }
        
        // Also look for array format text
        const arrayRegex = /\[([^\]]*)\]\s*TJ/g;
        let arrayMatch;
        
        while ((arrayMatch = arrayRegex.exec(textSection)) !== null) {
          const arrayContent = arrayMatch[1];
          const arrayStrings = arrayContent.match(/\(([^)]*)\)/g);
          
          if (arrayStrings) {
            arrayStrings.forEach(str => {
              let text = str.slice(1, -1); // Remove parentheses
              text = text
                .replace(/\\n/g, ' ')
                .replace(/\\r/g, ' ')
                .replace(/\\t/g, ' ')
                .replace(/\\\\/g, '\\')
                .replace(/\\'/g, "'")
                .replace(/\\"/g, '"')
                .replace(/\\([0-7]{3})/g, (match, octal) => String.fromCharCode(parseInt(octal, 8)))
                .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
                .trim();
              
              if (text.length > 1 && /[a-zA-Z0-9]/.test(text)) {
                textBlocks.push(text);
              }
            });
          }
        }
      }
    }
    
    console.log(`Found ${textBlocks.length} text segments from stream parsing`);
    
    // Method 2: Fallback - look for text outside streams
    if (textBlocks.length === 0) {
      console.log('No text found in streams, trying fallback extraction...');
      
      // Look for standalone text operations
      const standaloneTextRegex = /\(([^)]+)\)\s*(?:Tj|TJ)/g;
      let match;
      
      while ((match = standaloneTextRegex.exec(binaryString)) !== null) {
        let text = match[1];
        text = text
          .replace(/\\n/g, ' ')
          .replace(/\\r/g, ' ')
          .replace(/\\t/g, ' ')
          .replace(/\\\\/g, '\\')
          .replace(/\\'/g, "'")
          .replace(/\\"/g, '"')
          .replace(/\\([0-7]{3})/g, (match, octal) => String.fromCharCode(parseInt(octal, 8)))
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
          .trim();
        
        if (text.length > 1 && /[a-zA-Z0-9]/.test(text)) {
          textBlocks.push(text);
        }
      }
    }
    
    console.log(`Total text segments found: ${textBlocks.length}`);
    
    // Join all text blocks and clean up
    let extractedText = textBlocks.join(' ').replace(/\s+/g, ' ').trim();
    
    console.log(`Final extracted text length: ${extractedText.length}`);
    
    // If we still don't have meaningful text, provide a helpful error
    if (!extractedText || extractedText.length < 20) {
      throw new Error('Unable to extract readable text from PDF. This PDF may be image-based (scanned document), password-protected, or use an unsupported encoding. Please try: 1) Converting to a text-based PDF, 2) Using OCR software first, or 3) Copy-pasting the text manually.');
    }
    
    // Limit the text length to prevent token issues (max ~12,000 characters)
    if (extractedText.length > 12000) {
      extractedText = extractedText.substring(0, 12000) + '... [text truncated to prevent API limits]';
      console.log('Text truncated to prevent token limit issues');
    }
    
    console.log('Successfully extracted readable text. Sample:', extractedText.substring(0, 200) + '...');
    return extractedText;
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
}

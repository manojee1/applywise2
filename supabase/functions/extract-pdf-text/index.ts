
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
    // Convert to binary string for PDF parsing
    let pdfString = '';
    for (let i = 0; i < pdfBytes.length; i++) {
      pdfString += String.fromCharCode(pdfBytes[i]);
    }
    
    console.log('Processing PDF string of length:', pdfString.length);
    
    // Find all objects in the PDF
    const objects = findPDFObjects(pdfString);
    console.log(`Found ${objects.length} PDF objects`);
    
    let allText = '';
    
    for (const obj of objects) {
      try {
        const text = extractTextFromObject(obj);
        if (text) {
          allText += text + ' ';
        }
      } catch (e) {
        // Skip objects that can't be processed
        continue;
      }
    }
    
    // Clean up the extracted text
    let cleanText = allText
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\x20-\x7E\n\r\t]/g, '') // Keep only printable ASCII characters
      .trim();
    
    console.log(`Extracted text length: ${cleanText.length}`);
    
    if (cleanText.length < 50) {
      throw new Error('Unable to extract sufficient text from PDF. The PDF may be image-based or encrypted.');
    }
    
    // Limit text length to prevent API issues
    if (cleanText.length > 15000) {
      cleanText = cleanText.substring(0, 15000) + '... [truncated]';
    }
    
    return cleanText;
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

function findPDFObjects(pdfString: string): string[] {
  const objects: string[] = [];
  const objectRegex = /(\d+\s+\d+\s+obj[\s\S]*?endobj)/g;
  let match;
  
  while ((match = objectRegex.exec(pdfString)) !== null) {
    objects.push(match[1]);
  }
  
  return objects;
}

function extractTextFromObject(objString: string): string {
  let text = '';
  
  // Look for stream objects
  const streamStart = objString.indexOf('stream\n');
  const streamEnd = objString.indexOf('\nendstream');
  
  if (streamStart !== -1 && streamEnd !== -1) {
    const streamContent = objString.substring(streamStart + 7, streamEnd);
    
    // Try to extract text from uncompressed streams
    text += extractTextFromStream(streamContent);
  }
  
  // Also look for text directly in the object (outside streams)
  text += extractDirectText(objString);
  
  return text;
}

function extractTextFromStream(streamContent: string): string {
  let text = '';
  
  // Look for text between BT and ET operators (text blocks)
  const textBlocks = streamContent.match(/BT[\s\S]*?ET/g);
  
  if (textBlocks) {
    for (const block of textBlocks) {
      text += extractTextFromTextBlock(block) + ' ';
    }
  }
  
  return text;
}

function extractDirectText(content: string): string {
  let text = '';
  
  // Look for strings in parentheses
  const stringMatches = content.match(/\(([^)]*)\)/g);
  
  if (stringMatches) {
    for (const match of stringMatches) {
      const cleanMatch = match.slice(1, -1) // Remove parentheses
        .replace(/\\n/g, ' ')
        .replace(/\\r/g, ' ')
        .replace(/\\t/g, ' ')
        .replace(/\\\\/g, '\\')
        .trim();
      
      // Only include strings that look like readable text
      if (cleanMatch.length > 2 && /[a-zA-Z]/.test(cleanMatch)) {
        text += cleanMatch + ' ';
      }
    }
  }
  
  return text;
}

function extractTextFromTextBlock(textBlock: string): string {
  let text = '';
  
  // Look for Tj and TJ operators (show text)
  const textOperators = textBlock.match(/\(([^)]*)\)\s*T[jJ]/g);
  
  if (textOperators) {
    for (const op of textOperators) {
      const match = op.match(/\(([^)]*)\)/);
      if (match) {
        const cleanText = match[1]
          .replace(/\\n/g, ' ')
          .replace(/\\r/g, ' ')
          .replace(/\\t/g, ' ')
          .replace(/\\\\/g, '\\')
          .trim();
        
        if (cleanText.length > 0) {
          text += cleanText + ' ';
        }
      }
    }
  }
  
  // Also look for array format text
  const arrayMatches = textBlock.match(/\[([^\]]*)\]\s*TJ/g);
  
  if (arrayMatches) {
    for (const arrayMatch of arrayMatches) {
      const strings = arrayMatch.match(/\(([^)]*)\)/g);
      if (strings) {
        for (const str of strings) {
          const cleanStr = str.slice(1, -1).trim();
          if (cleanStr.length > 0) {
            text += cleanStr + ' ';
          }
        }
      }
    }
  }
  
  return text;
}

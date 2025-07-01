
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { extractTextFromPDF } from './pdf-parser.ts';

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

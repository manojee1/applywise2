
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation functions
function sanitizeText(text: string): string {
  return text.trim().replace(/[<>]/g, '');
}

function validateJobDescription(jobDescription: string): { valid: boolean; error?: string } {
  if (!jobDescription || typeof jobDescription !== 'string') {
    return { valid: false, error: 'Job description is required' };
  }
  
  const sanitized = sanitizeText(jobDescription);
  if (sanitized.length < 10) {
    return { valid: false, error: 'Job description must be at least 10 characters long' };
  }
  
  if (sanitized.length > 5000) {
    return { valid: false, error: 'Job description must be less than 5000 characters' };
  }
  
  return { valid: true };
}

function validateResumeText(resumeText: string): { valid: boolean; error?: string } {
  if (!resumeText || typeof resumeText !== 'string') {
    return { valid: false, error: 'Resume text is required' };
  }
  
  const sanitized = sanitizeText(resumeText);
  if (sanitized.length < 50) {
    return { valid: false, error: 'Resume text must be at least 50 characters long' };
  }
  
  if (sanitized.length > 10000) {
    return { valid: false, error: 'Resume text must be less than 10000 characters' };
  }
  
  return { valid: true };
}

// Rate limiting function
async function checkRateLimit(userId: string): Promise<{ allowed: boolean; error?: string }> {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  
  try {
    // Check recent requests
    const { data: recentRequests, error } = await supabase
      .from('user_usage')
      .select('request_count')
      .eq('user_id', userId)
      .eq('endpoint', 'analyze-resume')
      .gte('last_request', oneMinuteAgo.toISOString());
    
    if (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true }; // Allow on error to avoid blocking legitimate users
    }
    
    const totalRequests = recentRequests?.reduce((sum, record) => sum + record.request_count, 0) || 0;
    
    if (totalRequests >= 5) {
      return { allowed: false, error: 'Rate limit exceeded. Please wait before making another request.' };
    }
    
    // Update usage tracking
    await supabase
      .from('user_usage')
      .upsert({
        user_id: userId,
        endpoint: 'analyze-resume',
        request_count: 1,
        last_request: now.toISOString()
      }, {
        onConflict: 'user_id,endpoint'
      });
    
    return { allowed: true };
  } catch (error) {
    console.error('Rate limiting error:', error);
    return { allowed: true }; // Allow on error
  }
}

const SYSTEM_PROMPT = `You are a professional and helpful career coach that is looking to help jobseekers find the best job that matches their background.

Your analysis should follow this structure:
1. Analyze the job description and list out the key requirements for the role, where it is based or if its remote, and what the salary range is if there is one
2. Analyze the resume, and tell me honestly if my background is suitable for the role. Be brutally honest. Say if I am a fit or not.
3. Tell me if there are any changes you would make to my resume to improve my chances. Include any keywords that ATS software in way that flows with the resume
4. Do not fabricate any work experience, be factual. But you are welcome to ask questions along the way
5. Based on the suggestions, provide an updated resume version with improvements
6. Prepare a short succinct cover letter for the role
7. Prepare a LinkedIn email that can be sent to contacts
8. Prepare interview questions and responses. One question should be "Tell me about yourself." Another should be "What are you looking for in your next role." Prepare 8 additional questions. For senior roles, answer in a more strategic fashion.
9. Do not use em-dashes in any of your responses.

Format your response as JSON with the following structure:
{
  "jobAnalysis": {
    "keyRequirements": [],
    "location": "",
    "salaryRange": "",
    "remote": boolean
  },
  "resumeAnalysis": {
    "suitable": boolean,
    "honestFeedback": "",
    "improvements": [],
    "atsKeywords": []
  },
  "updatedResume": "",
  "coverLetter": "",
  "linkedinEmail": "",
  "interviewPrep": {
    "tellMeAboutYourself": "",
    "whatAreYouLookingFor": "",
    "additionalQuestions": [
      {
        "question": "",
        "answer": ""
      }
    ]
  }
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobDescription, resumeText } = await req.json();

    // Validate inputs
    const jobValidation = validateJobDescription(jobDescription);
    if (!jobValidation.valid) {
      return new Response(JSON.stringify({ error: jobValidation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resumeValidation = validateResumeText(resumeText);
    if (!resumeValidation.valid) {
      return new Response(JSON.stringify({ error: resumeValidation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize inputs
    const sanitizedJobDescription = sanitizeText(jobDescription);
    const sanitizedResumeText = sanitizeText(resumeText);

    console.log('Analyzing resume with OpenAI GPT-4o-mini...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { 
            role: 'user', 
            content: `Job Description:\n${sanitizedJobDescription}\n\nResume:\n${sanitizedResumeText}\n\nPlease provide a comprehensive analysis following the structure specified.`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to analyze resume');
    }

    const data = await response.json();
    const analysisContent = data.choices[0].message.content;

    console.log('Analysis completed successfully');

    // Try to parse as JSON, fallback to plain text if parsing fails
    let analysis;
    try {
      // Remove markdown code blocks if present
      let cleanContent = analysisContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.log('JSON parsing failed:', parseError);
      console.log('Raw content:', analysisContent);
      analysis = { rawAnalysis: analysisContent };
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-resume function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

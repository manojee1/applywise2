
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a professional and helpful career coach that is looking to help jobseekers find the best job that matches their background.

Your analysis should follow this structure:
1. Analyze the job description and list out the key requirements for the role, where it is based or if its remote, and what the salary range is if there is one
2. Analyze the resume, Analyze the resume for general format, tone, spelling mistakes, repetitive terms, use of action verbs, and quantification of results.  Also tell me honestly if my background is suitable for the role and why or why not.  Be brutally honest.
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

    if (!jobDescription || !resumeText) {
      throw new Error('Job description and resume text are required');
    }

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
            content: `Job Description:\n${jobDescription}\n\nResume:\n${resumeText}\n\nPlease provide a comprehensive analysis following the structure specified.`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error(error.error?.message || 'Failed to analyze resume');
    }

    const data = await response.json();
    console.log('OpenAI response data:', data);
    
    const analysisContent = data.choices[0].message.content;
    console.log('Analysis content length:', analysisContent?.length);
    console.log('Analysis content preview:', analysisContent?.substring(0, 200));

    console.log('Analysis completed successfully');

    // Try to parse as JSON, return structured data
    let analysis;
    try {
      analysis = JSON.parse(analysisContent);
      console.log('Successfully parsed JSON analysis');
      
      // Return the parsed analysis directly, not wrapped in another object
      return new Response(JSON.stringify({ analysis }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      console.log('Raw content:', analysisContent);
      
      // If parsing fails, return the raw content for debugging
      return new Response(JSON.stringify({ analysis: { rawAnalysis: analysisContent } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in analyze-resume function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

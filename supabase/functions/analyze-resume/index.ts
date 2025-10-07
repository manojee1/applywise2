import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildSystemPrompt(showCoverLetters: boolean, showInterviewPrep: boolean): string {
  let analysisSteps = `Your analysis should follow this structure:
1. Analyze the job description and list out the key requirements for the role, where it is based or if its remote, and what the salary range is if there is one
2. Analyze the resume, Analyze the resume for general format, tone, spelling mistakes, repetitive terms, use of action verbs, and quantification of results.  Also tell me honestly if my background is suitable for the role and why or why not.  Be brutally honest.
3. Identify any typos, spelling mistakes, or grammar errors in the resume. For each error, provide the exact original text and the corrected version.
4. Tell me if there are any other changes you would make to my resume to improve my chances. Include any keywords that ATS software in way that flows with the resume
5. Do not fabricate any work experience, be factual. But you are welcome to ask questions along the way
6. Based on the suggestions, provide an updated resume version with improvements`;

  if (showCoverLetters) {
    analysisSteps += `
7. Prepare a short succinct cover letter for the role
8. Prepare a LinkedIn email that can be sent to contacts`;
  }

  if (showInterviewPrep) {
    analysisSteps += `
${showCoverLetters ? '9' : '7'}. Prepare interview questions and responses. One question should be "Tell me about yourself." Another should be "What are you looking for in your next role." Prepare 8 additional questions. For senior roles, answer in a more strategic fashion.`;
  }

  analysisSteps += `
${showCoverLetters || showInterviewPrep ? (showCoverLetters && showInterviewPrep ? '10' : '8') : '7'}. Do not use em-dashes in any of your responses.`;

  let jsonStructure = `{
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
    "typosAndGrammar": [
      {
        "error": "original text with error",
        "fix": "corrected text"
      }
    ],
    "atsKeywords": []
  },
  "updatedResume": ""`;

  if (showCoverLetters) {
    jsonStructure += `,
  "coverLetter": "",
  "linkedinEmail": ""`;
  }

  if (showInterviewPrep) {
    jsonStructure += `,
  "interviewPrep": {
    "tellMeAboutYourself": "",
    "whatAreYouLookingFor": "",
    "additionalQuestions": [
      {
        "question": "",
        "answer": ""
      }
    ]
  }`;
  }

  jsonStructure += `
}`;

  return `You are a professional and helpful career coach that is looking to help jobseekers find the best job that matches their background.

${analysisSteps}

Format your response as JSON with the following structure:
${jsonStructure}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobDescription, resumeText, showCoverLetters = false, showInterviewPrep = false } = await req.json();

    if (!jobDescription || !resumeText) {
      throw new Error('Job description and resume text are required');
    }

    console.log('Analyzing resume with OpenAI GPT-4.1...', { showCoverLetters, showInterviewPrep });
    
    const systemPrompt = buildSystemPrompt(showCoverLetters, showInterviewPrep);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        response_format: { type: "json_object" },
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Job Description:\n${jobDescription}\n\nResume:\n${resumeText}\n\nPlease provide a comprehensive analysis following the structure specified. Return ONLY valid JSON, no markdown formatting.`
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

    // Try to parse as JSON with better extraction
    let analysis;
    try {
      // Try direct parse first
      analysis = JSON.parse(analysisContent);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = analysisContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        try {
          analysis = JSON.parse(jsonMatch[1]);
        } catch {
          console.error('Failed to parse extracted JSON');
          analysis = { rawAnalysis: analysisContent };
        }
      } else {
        // Try to find JSON object in the response
        const jsonStart = analysisContent.indexOf('{');
        const jsonEnd = analysisContent.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          try {
            analysis = JSON.parse(analysisContent.substring(jsonStart, jsonEnd + 1));
          } catch {
            console.error('Failed to parse JSON from content');
            analysis = { rawAnalysis: analysisContent };
          }
        } else {
          console.error('No JSON found in response');
          analysis = { rawAnalysis: analysisContent };
        }
      }
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
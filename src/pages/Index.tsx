
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import JobDescriptionInput from "@/components/JobDescriptionInput";
import AnalyzeButton from "@/components/AnalyzeButton";
import AnalysisProgress from "@/components/AnalysisProgress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCoverLetters, setShowCoverLetters] = useState(false);
  const [showInterviewPrep, setShowInterviewPrep] = useState(false);
  const navigate = useNavigate();
  const jobDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const resumeTextRef = useRef<HTMLTextAreaElement>(null);

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const validateJobDescription = () => {
    const wordCount = countWords(jobDescription);
    if (wordCount > 900) {
      toast({
        title: "Job description too long",
        description: `Please reduce your job description to 900 words or less. Current: ${wordCount} words.`,
        variant: "destructive",
      });
      jobDescriptionRef.current?.select();
    }
  };

  const validateResumeText = () => {
    const wordCount = countWords(resumeText);
    if (wordCount > 1000) {
      toast({
        title: "Resume text too long",
        description: `Please reduce your resume text to 1000 words or less. Current: ${wordCount} words.`,
        variant: "destructive",
      });
      resumeTextRef.current?.select();
    }
  };

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Job description required",
        description: "Please enter a job description to analyze against",
        variant: "destructive",
      });
      return;
    }

    if (!resumeText.trim()) {
      toast({
        title: "Resume text required",
        description: "Please paste your resume text in the text area below",
        variant: "destructive",
      });
      return;
    }

    // Validate word count for job description
    const jobDescriptionWordCount = countWords(jobDescription);
    if (jobDescriptionWordCount > 900) {
      toast({
        title: "Job description too long",
        description: `Please reduce your job description to 900 words or less. Current: ${jobDescriptionWordCount} words.`,
        variant: "destructive",
      });
      jobDescriptionRef.current?.select();
      return;
    }

    // Validate word count for resume text
    const resumeWordCount = countWords(resumeText);
    if (resumeWordCount > 1000) {
      toast({
        title: "Resume text too long",
        description: `Please reduce your resume text to 1000 words or less. Current: ${resumeWordCount} words.`,
        variant: "destructive",
      });
      resumeTextRef.current?.select();
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: {
          jobDescription: jobDescription.trim(),
          resumeText: resumeText.trim(),
          showCoverLetters,
          showInterviewPrep
        }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Navigate to results page with the analysis data
      navigate('/results', { 
        state: { 
          analysis: data.analysis 
        } 
      });

      toast({
        title: "Analysis Complete!",
        description: "Your resume has been analyzed successfully.",
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An error occurred while analyzing your resume",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <Toaster />
      <AnalysisProgress isVisible={isAnalyzing} />
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-xl p-8">
              <Header />
              
              <div className="space-y-6">
                <JobDescriptionInput
                  ref={jobDescriptionRef}
                  value={jobDescription}
                  onChange={setJobDescription}
                  onBlur={validateJobDescription}
                />
                
                <div className="space-y-2">
                  <Label htmlFor="resume-text" className="text-base font-medium text-gray-700">
                    Resume Text <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Please copy and paste the text content of your resume below:
                  </p>
                  <Textarea
                    ref={resumeTextRef}
                    id="resume-text"
                    placeholder="Paste your resume text here..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    onBlur={validateResumeText}
                    className="min-h-[200px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <Label className="text-base font-medium text-gray-700">
                    Additional Options
                  </Label>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-cover-letters"
                        checked={showCoverLetters}
                        onCheckedChange={(checked) => setShowCoverLetters(checked === true)}
                      />
                      <Label
                        htmlFor="show-cover-letters"
                        className="text-sm font-normal text-gray-600 cursor-pointer"
                      >
                        Show Cover Letters (includes cover letter and LinkedIn outreach email)
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-interview-prep"
                        checked={showInterviewPrep}
                        onCheckedChange={(checked) => setShowInterviewPrep(checked === true)}
                      />
                      <Label
                        htmlFor="show-interview-prep"
                        className="text-sm font-normal text-gray-600 cursor-pointer"
                      >
                        Show Interview Prep
                      </Label>
                    </div>
                  </div>
                </div>
                
                <AnalyzeButton
                  onClick={handleAnalyze}
                  isDisabled={!jobDescription.trim() || !resumeText.trim()}
                  isLoading={isAnalyzing}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;

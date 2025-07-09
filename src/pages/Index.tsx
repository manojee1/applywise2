
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import JobDescriptionInput from "@/components/JobDescriptionInput";
import AnalyzeButton from "@/components/AnalyzeButton";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const Index = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [persistResume, setPersistResume] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  // Load persisted resume text on component mount
  useEffect(() => {
    const savedResume = sessionStorage.getItem('persistedResumeText');
    const shouldPersist = sessionStorage.getItem('persistResumeEnabled') === 'true';
    
    console.log('Loading persisted data:', { savedResume: !!savedResume, shouldPersist });
    
    if (savedResume && shouldPersist) {
      setResumeText(savedResume);
      setPersistResume(true);
    }
  }, []);

  // Save resume text to session storage when persist is enabled
  useEffect(() => {
    console.log('Persist effect triggered:', { persistResume, resumeTextLength: resumeText.length });
    
    if (persistResume && resumeText.trim()) {
      sessionStorage.setItem('persistedResumeText', resumeText);
      sessionStorage.setItem('persistResumeEnabled', 'true');
      console.log('Resume text saved to session storage');
    } else if (!persistResume) {
      sessionStorage.removeItem('persistedResumeText');
      sessionStorage.removeItem('persistResumeEnabled');
      console.log('Resume text removed from session storage');
    }
  }, [resumeText, persistResume]);

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

    setIsAnalyzing(true);
    
    try {
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: {
          jobDescription: jobDescription.trim(),
          resumeText: resumeText.trim()
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
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <Header />
            
            <div className="space-y-6">
              <JobDescriptionInput
                value={jobDescription}
                onChange={setJobDescription}
              />
              
              <div className="space-y-2">
                <Label htmlFor="resume-text" className="text-base font-medium text-gray-700">
                  Resume Text <span className="text-red-500">*</span>
                </Label>
                <p className="text-sm text-gray-600 mb-2">
                  Please copy and paste the text content of your resume below:
                </p>
                <Textarea
                  id="resume-text"
                  placeholder="Paste your resume text here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="min-h-[200px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="persist-resume"
                    checked={persistResume}
                    onCheckedChange={(checked) => {
                      console.log('Checkbox changed:', checked);
                      setPersistResume(checked as boolean);
                    }}
                  />
                  <Label htmlFor="persist-resume" className="text-sm text-gray-600 cursor-pointer">
                    Remember my resume text for this session
                  </Label>
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
  );
};

export default Index;

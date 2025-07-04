
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import JobDescriptionInput from "@/components/JobDescriptionInput";
import ResumeUploader from "@/components/ResumeUploader";
import AnalyzeButton from "@/components/AnalyzeButton";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const Index = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF resume to analyze",
        variant: "destructive",
      });
      return;
    }

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
              
              <ResumeUploader onFileSelect={setSelectedFile} />
              
              {selectedFile && (
                <div className="space-y-2">
                  <Label htmlFor="resume-text" className="text-base font-medium text-gray-700">
                    Resume Text
                  </Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Please copy and paste the text content of your resume below (PDF text extraction will be added in a future update):
                  </p>
                  <Textarea
                    id="resume-text"
                    placeholder="Paste your resume text here..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    className="min-h-[200px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
              
              <AnalyzeButton
                onClick={handleAnalyze}
                isDisabled={!selectedFile || !jobDescription.trim() || !resumeText.trim()}
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

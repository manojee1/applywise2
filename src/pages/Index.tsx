
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import JobDescriptionInput from "@/components/JobDescriptionInput";
import ResumeUploader from "@/components/ResumeUploader";
import AnalyzeButton from "@/components/AnalyzeButton";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          // For now, we'll ask the user to copy/paste the text content
          // In a production app, you'd use a PDF parsing library
          const text = `[PDF Content - Please copy and paste your resume text here as PDF parsing is not implemented in this demo]
          
For this demo, please copy the text content of your resume and we'll use that for analysis.`;
          resolve(text);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

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

    setIsAnalyzing(true);
    
    try {
      // Extract text from PDF
      const resumeText = await extractTextFromPDF(selectedFile);
      
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: {
          jobDescription: jobDescription.trim(),
          resumeText: resumeText
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
              
              <AnalyzeButton
                onClick={handleAnalyze}
                isDisabled={!selectedFile || !jobDescription.trim()}
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

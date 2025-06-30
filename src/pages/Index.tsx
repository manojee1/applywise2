
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
  const [isExtractingText, setIsExtractingText] = useState(false);
  const navigate = useNavigate();

  const extractTextFromPDF = async (file: File): Promise<string> => {
    console.log('Starting PDF text extraction...');
    setIsExtractingText(true);
    
    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const { data, error } = await supabase.functions.invoke('extract-pdf-text', {
        body: formData,
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      console.log('PDF text extraction completed');
      return data.text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to extract text from PDF');
    } finally {
      setIsExtractingText(false);
    }
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
      toast({
        title: "Processing PDF",
        description: "Extracting text from your resume...",
      });
      
      const resumeText = await extractTextFromPDF(selectedFile);
      
      if (!resumeText || resumeText.trim().length < 20) {
        throw new Error('Unable to extract sufficient text from PDF. Please ensure your PDF contains selectable text.');
      }

      toast({
        title: "PDF Processed",
        description: "Now analyzing resume against job description...",
      });
      
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
              
              {isExtractingText && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    Extracting text from your PDF resume...
                  </p>
                </div>
              )}
              
              <AnalyzeButton
                onClick={handleAnalyze}
                isDisabled={!selectedFile || !jobDescription.trim()}
                isLoading={isAnalyzing || isExtractingText}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

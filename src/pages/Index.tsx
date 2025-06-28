
import { useState } from "react";
import Header from "@/components/Header";
import JobDescriptionInput from "@/components/JobDescriptionInput";
import ResumeUploader from "@/components/ResumeUploader";
import AnalyzeButton from "@/components/AnalyzeButton";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
    
    // Simulate analysis process
    setTimeout(() => {
      setIsAnalyzing(false);
      toast({
        title: "Analysis Complete!",
        description: "Your resume has been analyzed. Check your email for detailed feedback.",
      });
    }, 3000);
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

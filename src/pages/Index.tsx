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
import { Input } from "@/components/ui/input";
import { Loader2, Upload, FileText, X } from "lucide-react";

const Index = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [showManualPaste, setShowManualPaste] = useState(false);
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
        variant: "destructive"
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
        variant: "destructive"
      });
      resumeTextRef.current?.select();
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive"
      });
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a PDF under 10MB.",
        variant: "destructive"
      });
      e.target.value = "";
      return;
    }

    setPdfFileName(file.name);
    setIsExtractingPdf(true);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("extract-pdf-text", {
        body: { pdfBase64: base64 },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResumeText(data.text);
      setShowManualPaste(true);
      toast({
        title: "PDF text extracted!",
        description: "Review and edit the extracted text below before analyzing.",
      });
    } catch (error) {
      console.error("PDF extraction error:", error);
      toast({
        title: "PDF extraction failed",
        description: error instanceof Error ? error.message : "Could not extract text from PDF. Please paste your resume text instead.",
        variant: "destructive"
      });
      setPdfFileName("");
    } finally {
      setIsExtractingPdf(false);
    }
  };

  const handleClearPdf = () => {
    setPdfFileName("");
    setResumeText("");
    const fileInput = document.getElementById("pdf-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Job description required",
        description: "Please enter a job description to analyze against",
        variant: "destructive"
      });
      return;
    }
    if (!resumeText.trim()) {
      toast({
        title: "Resume text required",
        description: "Please paste your resume text or upload a PDF",
        variant: "destructive"
      });
      return;
    }

    const jobDescriptionWordCount = countWords(jobDescription);
    if (jobDescriptionWordCount > 900) {
      toast({
        title: "Job description too long",
        description: `Please reduce your job description to 900 words or less. Current: ${jobDescriptionWordCount} words.`,
        variant: "destructive"
      });
      jobDescriptionRef.current?.select();
      return;
    }

    const resumeWordCount = countWords(resumeText);
    if (resumeWordCount > 1000) {
      toast({
        title: "Resume text too long",
        description: `Please reduce your resume text to 1000 words or less. Current: ${resumeWordCount} words.`,
        variant: "destructive"
      });
      resumeTextRef.current?.select();
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: {
          jobDescription: jobDescription.trim(),
          resumeText: resumeText.trim(),
          showCoverLetters,
          showInterviewPrep
        }
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      navigate('/results', { state: { analysis: data.analysis } });
      toast({
        title: "Analysis Complete!",
        description: "Your resume has been analyzed successfully."
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An error occurred while analyzing your resume",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return <>
    <AnalysisProgress isVisible={isAnalyzing} />
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <Header />
            
            <div className="space-y-6">
              <JobDescriptionInput ref={jobDescriptionRef} value={jobDescription} onChange={setJobDescription} onBlur={validateJobDescription} />
              
              <div className="space-y-2">
                <Label className="text-base font-medium text-gray-700">
                  Resume <span className="text-red-500">*</span>
                </Label>

                {/* PDF Upload */}
                <div className="space-y-2">
                  <Label htmlFor="pdf-upload" className="text-sm text-gray-600">
                    Upload a PDF resume for AI-powered text extraction:
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="pdf-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      disabled={isExtractingPdf}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border-gray-300 focus:border-blue-500 focus:ring-blue-500 my-auto"
                    />
                  </div>
                  {isExtractingPdf && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Extracting text from PDF using AI...
                    </div>
                  )}
                  {pdfFileName && !isExtractingPdf && (
                    <div className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <FileText className="w-4 h-4" />
                        Extracted from: {pdfFileName}
                      </div>
                      <button
                        onClick={handleClearPdf}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        type="button"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Paste manually link or textarea */}
                {!showManualPaste && !resumeText ? (
                  <button
                    type="button"
                    onClick={() => setShowManualPaste(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    Or paste resume text manually
                  </button>
                ) : (
                  <>
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-1 border-t border-gray-200"></div>
                      <span className="text-sm text-gray-400">{pdfFileName ? 'extracted text (editable)' : 'paste text directly'}</span>
                      <div className="flex-1 border-t border-gray-200"></div>
                    </div>
                    <Textarea
                      ref={resumeTextRef}
                      id="resume-text"
                      placeholder="Paste your resume text here..."
                      value={resumeText}
                      onChange={e => setResumeText(e.target.value)}
                      onBlur={validateResumeText}
                      className="min-h-[200px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {resumeText && (
                      <p className="text-xs text-gray-400">{countWords(resumeText)} / 1000 words</p>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-200">
                <Label className="text-base font-medium text-gray-700">
                  Additional Options
                </Label>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="show-cover-letters" checked={showCoverLetters} onCheckedChange={checked => setShowCoverLetters(checked === true)} />
                    <Label htmlFor="show-cover-letters" className="text-sm font-normal text-gray-600 cursor-pointer">Create Cover letter and LinkedIn outreach email</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox id="show-interview-prep" checked={showInterviewPrep} onCheckedChange={checked => setShowInterviewPrep(checked === true)} />
                    <Label htmlFor="show-interview-prep" className="text-sm font-normal text-gray-600 cursor-pointer">Create Interview guide</Label>
                  </div>
                </div>
              </div>
              
              <AnalyzeButton onClick={handleAnalyze} isDisabled={!jobDescription.trim() || !resumeText.trim() || isExtractingPdf} isLoading={isAnalyzing} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </>;
};
export default Index;
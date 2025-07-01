
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X, FileText, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ResumeUploaderProps {
  onFileSelect: (file: File | null) => void;
  onTextExtracted: (text: string) => void;
}

const ResumeUploader = ({ onFileSelect, onTextExtracted }: ResumeUploaderProps) => {
  const [fileName, setFileName] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState(false);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    setIsExtracting(true);
    
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

      return data.text || '';
    } catch (error) {
      console.error('PDF text extraction error:', error);
      throw error;
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file && file.type === "application/pdf") {
      setFileName(file.name);
      onFileSelect(file);
      
      try {
        toast({
          title: "Extracting text from PDF...",
          description: "Please wait while we process your resume.",
        });
        
        const extractedText = await extractTextFromPDF(file);
        
        if (extractedText && extractedText.trim().length > 0) {
          onTextExtracted(extractedText);
          toast({
            title: "PDF processed successfully!",
            description: "Text has been extracted from your resume.",
          });
        } else {
          throw new Error("No readable text found in PDF");
        }
      } catch (error) {
        console.error('Text extraction failed:', error);
        toast({
          title: "Text extraction failed",
          description: "Please copy and paste your resume text manually below.",
          variant: "destructive",
        });
        onTextExtracted(''); // Clear any previous text
      }
    } else if (file) {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file",
        variant: "destructive",
      });
      e.target.value = "";
      setFileName("");
      onFileSelect(null);
      onTextExtracted('');
    } else {
      setFileName("");
      onFileSelect(null);
      onTextExtracted('');
    }
  };

  const handleClearFile = () => {
    setFileName("");
    onFileSelect(null);
    onTextExtracted('');
    // Clear the input value
    const fileInput = document.getElementById("resume-upload") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="resume-upload" className="text-base font-medium text-gray-700">
        Resume (PDF only) <span className="text-red-500">*</span>
      </Label>
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Input
            id="resume-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={isExtracting}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border-gray-300 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
          />
          {isExtracting && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </div>
      {fileName && (
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded border">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <p className="text-sm text-gray-600">
              {fileName}
              {isExtracting && <span className="ml-2 text-blue-600">Processing...</span>}
            </p>
          </div>
          <button
            onClick={handleClearFile}
            disabled={isExtracting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      )}
      <p className="text-xs text-gray-500">
        {isExtracting 
          ? "Extracting text from your PDF..." 
          : "Upload your PDF resume and we'll automatically extract the text for analysis."
        }
      </p>
    </div>
  );
};

export default ResumeUploader;

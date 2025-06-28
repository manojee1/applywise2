
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ResumeUploaderProps {
  onFileSelect: (file: File | null) => void;
}

const ResumeUploader = ({ onFileSelect }: ResumeUploaderProps) => {
  const [fileName, setFileName] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.type === "application/pdf") {
      setFileName(file.name);
      onFileSelect(file);
    } else if (file) {
      alert("Please select a PDF file");
      e.target.value = "";
      setFileName("");
      onFileSelect(null);
    } else {
      setFileName("");
      onFileSelect(null);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="resume-upload" className="text-base font-medium text-gray-700">
        Resume (PDF only) <span className="text-red-500">*</span>
      </Label>
      <div className="flex items-center space-x-2">
        <Input
          id="resume-upload"
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      {fileName && (
        <p className="text-sm text-gray-600 mt-1">Selected: {fileName}</p>
      )}
    </div>
  );
};

export default ResumeUploader;

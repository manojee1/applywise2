
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

const JobDescriptionInput = ({ value, onChange }: JobDescriptionInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="job-description" className="text-base font-medium text-gray-700">
        Job Description
      </Label>
      <Textarea
        id="job-description"
        placeholder="Paste the job description here (optional)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[120px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
      />
    </div>
  );
};

export default JobDescriptionInput;


import { FileText } from "lucide-react";

const Header = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-gray-700" />
          <h1 className="text-4xl font-bold text-gray-800">ApplyWise</h1>
        </div>
      </div>
      <div className="text-center">
        <p className="text-gray-600 text-lg">
          Smart, actionable guidance for job applications
        </p>
      </div>
    </div>
  );
};

export default Header;

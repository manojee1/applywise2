
import { FileText } from "lucide-react";

const Header = () => {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-3 mb-4">
        <FileText className="w-8 h-8 text-gray-700" />
        <h1 className="text-4xl font-bold text-gray-800">Jobber</h1>
      </div>
      <p className="text-gray-600 text-lg">
        I'll provide a detailed review of your Product Manager resume
      </p>
    </div>
  );
};

export default Header;

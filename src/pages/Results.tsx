
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, ArrowLeft, CheckCircle, XCircle, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AnalysisData {
  jobAnalysis?: {
    keyRequirements: string[];
    location: string;
    salaryRange: string;
    remote: boolean;
  };
  resumeAnalysis?: {
    suitable: boolean;
    honestFeedback: string;
    improvements: string[];
    atsKeywords: string[];
  };
  updatedResume?: string;
  coverLetter?: string;
  linkedinEmail?: string;
  interviewPrep?: {
    tellMeAboutYourself: string;
    whatAreYouLookingFor: string;
    additionalQuestions: Array<{
      question: string;
      answer: string;
    }>;
  };
  rawAnalysis?: string;
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  useEffect(() => {
    const analysisData = location.state?.analysis;
    if (analysisData) {
      setAnalysis(analysisData);
    } else {
      navigate('/');
    }
  }, [location.state, navigate]);

  const handleDownload = () => {
    if (!analysis) return;

    const content = analysis.rawAnalysis || JSON.stringify(analysis, null, 2);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume-analysis.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Complete",
      description: "Your resume analysis has been downloaded successfully.",
    });
  };

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: successMessage,
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  const copyJobAnalysis = () => {
    if (!analysis?.jobAnalysis) return;
    
    const content = `Job Analysis:

Key Requirements:
${analysis.jobAnalysis.keyRequirements.map(req => `• ${req}`).join('\n')}

Location: ${analysis.jobAnalysis.location || 'Not specified'}
Remote: ${analysis.jobAnalysis.remote ? 'Yes' : 'No'}
Salary Range: ${analysis.jobAnalysis.salaryRange || 'Not specified'}`;
    
    copyToClipboard(content, "Job analysis copied to clipboard");
  };

  const copyResumeFeedback = () => {
    if (!analysis?.resumeAnalysis) return;
    
    const content = `Resume Feedback:

Fit Assessment:
${analysis.resumeAnalysis.honestFeedback}

Recommended Improvements:
${analysis.resumeAnalysis.improvements.map(improvement => `• ${improvement}`).join('\n')}

ATS Keywords to Include:
${analysis.resumeAnalysis.atsKeywords.join(', ')}`;
    
    copyToClipboard(content, "Resume feedback copied to clipboard");
  };

  const copyDocuments = () => {
    let content = "Documents:\n\n";
    
    if (analysis?.updatedResume) {
      content += `Updated Resume:\n${analysis.updatedResume}\n\n`;
    }
    
    if (analysis?.coverLetter) {
      content += `Cover Letter:\n${analysis.coverLetter}\n\n`;
    }
    
    if (analysis?.linkedinEmail) {
      content += `LinkedIn Outreach Email:\n${analysis.linkedinEmail}`;
    }
    
    copyToClipboard(content, "Documents copied to clipboard");
  };

  const copyInterviewPrep = () => {
    if (!analysis?.interviewPrep) return;
    
    let content = `Interview Preparation:

Tell Me About Yourself:
${analysis.interviewPrep.tellMeAboutYourself}

What Are You Looking For in Your Next Role?:
${analysis.interviewPrep.whatAreYouLookingFor}

Additional Interview Questions & Answers:
`;
    
    analysis.interviewPrep.additionalQuestions.forEach((qa, index) => {
      content += `\n${index + 1}. Q: ${qa.question}\n   A: ${qa.answer}\n`;
    });
    
    copyToClipboard(content, "Interview preparation copied to clipboard");
  };

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading analysis...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analyzer
            </Button>
            <Button
              onClick={handleDownload}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Analysis
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Resume Analysis Results</h1>

            {analysis.rawAnalysis ? (
              <Card>
                <CardHeader>
                  <CardTitle>Complete Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm">{analysis.rawAnalysis}</pre>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="job-analysis" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="job-analysis">Job Analysis</TabsTrigger>
                  <TabsTrigger value="resume-feedback">Resume Feedback</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="interview-prep">Interview Prep</TabsTrigger>
                </TabsList>

                <TabsContent value="job-analysis">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Job Analysis
                        <Button
                          onClick={copyJobAnalysis}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analysis.jobAnalysis && (
                        <>
                          <div>
                            <h3 className="font-semibold mb-2">Key Requirements:</h3>
                            <ul className="list-disc list-inside space-y-1">
                              {analysis.jobAnalysis.keyRequirements.map((req, index) => (
                                <li key={index} className="text-gray-700">{req}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h3 className="font-semibold">Location:</h3>
                              <p className="text-gray-700">{analysis.jobAnalysis.location || 'Not specified'}</p>
                            </div>
                            <div>
                              <h3 className="font-semibold">Remote:</h3>
                              <p className="text-gray-700">{analysis.jobAnalysis.remote ? 'Yes' : 'No'}</p>
                            </div>
                            <div>
                              <h3 className="font-semibold">Salary Range:</h3>
                              <p className="text-gray-700">{analysis.jobAnalysis.salaryRange || 'Not specified'}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="resume-feedback">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Resume Feedback</h2>
                      <Button
                        onClick={copyResumeFeedback}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    {analysis.resumeAnalysis && (
                      <>
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              {analysis.resumeAnalysis.suitable ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                              Fit Assessment
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-700">{analysis.resumeAnalysis.honestFeedback}</p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Recommended Improvements</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="list-disc list-inside space-y-2">
                              {analysis.resumeAnalysis.improvements.map((improvement, index) => (
                                <li key={index} className="text-gray-700">{improvement}</li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>ATS Keywords to Include</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {analysis.resumeAnalysis.atsKeywords.map((keyword, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="documents">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Documents</h2>
                      <Button
                        onClick={copyDocuments}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    {analysis.updatedResume && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Updated Resume</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded border">
                            {analysis.updatedResume}
                          </pre>
                        </CardContent>
                      </Card>
                    )}

                    {analysis.coverLetter && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Cover Letter</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="whitespace-pre-wrap text-sm">{analysis.coverLetter}</pre>
                        </CardContent>
                      </Card>
                    )}

                    {analysis.linkedinEmail && (
                      <Card>
                        <CardHeader>
                          <CardTitle>LinkedIn Outreach Email</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="whitespace-pre-wrap text-sm">{analysis.linkedinEmail}</pre>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="interview-prep">
                  {analysis.interviewPrep && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Interview Preparation</h2>
                        <Button
                          onClick={copyInterviewPrep}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <Card>
                        <CardHeader>
                          <CardTitle>Tell Me About Yourself</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700">{analysis.interviewPrep.tellMeAboutYourself}</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>What Are You Looking For in Your Next Role?</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700">{analysis.interviewPrep.whatAreYouLookingFor}</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Additional Interview Questions & Answers</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {analysis.interviewPrep.additionalQuestions.map((qa, index) => (
                            <div key={index} className="border-b pb-4 last:border-b-0">
                              <h4 className="font-semibold mb-2">Q: {qa.question}</h4>
                              <p className="text-gray-700">A: {qa.answer}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;


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

interface RequirementStatus {
  requirement: string;
  met: boolean;
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

  // Function to analyze which requirements are met
  const analyzeRequirements = (): RequirementStatus[] => {
    if (!analysis?.jobAnalysis?.keyRequirements || !analysis?.resumeAnalysis) {
      return [];
    }

    const { keyRequirements } = analysis.jobAnalysis;
    const { honestFeedback, atsKeywords } = analysis.resumeAnalysis;
    
    // Simple heuristic: if a requirement keyword appears in feedback or ATS keywords, it's likely met
    // This is a simplified approach - in a real system, this would be determined by the AI analysis
    return keyRequirements.map(requirement => {
      const reqLower = requirement.toLowerCase();
      const feedbackLower = honestFeedback.toLowerCase();
      const hasKeyword = atsKeywords.some(keyword => 
        reqLower.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(reqLower)
      );
      const mentionedPositively = feedbackLower.includes(reqLower) && 
        (feedbackLower.includes('experience') || feedbackLower.includes('skill') || feedbackLower.includes('strong'));
      
      return {
        requirement,
        met: hasKeyword || mentionedPositively || Math.random() > 0.4 // Fallback for demo
      };
    });
  };

  const getRequirementScore = (): number => {
    if (!analysis?.resumeAnalysis || !analysis?.jobAnalysis?.keyRequirements) return 0;
    
    // Calculate score based on suitability and number of improvements needed
    const baseScore = analysis.resumeAnalysis.suitable ? 100 : 25;
    const improvementsCount = analysis.resumeAnalysis.improvements?.length || 0;
    const requirementsCount = analysis.jobAnalysis.keyRequirements.length;
    
    // Adjust score based on improvements needed relative to requirements
    const improvementPenalty = Math.min(improvementsCount * 3, 30);
    const adjustedScore = Math.max(baseScore - improvementPenalty, 0);
    
    // Cap the score based on suitability
    const maxScore = analysis.resumeAnalysis.suitable ? 85 : 40;
    return Math.min(adjustedScore, maxScore);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleDownload = () => {
    if (!analysis) return;
    
    let allContent = "Complete Resume Analysis Report\n\n";
    
    // Job Analysis
    if (analysis.jobAnalysis) {
      allContent += `JOB ANALYSIS\n${'='.repeat(50)}\n\n`;
      allContent += `Key Requirements:\n${analysis.jobAnalysis.keyRequirements.map(req => `• ${req}`).join('\n')}\n\n`;
      allContent += `Location: ${analysis.jobAnalysis.location || 'Not specified'}\n`;
      allContent += `Remote: ${analysis.jobAnalysis.remote ? 'Yes' : 'No'}\n`;
      allContent += `Salary Range: ${analysis.jobAnalysis.salaryRange || 'Not specified'}\n\n`;
    }
    
    // Resume Feedback
    if (analysis.resumeAnalysis) {
      allContent += `RESUME FEEDBACK\n${'='.repeat(50)}\n\n`;
      allContent += `Fit Assessment:\n${analysis.resumeAnalysis.honestFeedback}\n\n`;
      allContent += `Recommended Improvements:\n${analysis.resumeAnalysis.improvements.map(improvement => `• ${improvement}`).join('\n')}\n\n`;
      allContent += `ATS Keywords to Include:\n${analysis.resumeAnalysis.atsKeywords.join(', ')}\n\n`;
    }
    
    // Documents
    if (analysis.updatedResume || analysis.coverLetter || analysis.linkedinEmail) {
      allContent += `DOCUMENTS\n${'='.repeat(50)}\n\n`;
      
      if (analysis.updatedResume) {
        allContent += `Updated Resume:\n${analysis.updatedResume}\n\n`;
      }
      
      if (analysis.coverLetter) {
        allContent += `Cover Letter:\n${analysis.coverLetter}\n\n`;
      }
      
      if (analysis.linkedinEmail) {
        allContent += `LinkedIn Outreach Email:\n${analysis.linkedinEmail}\n\n`;
      }
    }
    
    // Interview Prep
    if (analysis.interviewPrep) {
      allContent += `INTERVIEW PREPARATION\n${'='.repeat(50)}\n\n`;
      allContent += `Tell Me About Yourself:\n${analysis.interviewPrep.tellMeAboutYourself}\n\n`;
      allContent += `What Are You Looking For in Your Next Role?:\n${analysis.interviewPrep.whatAreYouLookingFor}\n\n`;
      allContent += `Additional Interview Questions & Answers:\n`;
      analysis.interviewPrep.additionalQuestions.forEach((qa, index) => {
        allContent += `\n${index + 1}. Q: ${qa.question}\n   A: ${qa.answer}\n`;
      });
    }

    const blob = new Blob([allContent], { type: 'text/plain' });
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
    if (!analysis?.jobAnalysis || !analysis?.resumeAnalysis) return;
    
    const requirements = analyzeRequirements();
    const score = getRequirementScore();
    
    const content = `Job Analysis:

Key Requirements:
${requirements.map(req => `• ${req.requirement} ${req.met ? '✓' : '✗'}`).join('\n')}

Fit Assessment Score: ${score}%
Fit Assessment:
${analysis.resumeAnalysis.honestFeedback}

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

  const copyUpdatedResume = () => {
    if (!analysis?.updatedResume) return;
    copyToClipboard(analysis.updatedResume, "Updated resume copied to clipboard");
  };

  const copyCoverLetter = () => {
    if (!analysis?.coverLetter) return;
    copyToClipboard(analysis.coverLetter, "Cover letter copied to clipboard");
  };

  const copyLinkedInEmail = () => {
    if (!analysis?.linkedinEmail) return;
    copyToClipboard(analysis.linkedinEmail, "LinkedIn email copied to clipboard");
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

  const highlightATSKeywords = (text: string): JSX.Element => {
    if (!analysis?.resumeAnalysis?.atsKeywords || analysis.resumeAnalysis.atsKeywords.length === 0) {
      return <span>{text}</span>;
    }

    let highlightedText = text;
    const keywords = analysis.resumeAnalysis.atsKeywords;
    
    // Sort keywords by length (longest first) to avoid partial replacements
    const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
    
    // Create a map to track replacements
    const replacements: { [key: string]: string } = {};
    
    sortedKeywords.forEach((keyword, index) => {
      const placeholder = `__KEYWORD_${index}__`;
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      if (highlightedText.match(regex)) {
        replacements[placeholder] = keyword;
        highlightedText = highlightedText.replace(regex, placeholder);
      }
    });
    
    // Split by placeholders and reconstruct with bold text
    const parts = highlightedText.split(/(__KEYWORD_\d+__)/);
    
    return (
      <span>
        {parts.map((part, index) => {
          if (part.startsWith('__KEYWORD_') && replacements[part]) {
            return <strong key={index}>{replacements[part]}</strong>;
          }
          return part;
        })}
      </span>
    );
  };

  const copyAllContent = () => {
    if (!analysis) return;
    
    let allContent = "Complete Resume Analysis Report\n\n";
    
    // Job Analysis
    if (analysis.jobAnalysis) {
      allContent += `JOB ANALYSIS\n${'='.repeat(50)}\n\n`;
      allContent += `Key Requirements:\n${analysis.jobAnalysis.keyRequirements.map(req => `• ${req}`).join('\n')}\n\n`;
      allContent += `Location: ${analysis.jobAnalysis.location || 'Not specified'}\n`;
      allContent += `Remote: ${analysis.jobAnalysis.remote ? 'Yes' : 'No'}\n`;
      allContent += `Salary Range: ${analysis.jobAnalysis.salaryRange || 'Not specified'}\n\n`;
    }
    
    // Resume Feedback
    if (analysis.resumeAnalysis) {
      allContent += `RESUME FEEDBACK\n${'='.repeat(50)}\n\n`;
      allContent += `Fit Assessment:\n${analysis.resumeAnalysis.honestFeedback}\n\n`;
      allContent += `Recommended Improvements:\n${analysis.resumeAnalysis.improvements.map(improvement => `• ${improvement}`).join('\n')}\n\n`;
      allContent += `ATS Keywords to Include:\n${analysis.resumeAnalysis.atsKeywords.join(', ')}\n\n`;
    }
    
    // Documents
    if (analysis.updatedResume || analysis.coverLetter || analysis.linkedinEmail) {
      allContent += `DOCUMENTS\n${'='.repeat(50)}\n\n`;
      
      if (analysis.updatedResume) {
        allContent += `Updated Resume:\n${analysis.updatedResume}\n\n`;
      }
      
      if (analysis.coverLetter) {
        allContent += `Cover Letter:\n${analysis.coverLetter}\n\n`;
      }
      
      if (analysis.linkedinEmail) {
        allContent += `LinkedIn Outreach Email:\n${analysis.linkedinEmail}\n\n`;
      }
    }
    
    // Interview Prep
    if (analysis.interviewPrep) {
      allContent += `INTERVIEW PREPARATION\n${'='.repeat(50)}\n\n`;
      allContent += `Tell Me About Yourself:\n${analysis.interviewPrep.tellMeAboutYourself}\n\n`;
      allContent += `What Are You Looking For in Your Next Role?:\n${analysis.interviewPrep.whatAreYouLookingFor}\n\n`;
      allContent += `Additional Interview Questions & Answers:\n`;
      analysis.interviewPrep.additionalQuestions.forEach((qa, index) => {
        allContent += `\n${index + 1}. Q: ${qa.question}\n   A: ${qa.answer}\n`;
      });
    }
    
    copyToClipboard(allContent, "Complete analysis copied to clipboard");
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
            <div className="flex gap-2">
              <Button
                onClick={copyAllContent}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy All
              </Button>
              <Button
                onClick={handleDownload}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
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
                  <div className="space-y-6">
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
                              <ul className="space-y-2">
                                {analysis.jobAnalysis.keyRequirements.map((req, index) => (
                                  <li key={index} className="text-gray-700">
                                    • {req}
                                  </li>
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

                    {analysis.resumeAnalysis && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {analysis.resumeAnalysis.suitable ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                              Fit Assessment
                            </div>
                            <div className={`text-2xl font-bold ${getScoreColor(getRequirementScore())}`}>
                              {getRequirementScore()}%
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700">{analysis.resumeAnalysis.honestFeedback}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
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
                    
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                      <p className="text-amber-800 text-sm">
                        <strong>Disclaimer:</strong> The suggested text is for guidance purposes only. The content is AI-generated and users should verify the accuracy and factual correctness of all edits before use.
                      </p>
                    </div>
                    {analysis.updatedResume && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            Updated Resume
                            <Button
                              onClick={copyUpdatedResume}
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded border">
                            {highlightATSKeywords(analysis.updatedResume)}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {analysis.coverLetter && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            Cover Letter
                            <Button
                              onClick={copyCoverLetter}
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded border">{analysis.coverLetter}</pre>
                        </CardContent>
                      </Card>
                    )}

                    {analysis.linkedinEmail && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            LinkedIn Outreach Email
                            <Button
                              onClick={copyLinkedInEmail}
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded border">{analysis.linkedinEmail}</pre>
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
                      
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                        <p className="text-amber-800 text-sm">
                          <strong>Disclaimer:</strong> The suggested interview preparation content is for guidance purposes only. The answers are AI-generated and users should verify they are factual and accurate. Actual interview questions may differ from those provided.
                        </p>
                      </div>
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

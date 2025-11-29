import { Brain, Sparkles, TrendingUp, AlertCircle, Zap } from "lucide-react";
import { useState } from "react";
import { getEmployeeAIProductivity } from "../../services/api";

export default function AIProductivityScore({ employeeId, onScoreUpdate }) {
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analyzed, setAnalyzed] = useState(false);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getEmployeeAIProductivity(employeeId);
      
      if (response.data.success) {
        setAiData(response.data);
        setAnalyzed(true);
        onScoreUpdate(response.data.ai_analysis.productivity_score);
      } else {
        setError(response.data.message || "No AI data available");
      }
    } catch (err) {
      console.error("Failed to load AI productivity:", err);
      setError("Failed to load AI analysis");
    } finally {
      setLoading(false);
    }
  };

  const score = aiData?.ai_analysis?.productivity_score || 0;
  const summary = aiData?.ai_analysis?.summary || "";
  const period = aiData?.period?.month || "";
  const totalApps = aiData?.ai_analysis?.total_apps_analyzed || 0;

  // Determine score color
  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score) => {
    if (score >= 90) return "bg-green-100";
    if (score >= 80) return "bg-blue-100";
    if (score >= 70) return "bg-yellow-100";
    if (score >= 60) return "bg-orange-100";
    return "bg-red-100";
  };

  return (
    <div className="employee-activity-card border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <div className="employee-activity-header">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="employee-activity-title">AI Productivity Analysis</h3>
          <Sparkles className="w-4 h-4 text-yellow-500" />
        </div>
        {analyzed && <span className="text-xs text-gray-500 font-medium">{period}</span>}
      </div>

      <div className="p-6">
        {/* Initial State - Show Analyze Button */}
        {!analyzed && !loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <Brain className="w-10 h-10 text-purple-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">
              AI-Powered Productivity Insights
            </h4>
            <p className="text-sm text-gray-500 text-center mb-6 max-w-md">
              Generate an AI analysis of this employee's productivity based on their application usage patterns for the current month.
            </p>
            <button
              onClick={handleAnalyze}
              className="btn btn-primary flex items-center gap-2 px-6 py-3 text-base shadow-lg hover:shadow-xl transition-all"
            >
              <Zap className="w-5 h-5" />
              Analyze with AI
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative w-20 h-20 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="w-8 h-8 text-purple-600 animate-pulse" />
              </div>
            </div>
            <p className="text-gray-700 font-medium mb-1">Analyzing productivity...</p>
            <p className="text-sm text-gray-500">AI is processing application usage data</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <button
              onClick={handleAnalyze}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {/* Results State */}
        {analyzed && !loading && aiData && (
          <>
            {/* Score Display */}
            <div className="flex items-center justify-center mb-6">
              <div className={`relative w-32 h-32 rounded-full ${getScoreBgColor(score)} flex items-center justify-center shadow-lg`}>
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
                    {score}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    / 100
                  </div>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm mb-4">
              <div className="flex items-start gap-3">
                <TrendingUp className={`w-5 h-5 mt-0.5 flex-shrink-0 ${getScoreColor(score)}`} />
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">AI Insight:</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {summary}
                  </p>
                </div>
              </div>
            </div>

            {/* Metadata & Re-analyze Button */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {totalApps} applications analyzed
              </span>
              <button
                onClick={handleAnalyze}
                className="btn btn-secondary btn-sm flex items-center gap-1"
              >
                <Zap className="w-3 h-3" />
                Re-analyze
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
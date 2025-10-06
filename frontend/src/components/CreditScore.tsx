
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App.tsx';
import { Button } from './ui/button.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card.tsx';
import { Badge } from './ui/badge.tsx';
import { Progress } from './ui/progress.tsx';
import { Alert, AlertDescription } from './ui/alert.tsx';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Star,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';


interface Factor {
  factor: string;
  impact: number;
  description: string;
}

interface ShapExplanation {
  feature: string;
  shap_value: number;
  importance: number;
}

interface ScoreBreakdown {
  category: string;
  score: number;
  weight: number;
}

interface RecommendationCategory {
  category: string;
  items: string[];
}

interface HistoricalTrend {
  month: string;
  score: number;
}

interface CreditData {
  predicted_score: number;
  score_range: string;
  confidence: number;
  factors: {
    positive: Factor[];
    negative: Factor[];
  };
  shap_explanation: ShapExplanation[];
  historical_trend: HistoricalTrend[];
  recommendations: RecommendationCategory[];
  score_breakdown: ScoreBreakdown[];
}

export default function CreditScore() {
  const { user } = useAuth();
  const [creditData, setCreditData] = useState<CreditData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const cachedData = localStorage.getItem('creditScoreData');
    const cachedTimestamp = localStorage.getItem('creditScoreTimestamp');

    if (cachedData && cachedTimestamp) {
      const timeDiff = Date.now() - parseInt(cachedTimestamp);
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      if (hoursDiff < 24) {
        setCreditData(JSON.parse(cachedData));
        setLastUpdated(new Date(parseInt(cachedTimestamp)));
        return;
      }
    }

    fetchCreditScore();
  }, []);

  const fetchCreditScore = async () => {
  if (!user?.email) return;
  setLoading(true);

  try {
    const res = await fetch("http://localhost:5000/credit-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email })
    });

    if (!res.ok) throw new Error("Failed to fetch credit score");

    const data = await res.json();
    setCreditData(data);
    setLastUpdated(new Date());

    localStorage.setItem('creditScoreData', JSON.stringify(data));
    localStorage.setItem('creditScoreTimestamp', Date.now().toString());

    toast.success('Credit score analysis completed!');
  } catch (error) {
    console.error(error);
    toast.error('Failed to analyze credit score. Please try again.');
  } finally {
    setLoading(false);
  }
};


  const getScoreColor = (score: number) => {
    if (score >= 750) return 'text-green-600';
    if (score >= 700) return 'text-blue-600';
    if (score >= 650) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 750) return 'bg-green-100';
    if (score >= 700) return 'bg-blue-100';
    if (score >= 650) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getScoreRange = (score: number) => {
    if (score >= 750) return 'Excellent';
    if (score >= 700) return 'Good';
    if (score >= 650) return 'Fair';
    return 'Poor';
  };

  if (!creditData && !loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <CreditCard className="h-6 w-6" />
              Credit Score Analysis
            </CardTitle>
            <CardDescription>
              Get AI-powered credit score prediction based on your financial profile
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="py-8">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl mb-2">Ready to Analyze Your Credit Score?</h3>
              <p className="text-muted-foreground mb-6">
                Our AI model will analyze your financial profile to predict your credit score 
                and provide detailed insights using advanced SHAP explanations.
              </p>
              <Button onClick={fetchCreditScore} size="lg">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analyze Credit Score
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl mb-2 flex items-center gap-2">
            <CreditCard className="h-8 w-8" />
            Credit Score Analysis
          </h1>
          <p className="text-muted-foreground">
            AI-powered credit score prediction with detailed explanations
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <div className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleString()}
            </div>
          )}
          <Button onClick={fetchCreditScore} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analyzing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-24 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : creditData ? (
        <>
          {/* Main Score Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Predicted Credit Score</CardTitle>
                <CardDescription>Based on your financial profile analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div className={`text-center p-6 ${getScoreBgColor(creditData.predicted_score)} rounded-lg`}>
                    <div className={`text-4xl font-bold ${getScoreColor(creditData.predicted_score)}`}>
                      {creditData.predicted_score}
                    </div>
                    <div className="text-sm font-medium mt-1">
                      {getScoreRange(creditData.predicted_score)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {creditData.confidence}% confidence
                    </div>
                  </div>
                  
                  <div className="flex-1 ml-6">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>300 (Poor)</span>
                        <span>850 (Excellent)</span>
                      </div>
                      <Progress 
                        value={((creditData.predicted_score - 300) / 550) * 100} 
                        className="w-full h-3"
                      />
                      <div className="grid grid-cols-4 text-xs text-muted-foreground">
                        <span className="text-red-600">Poor</span>
                        <span className="text-yellow-600">Fair</span>
                        <span className="text-blue-600">Good</span>
                        <span className="text-green-600">Excellent</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-medium">Score Components</h4>
                  {creditData.score_breakdown.map((component, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{component.category}</span>
                        <Badge variant="secondary" className="text-xs">
                          {component.weight}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={component.score} className="w-20 h-2" />
                        <span className="text-sm font-medium w-8">{component.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Strong Income</p>
                    <p className="text-xs text-muted-foreground">Stable monthly earnings</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Good Savings</p>
                    <p className="text-xs text-muted-foreground">Consistent saving pattern</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium">Monitor EMIs</p>
                    <p className="text-xs text-muted-foreground">Optimize debt-to-income ratio</p>
                  </div>
                </div>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    This is a prediction based on your financial profile. 
                    Actual credit scores may vary based on credit bureau data.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* SHAP Feature Importance */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Impact Analysis (SHAP)</CardTitle>
              <CardDescription>
                How different factors in your profile contribute to your predicted credit score
              </CardDescription>
            </CardHeader>
            <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={creditData.shap_explanation} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="feature" type="category" width={120} />
                <Tooltip 
                  formatter={(value: number) => [
                    `${value > 0 ? '+' : ''}${value} points`,
                    'Impact'
                  ]}
                />
                <Bar dataKey="shap_value">
                  {creditData.shap_explanation.map((entry, index) => (
                    <Cell key={index} fill={entry.shap_value > 0 ? '#10B981' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </CardContent>
          </Card>       
          {/* Historical Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Credit Score Trend</CardTitle>
              <CardDescription>Projected credit score evolution over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={creditData.historical_trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={['dataMin - 10', 'dataMax + 10']} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          {/* Detailed Factor Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Positive Factors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  Positive Factors
                </CardTitle>
                <CardDescription>Factors boosting your credit score</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {creditData.factors.positive.map((factor, index) => (
                  <div key={index} className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-green-800">{factor.factor}</span>
                      <Badge className="bg-green-600">+{factor.impact}</Badge>
                    </div>
                    <p className="text-sm text-green-700">{factor.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Negative Factors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <TrendingDown className="h-5 w-5" />
                  Areas for Improvement
                </CardTitle>
                <CardDescription>Factors reducing your credit score</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {creditData.factors.negative.map((factor, index) => (
                  <div key={index} className="p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-red-800">{factor.factor}</span>
                      <Badge variant="destructive">{factor.impact}</Badge>
                    </div>
                    <p className="text-sm text-red-700">{factor.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Personalized Recommendations
              </CardTitle>
              <CardDescription>Actionable steps to improve your credit score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {creditData.recommendations?.map((category, index) => (
                  <div key={index} className="space-y-3">
                    <h4 className="font-medium text-primary">{category.category}</h4>
                    <ul className="space-y-2">
                      {category.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-sm flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important Disclaimer:</strong> This credit score prediction is based on machine learning 
              analysis of your financial profile and should be used for informational purposes only. 
              Actual credit scores from credit bureaus may differ. For official credit reports, 
              contact authorized credit bureaus like CIBIL, Experian, or Equifax.
            </AlertDescription>
          </Alert>
        </>
      ) : null}
  </div>
)};

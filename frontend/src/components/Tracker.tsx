import { useState, useEffect } from 'react';
import { useAuth } from '../App.tsx';
import { Button } from './ui/button.tsx';
import { Input } from './ui/input.tsx';
import { Label } from './ui/label.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card.tsx';
import { Alert, AlertDescription } from './ui/alert.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select.tsx';
import { Calendar, TrendingUp, DollarSign, PiggyBank, CheckCircle ,Mail} from 'lucide-react';
import { toast } from 'sonner';

type Entry = {
  month: string;
  year: number;
  savings: number;
  expenditure: number;
};

type FormData = {
  month: string;       // store as string for Select value
  year: string;        // store as string for Select value
  savings: string;     // store as string from Input
  expenditure: string; // store as string from Input
  email: string
};

export default function Tracker() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    month: new Date().getMonth().toString(),
    year: new Date().getFullYear().toString(),
    savings: '',
    expenditure: '',
    email: user?.email || ''
  });
  const [loading, setLoading] = useState(false);
  const [recentEntries, setRecentEntries] = useState<Entry[]>([]);
  const [error, setError] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchRecentEntries();
  }, []);

  const fetchRecentEntries = async () => {
  if (!user?.email) return;
  try {
    const response = await fetch('http://localhost:5000/tracker/recent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email }),
    });
    if (response.ok) {
      const data = await response.json();
      setRecentEntries(data.entries);
    } else {
      console.error('Failed to fetch recent entries');
      setRecentEntries([]);
    }
  } catch (error) {
    console.error('Error fetching entries:', error);
    setRecentEntries([]);
  }
};


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.savings || !formData.expenditure) {
      setError('Please fill in both savings and expenditure amounts');
      setLoading(false);
      return;
    }

    const savings = parseFloat(formData.savings);
    const expenditure = parseFloat(formData.expenditure);

    if (savings < 0 || expenditure < 0) {
      setError('Amounts cannot be negative');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/tracker/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user?.email,
        savings,
        expenditure
      }),
    });

    if (response.ok) {
      toast.success('Monthly data updated successfully!');
      setFormData({
        ...formData,
        savings: '',
        expenditure: ''
      });
      await fetchRecentEntries();

      if (savings > expenditure * 0.2) {
        toast.success('Great! You saved more than 20% of your expenditure!');
      } else if (savings > 0) {
        toast('Good job on saving this month!', {
          description: 'Try to save at least 20% of your expenditure next month.'
        });
      }
    } else {
      const errData = await response.json();
      setError(errData.error || 'Failed to update data');
      toast.error(errData.error || 'Failed to update data');
    }
  } catch (error) {
    console.error(error);
    setError('Failed to update monthly data. Please try again.');
    toast.error('Failed to update monthly data');
  } finally {
    setLoading(false);
  }
};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSelectChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Calculate insights from recent entries
  const calculateInsights = (): null | {
    savingsChange: number;
    expenditureChange: number;
    savingsRate: string;
    trend: 'increasing' | 'decreasing';
    } => {
    if (recentEntries.length < 2) return null;

    const latest = recentEntries[0];
    const previous = recentEntries[1];

    const savingsChange = latest.savings - previous.savings;
    const expenditureChange = latest.expenditure - previous.expenditure;
    const savingsRate = ((latest.savings / latest.expenditure) * 100).toFixed(1);

    return {
      savingsChange,
      expenditureChange,
      savingsRate,
      trend: savingsChange > 0 ? 'increasing' : 'decreasing'
    };
  };


  const insights = calculateInsights();

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl mb-2">Monthly Tracker</h1>
        <p className="text-muted-foreground">
          Track your monthly savings and expenditure to monitor your financial progress
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Add Monthly Data
            </CardTitle>
            <CardDescription>
              Enter your savings and expenditure for the selected month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Month and Year Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Select 
                    value={formData.month} 
                    onValueChange={(value: string) => handleSelectChange('month', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select 
                    value={formData.year} 
                    onValueChange={(value: string) => handleSelectChange('year', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
                
                
              {/* Savings Input */}
              <div className="space-y-2">
                <Label htmlFor="savings" className="flex items-center gap-2">
                  <PiggyBank className="h-4 w-4" />
                  Savings Amount
                </Label>
                <Input
                  id="savings"
                  name="savings"
                  type="number"
                  placeholder="Enter savings amount"
                  value={formData.savings}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Amount you saved this month
                </p>
              </div>

              {/* Expenditure Input */}
              <div className="space-y-2">
                <Label htmlFor="expenditure" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Expenditure Amount
                </Label>
                <Input
                  id="expenditure"
                  name="expenditure"
                  type="number"
                  placeholder="Enter expenditure amount"
                  value={formData.expenditure}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Total amount you spent this month
                </p>
              </div>

              {/* Quick Calculation */}
              {formData.savings && formData.expenditure && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h4 className="font-medium">Quick Insights:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Savings Rate:</span>
                      <p className="font-semibold">
                        {((parseFloat(formData.savings) / parseFloat(formData.expenditure)) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Net Amount:</span>
                      <p className="font-semibold">
                        ₹{(parseFloat(formData.expenditure) - parseFloat(formData.savings)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating...' : 'Update Monthly Data'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Entries and Insights */}
        <div className="space-y-6">
          {/* Insights Card */}
          {insights && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Financial Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Current Savings Rate:</span>
                    <span className="font-semibold text-green-600">{insights.savingsRate}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Savings Trend:</span>
                    <span className={`font-semibold flex items-center gap-1 ${
                      insights.savingsChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp className={`h-4 w-4 ${
                        insights.savingsChange < 0 ? 'rotate-180' : ''
                      }`} />
                      {insights.savingsChange >= 0 ? '+' : ''}₹{insights.savingsChange.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {parseFloat(insights.savingsRate) >= 20
 
                        ? "Excellent! You're saving more than 20% of your expenditure."
                        : parseFloat(insights.savingsRate) >= 10
                        ? "Good savings rate! Try to reach 20% for better financial health."
                        : "Consider increasing your savings rate to at least 10% of expenditure."
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Entries</CardTitle>
              <CardDescription>Your last 3 monthly entries</CardDescription>
            </CardHeader>
            <CardContent>
              {recentEntries.length > 0 ? (
                <div className="space-y-3">
                  {recentEntries.map((entry, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg border ${
                        index === 0 ? 'bg-green-50 border-green-200' : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {entry.month} {entry.year}
                          </span>
                          {index === 0 && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {((entry.savings / entry.expenditure) * 100).toFixed(1)}% saved
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Savings:</span>
                          <p className="font-semibold text-green-600">
                            ₹{entry.savings.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Expenditure:</span>
                          <p className="font-semibold">
                            ₹{entry.expenditure.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No entries yet. Start by adding your first monthly data!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Pro Tips for Better Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">Track Regularly</h4>
              <p className="text-sm text-muted-foreground">
                Update your data monthly to maintain accurate financial records
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium mb-2">20% Rule</h4>
              <p className="text-sm text-muted-foreground">
                Aim to save at least 20% of your expenditure each month
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium mb-2">Review Trends</h4>
              <p className="text-sm text-muted-foreground">
                Monitor your savings trends to identify improvement opportunities
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
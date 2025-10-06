import { useState, useEffect } from 'react';
import { useAuth } from '../App.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card.tsx';
import { Badge } from './ui/badge.tsx';
import { Progress } from './ui/progress.tsx';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  PiggyBank,
  Trophy,
  Target,
  Calendar
} from 'lucide-react';

interface JobDetails {
  company: string;
  designation: string;
  salary: number;
}

interface Account {
  bank_name: string;
  balance: number;
}

interface Investment {
  stock: string;
  quantity: number;
  value: number;
}

interface Loan {
  type: string;
  amount: number;
  emi: number;
}

interface Asset {
  type: string;
  value: number;
}
interface Badge {
  name: string;
  description: string;
  icon: string;
  earned_date: string;
}
interface Quests {
  badges: Badge[];
  points: number;
}

interface UserData {
  email: string;
  job: JobDetails
  savings: number[];
  expenditure: number[];
  savings_accounts: Account[];
  current_accounts: Account[];
  investments: Investment[];
  loans: Loan[];
  assets: Asset[];
  quests: Quests;
}

interface DashboardData {
  user: UserData;
}

const Home: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
  try {
    if (!user?.email) {
      console.warn("No logged-in user found");
      return;
    }

    const response = await fetch("http://127.0.0.1:5000/home", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
    });

    if (!response.ok) throw new Error("Failed to fetch user data");

    const data: UserData = await response.json();
    setDashboardData({ user: data });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
  } finally {
    setLoading(false);
  }
};


  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const userData = dashboardData?.user;
  if (!userData) return null;

  // Prepare chart data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const savingsExpenseData = months.map((month, index) => ({
    month,
    savings: userData.savings[index] || 0,
    expenditure: userData.expenditure[index] || 0
  }));

  const totalSavings =
  userData.savings_accounts.reduce((sum, acc) => sum + Number(acc.balance), 0) +
  userData.current_accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  const totalInvestments = userData.investments.reduce((sum, inv) => sum + Number(inv.value), 0);
  const totalAssets = userData.assets.reduce((sum, asset) => sum + Number(asset.value), 0);
  const totalLoans = userData.loans.reduce((sum, loan) => sum + Number(loan.amount), 0);

  const assetData = [
    { name: "Savings", value: totalSavings, color: "#8884d8" },
    { name: "Investments", value: totalInvestments, color: "#82ca9d" },
    { name: "Assets", value: totalAssets, color: "#ffc658" },
    { name: "Loans", value: totalLoans, color: "#ff7c7c" },
  ];


  // Recent savings trend
  const recentSavings = userData.savings.slice(-3);
  const savingsTrend = recentSavings[2] - recentSavings[0];
  const savingsPercentage = ((savingsTrend / recentSavings[0]) * 100).toFixed(1);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl mb-2">Financial Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {userData.email.split('@')[0]}</p>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span className="font-medium">{userData.quests.points} Points</span>
          <Badge variant="secondary">{userData.quests.badges.length} Badges</Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{userData?.job?.salary?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Fixed monthly income
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSavings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {savingsTrend > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {savingsPercentage}% from last quarter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalInvestments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {userData.investments.length} active investments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Loans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalLoans.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ₹{userData.loans.reduce((sum, loan) => sum + loan.emi, 0).toLocaleString()} monthly EMI
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Savings vs Expenditure Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Savings vs Expenditure</CardTitle>
            <CardDescription>Monthly comparison over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={savingsExpenseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, '']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="savings" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Savings" 
                />
                <Line 
                  type="monotone" 
                  dataKey="expenditure" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Expenditure" 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Asset Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Portfolio</CardTitle>
            <CardDescription>Distribution of your financial assets</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assetData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent !== undefined ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {assetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Account Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Savings Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Savings Accounts</CardTitle>
            <CardDescription>{userData.savings_accounts.length} accounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {userData.savings_accounts.map((account, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">{account.bank_name}</span>
                <span className="text-green-600 font-semibold">
                  ₹{account.balance.toLocaleString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Investments */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Investments</CardTitle>
            <CardDescription>{userData.investments.length} stocks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {userData.investments.map((investment, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <div>
                  <span className="font-medium">{investment.stock}</span>
                  <p className="text-xs text-muted-foreground">{investment.quantity} shares</p>
                </div>
                <span className="text-blue-600 font-semibold">
                  ₹{investment.value.toLocaleString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quest Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Quest Progress</CardTitle>
            <CardDescription>Your financial achievements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Progress Points</span>
              <span className="font-bold text-yellow-600">{userData.quests.points}</span>
            </div>
            <Progress value={(userData.quests.points / 2000) * 100} className="w-full" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Earned Badges:</p>
              <div className="flex flex-wrap gap-1">
                {userData.quests.badges.map((badge, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {badge.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to manage your finances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-accent transition-colors cursor-pointer">
              <Calendar className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm font-medium">Update Monthly Data</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-accent transition-colors cursor-pointer">
              <Target className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm font-medium">Set Goals</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-accent transition-colors cursor-pointer">
              <TrendingUp className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm font-medium">View Credit Score</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-accent transition-colors cursor-pointer">
              <Trophy className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm font-medium">Complete Quests</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export default Home;
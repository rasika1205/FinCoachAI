import { useState, useEffect } from 'react';
import { useAuth } from '../App.tsx';
import { Button } from './ui/button.tsx';
import { Input } from './ui/input.tsx';
import { Label } from './ui/label.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card.tsx';
import { Alert, AlertDescription } from './ui/alert.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select.tsx';
import { Badge } from './ui/badge.tsx';
import { 
  Plus, 
  Trash2, 
  Building2, 
  CreditCard, 
  TrendingUp, 
  Briefcase,
  PiggyBank,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

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

type ArrayKeys = 'savings_accounts' | 'current_accounts' | 'loans' | 'assets' | 'investments';

interface JobDetails {
  company: string;
  designation: string;
  salary: number;
}

interface UserData {
  savings_accounts: Account[];
  current_accounts: Account[];
  fds: number;
  pf: number;
  loans: Loan[];
  assets: Asset[];
  investments: Investment[];
  job: JobDetails;
}
export default function Update() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState('accounts');

  const fetchUserData = async () => {
    if (!user?.email) return; // if user not logged in

    try {
    const response = await fetch(`http://localhost:5000/api/user/profile?email=${user.email}`);
    if (!response.ok) throw new Error('Failed to fetch user data');
    const data = await response.json();

    // Map 'job' to 'job_details'
    setUserData({
      savings_accounts: data.savings_accounts,
      current_accounts: data.current_accounts,
      fds: 0,   // default if backend doesn't send
      pf: 0,    // default if backend doesn't send
      loans: data.loans,
      assets: data.assets,
      investments: data.investments,
      job: data.job || { company: '', designation: '', salary: 0 }
    });
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    toast.error('Failed to load user data from server');
  }
};

  useEffect(() => {
    fetchUserData();
  }, []);


  const handleArrayChange = <T extends ArrayKeys>(
  arrayName: T,
  index: number,
  field: string,
  value: any
) => {
  if (!userData) return;

  setUserData(prev => ({
    ...prev!,
    [arrayName]: prev![arrayName].map((item: any, i: number) =>
      i === index ? { ...item, [field]: value } : item
    ),
  }));
};

const addArrayItem = <T extends ArrayKeys>(arrayName: T, template: any) => {
  if (!userData) return;

  setUserData(prev => ({
    ...prev!,
    [arrayName]: [...prev![arrayName], template],
  }));
};

const removeArrayItem = <T extends ArrayKeys>(arrayName: T, index: number) => {
  if (!userData) return;

  setUserData(prev => ({
    ...prev!,
    [arrayName]: prev![arrayName].filter((_: any, i: number) => i !== index),
  }));
};
  

  const handleJobDetailsChange = (field: keyof JobDetails, value: string | number) => {
  if (!userData) return;
  setUserData(prev => ({
  ...prev!,
  job: {
    ...prev!.job,
    [field]: value
  },
}));

};


  const handleSimpleFieldChange = (field: keyof UserData, value: any) => {
    if (!userData) return;
    setUserData(prev => ({
      ...prev!,
      [field]: value,
    }));
  };
  const handleSubmit = async (tabName: 'accounts' | 'investments' | 'assets' | 'job') => {
    if (!userData || !user?.email) return;
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: tabName,
          data: { ...userData, email: user.email } // attach email explicitly
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`${tabName} updated successfully!`);
        setUserData(result.updated_user); //  refresh local data
        checkQuestUpdates(tabName);
      } else {
        toast.error(result.error || `Failed to update ${tabName}`);
      }
    } catch (error) {
      toast.error(`Failed to update ${tabName}`);
    } finally {
      setLoading(false);
    }
  };

  const checkQuestUpdates = async (section: string) => {
  if (!user?.email) return;

  try {
    const res = await fetch(`http://localhost:5000/quests/check/${section}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
    });
    const data = await res.json();

    if (data.points_awarded > 0) {
      toast.success(`🏆 ${data.badge.name}!`, {
        description: data.badge.description
      });
      fetchUserData(); // Refresh quests and leaderboard
    }
  } catch (err) {
    console.error(err);
    toast.error("Failed to check quest updates");
  }
};


  if (!userData) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-10 bg-muted rounded"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl mb-2 flex items-center justify-center gap-2">
          <Settings className="h-8 w-8" />
          Update Financial Profile
        </h1>
        <p className="text-muted-foreground">
          Keep your financial information up to date to get better insights and recommendations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Accounts
          </TabsTrigger>
          <TabsTrigger value="investments" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Investments
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
            Assets & Loans
          </TabsTrigger>
          <TabsTrigger value="job" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Job Details
          </TabsTrigger>
        </TabsList>

        {/* Accounts Tab */}
        <TabsContent value="accounts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Savings Accounts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Savings Accounts
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('savings_accounts', { bank_name: '', balance: '' })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </CardTitle>
                <CardDescription>Manage your savings accounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {userData.savings_accounts.map((account, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Bank name"
                      value={account.bank_name}
                      onChange={(e) => handleArrayChange('savings_accounts', index, 'bank_name', e.target.value)}
                    />
                    <Input
                      placeholder="Balance"
                      type="number"
                      value={account.balance}
                      onChange={(e) => handleArrayChange('savings_accounts', index, 'balance', parseFloat(e.target.value) || 0)}
                    />
                    {userData.savings_accounts.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('savings_accounts', index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    Total Savings: ₹{userData.savings_accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Current Accounts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Current Accounts
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('current_accounts', { bank_name: '', balance: '' })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </CardTitle>
                <CardDescription>Manage your current accounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {userData.current_accounts.map((account, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Bank name"
                      value={account.bank_name}
                      onChange={(e) => handleArrayChange('current_accounts', index, 'bank_name', e.target.value)}
                    />
                    <Input
                      placeholder="Balance"
                      type="number"
                      value={account.balance}
                      onChange={(e) => handleArrayChange('current_accounts', index, 'balance', parseFloat(e.target.value) || 0)}
                    />
                    {userData.current_accounts.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('current_accounts', index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    Total Current: ₹{userData.current_accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* FDs and PF */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Fixed Deposits & Provident Funds</CardTitle>
                <CardDescription>Update your FD and PF counts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fds">Number of Fixed Deposits</Label>
                    <Input
                      id="fds"
                      type="number"
                      value={userData.fds}
                      onChange={(e) => handleSimpleFieldChange('fds', parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pf">Number of Provident Funds</Label>
                    <Input
                      id="pf"
                      type="number"
                      value={userData.pf}
                      onChange={(e) => handleSimpleFieldChange('pf', parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => handleSubmit('accounts')} disabled={loading}>
              {loading ? 'Updating...' : 'Update Accounts'}
            </Button>
          </div>
        </TabsContent>

        {/* Investments Tab */}
        <TabsContent value="investments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Stock Investments
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('investments', { stock: '', quantity: '', value: '' })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Stock
                </Button>
              </CardTitle>
              <CardDescription>Manage your stock portfolio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userData.investments.length > 0 ? (
                <>
                  {userData.investments.map((investment, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Stock symbol (e.g., RELIANCE)"
                        value={investment.stock}
                        onChange={(e) => handleArrayChange('investments', index, 'stock', e.target.value)}
                      />
                      <Input
                        placeholder="Quantity"
                        type="number"
                        value={investment.quantity}
                        onChange={(e) => handleArrayChange('investments', index, 'quantity', parseInt(e.target.value) || 0)}
                      />
                      <Input
                        placeholder="Current value"
                        type="number"
                        value={investment.value}
                        onChange={(e) => handleArrayChange('investments', index, 'value', parseFloat(e.target.value) || 0)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('investments', index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="pt-2 p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Portfolio Summary:</p>
                    <p className="text-lg font-bold text-green-600">
                      Total Value: ₹{userData.investments.reduce((sum, inv) => sum + (inv.value || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {userData.investments.length} stock{userData.investments.length > 1 ? 's' : ''} in portfolio
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No investments added yet.</p>
                  <p className="text-sm">Start building your portfolio by adding your first stock!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => handleSubmit('investments')} disabled={loading}>
              {loading ? 'Updating...' : 'Update Investments'}
            </Button>
          </div>
        </TabsContent>

        {/* Assets & Loans Tab */}
        <TabsContent value="assets" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Assets
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('assets', { type: '', value: '' })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Asset
                  </Button>
                </CardTitle>
                <CardDescription>Real estate, gold, vehicles, etc.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {userData.assets.length > 0 ? (
                  <>
                    {userData.assets.map((asset, index) => (
                      <div key={index} className="flex gap-2">
                        <Select
                          value={asset.type}
                          onValueChange={(value: string) => handleArrayChange('assets', index, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Asset type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Real Estate">Real Estate</SelectItem>
                            <SelectItem value="Gold">Gold</SelectItem>
                            <SelectItem value="Vehicle">Vehicle</SelectItem>
                            <SelectItem value="Jewelry">Jewelry</SelectItem>
                            <SelectItem value="Electronics">Electronics</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Current value"
                          type="number"
                          value={asset.value}
                          onChange={(e) => handleArrayChange('assets', index, 'value', parseFloat(e.target.value) || 0)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('assets', index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="pt-2">
                      <p className="text-sm text-muted-foreground">
                        Total Assets: ₹{userData.assets.reduce((sum, asset) => sum + (asset.value || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No assets recorded yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Loans */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Loans
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('loans', { type: '', amount: '', emi: '' })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Loan
                  </Button>
                </CardTitle>
                <CardDescription>Home loans, car loans, personal loans</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {userData.loans.length > 0 ? (
                  <>
                    {userData.loans.map((loan, index) => (
                      <div key={index} className="space-y-2 p-3 border rounded-lg">
                        <Select
                          value={loan.type}
                          onValueChange={(value: string) => handleArrayChange('loans', index, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Loan type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="home">Home Loan</SelectItem>
                            <SelectItem value="car">Car Loan</SelectItem>
                            <SelectItem value="personal">Personal Loan</SelectItem>
                            <SelectItem value="education">Education Loan</SelectItem>
                            <SelectItem value="business">Business Loan</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Outstanding amount"
                            type="number"
                            value={loan.amount}
                            onChange={(e) => handleArrayChange('loans', index, 'amount', parseFloat(e.target.value) || 0)}
                          />
                          <Input
                            placeholder="Monthly EMI"
                            type="number"
                            value={loan.emi}
                            onChange={(e) => handleArrayChange('loans', index, 'emi', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('loans', index)}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove Loan
                        </Button>
                      </div>
                    ))}
                    <div className="pt-2 p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-800 mb-1">Loan Summary:</p>
                      <p className="font-bold text-red-600">
                        Total Outstanding: ₹{userData.loans.reduce((sum, loan) => sum + (loan.amount || 0), 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-red-600">
                        Monthly EMI: ₹{userData.loans.reduce((sum, loan) => sum + (loan.emi || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No loans recorded.</p>
                    <p className="text-sm">Great! You're debt-free.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => handleSubmit('assets')} disabled={loading}>
              {loading ? 'Updating...' : 'Update Assets & Loans'}
            </Button>
          </div>
        </TabsContent>

        {/* Job Details Tab */}
        <TabsContent value="job" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>Update your employment information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    placeholder="Enter your company name"
                    value={userData?.job?.company || ''}
                    onChange={(e) => handleJobDetailsChange('company', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    placeholder="Your job title"
                    value={userData?.job?.designation || ''}
                    onChange={(e) => handleJobDetailsChange('designation', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary</Label>
                  <Input
                    id="salary"
                    type="number"
                    placeholder="Your salary"
                    value={userData?.job?.salary || 0}
                    onChange={(e) => handleJobDetailsChange('salary', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </div>

              {userData.job.company && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Career Summary</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {userData.job.designation}
                    </Badge>
                    <Badge variant="secondary">
                      {userData.job.salary} LPA
                    </Badge>
                    <Badge variant="secondary">
                      {userData.job.company}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => handleSubmit('job')} disabled={loading}>
              {loading ? 'Updating...' : 'Update Job Details'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                ₹{(
                  userData.savings_accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0) +
                  userData.current_accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
                ).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Savings</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                ₹{userData.investments.reduce((sum, inv) => sum + (inv.value || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Investments</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">
                ₹{userData.assets.reduce((sum, asset) => sum + (asset.value || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Assets</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                ₹{userData.loans.reduce((sum, loan) => sum + (loan.amount || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Outstanding Loans</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
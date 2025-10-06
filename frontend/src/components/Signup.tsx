import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App.tsx';
import { Button } from './ui/button.tsx';
import { Input } from './ui/input.tsx';
import { Label } from './ui/label.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card.tsx';
import { Alert, AlertDescription } from './ui/alert.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select.tsx';
import { DollarSign, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  salary: string;
  savings_accounts: { bank_name: string; balance: string }[];
  current_accounts: { bank_name: string; balance: string }[];
  fds: string;
  pf: string;
  loans: { type: string; amount: string; emi: string }[];
  assets: { type: string; value: string }[];
  investments: { stock: string; quantity: string; value: string }[];
  job_details: { company: string; designation: string; years_experience: string };
}


export default function Signup() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    salary: '',
    savings_accounts: [{ bank_name: '', balance: '' }],
    current_accounts: [{ bank_name: '', balance: '' }],
    fds: '',
    pf: '',
    loans: [{ type: '', amount: '', emi: '' }],
    assets: [{ type: '', value: '' }],
    investments: [{ stock: '', quantity: '', value: '' }],
    job_details: {
      company: '',
      designation: '',
      years_experience: ''
    }
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('basic');
  
  const { signup, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.email || !formData.password || !formData.salary) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Clean up form data
    const cleanedData = {
      ...formData,
      salary: parseFloat(formData.salary),
      fds: parseInt(formData.fds) || 0,
      pf: parseInt(formData.pf) || 0,
      savings_accounts: formData.savings_accounts.filter(acc => acc.bank_name && acc.balance),
      current_accounts: formData.current_accounts.filter(acc => acc.bank_name && acc.balance),
      loans: formData.loans.filter(loan => loan.type && loan.amount),
      assets: formData.assets.filter(asset => asset.type && asset.value),
      investments: formData.investments.filter(inv => inv.stock && inv.quantity),
      job_details: {
        ...formData.job_details,
        years_experience: parseInt(formData.job_details.years_experience) || 0
      }
    };

    const result = await signup(cleanedData);
    
    if (result.success) {
      toast.success('Account created successfully!');
      navigate('/tracker');
    } else {
      setError(result.error ?? null);
      toast.error(result.error ?? 'An unknown error occurred');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('job_details.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        job_details: {
          ...prev.job_details,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleArrayChange = (
  arrayName: keyof Pick<
    FormData,
    'savings_accounts' | 'current_accounts' | 'loans' | 'assets' | 'investments'
  >,
  index: number,
  field: string,
  value: string
) => {
  setFormData(prev => ({
    ...prev,
    [arrayName]: (prev[arrayName] as any[]).map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
  }));
};

const addArrayItem = (
  arrayName: keyof Pick<
    FormData,
    'savings_accounts' | 'current_accounts' | 'loans' | 'assets' | 'investments'
  >,
  template: Record<string, string>
) => {
  setFormData(prev => ({
    ...prev,
    [arrayName]: [...(prev[arrayName] as any[]), template]
  }));
};

const removeArrayItem = (
  arrayName: keyof Pick<
    FormData,
    'savings_accounts' | 'current_accounts' | 'loans' | 'assets' | 'investments'
  >,
  index: number
) => {
  setFormData(prev => ({
    ...prev,
    [arrayName]: (prev[arrayName] as any[]).filter((_, i) => i !== index)
  }));
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-full">
              <DollarSign className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Join FinCoach AI</CardTitle>
          <CardDescription>
            Create your account and start your financial journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="accounts">Accounts</TabsTrigger>
                <TabsTrigger value="investments">Investments</TabsTrigger>
                <TabsTrigger value="job">Job Details</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="salary">Monthly Salary *</Label>
                    <Input
                      id="salary"
                      name="salary"
                      type="number"
                      placeholder="Enter monthly salary"
                      value={formData.salary}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="accounts" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Savings Accounts</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addArrayItem('savings_accounts', { bank_name: '', balance: '' })}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    {formData.savings_accounts.map((account, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Input
                          placeholder="Bank name"
                          value={account.bank_name}
                          onChange={(e) => handleArrayChange('savings_accounts', index, 'bank_name', e.target.value)}
                        />
                        <Input
                          placeholder="Balance"
                          type="number"
                          value={account.balance}
                          onChange={(e) => handleArrayChange('savings_accounts', index, 'balance', e.target.value)}
                        />
                        {formData.savings_accounts.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeArrayItem('savings_accounts', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Current Accounts</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addArrayItem('current_accounts', { bank_name: '', balance: '' })}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    {formData.current_accounts.map((account, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Input
                          placeholder="Bank name"
                          value={account.bank_name}
                          onChange={(e) => handleArrayChange('current_accounts', index, 'bank_name', e.target.value)}
                        />
                        <Input
                          placeholder="Balance"
                          type="number"
                          value={account.balance}
                          onChange={(e) => handleArrayChange('current_accounts', index, 'balance', e.target.value)}
                        />
                        {formData.current_accounts.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeArrayItem('current_accounts', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fds">Fixed Deposits</Label>
                      <Input
                        id="fds"
                        name="fds"
                        type="number"
                        placeholder="Number of FDs"
                        value={formData.fds}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pf">Provident Funds</Label>
                      <Input
                        id="pf"
                        name="pf"
                        type="number"
                        placeholder="Number of PFs"
                        value={formData.pf}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="investments" className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Loans</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem('loans', { type: '', amount: '', emi: '' })}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {formData.loans.map((loan, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Select
                        value={loan.type || ''}
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
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Amount"
                        type="number"
                        value={loan.amount}
                        onChange={(e) => handleArrayChange('loans', index, 'amount', e.target.value)}
                      />
                      <Input
                        placeholder="EMI"
                        type="number"
                        value={loan.emi}
                        onChange={(e) => handleArrayChange('loans', index, 'emi', e.target.value)}
                      />
                      {formData.loans.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('loans', index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Assets</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem('assets', { type: '', value: '' })}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {formData.assets.map((asset, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        placeholder="Asset type"
                        value={asset.type}
                        onChange={(e) => handleArrayChange('assets', index, 'type', e.target.value)}
                      />
                      <Input
                        placeholder="Value"
                        type="number"
                        value={asset.value}
                        onChange={(e) => handleArrayChange('assets', index, 'value', e.target.value)}
                      />
                      {formData.assets.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('assets', index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Investments</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem('investments', { stock: '', quantity: '', value: '' })}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {formData.investments.map((investment, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        placeholder="Stock name"
                        value={investment.stock}
                        onChange={(e) => handleArrayChange('investments', index, 'stock', e.target.value)}
                      />
                      <Input
                        placeholder="Quantity"
                        type="number"
                        value={investment.quantity}
                        onChange={(e) => handleArrayChange('investments', index, 'quantity', e.target.value)}
                      />
                      <Input
                        placeholder="Value"
                        type="number"
                        value={investment.value}
                        onChange={(e) => handleArrayChange('investments', index, 'value', e.target.value)}
                      />
                      {formData.investments.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('investments', index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="job" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="job_details.company">Company</Label>
                    <Input
                      id="job_details.company"
                      name="job_details.company"
                      placeholder="Enter company name"
                      value={formData.job_details.company}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job_details.designation">Designation</Label>
                    <Input
                      id="job_details.designation"
                      name="job_details.designation"
                      placeholder="Enter your designation"
                      value={formData.job_details.designation}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job_details.years_experience">Years of Experience</Label>
                    <Input
                      id="job_details.years_experience"
                      name="job_details.years_experience"
                      type="number"
                      placeholder="Years of experience"
                      value={formData.job_details.years_experience}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const tabs = ['basic', 'accounts', 'investments', 'job'];
                  const currentIndex = tabs.indexOf(currentTab);
                  if (currentIndex > 0) {
                    setCurrentTab(tabs[currentIndex - 1]);
                  }
                }}
                disabled={currentTab === 'basic'}
              >
                Previous
              </Button>
              
              {currentTab === 'job' ? (
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    const tabs = ['basic', 'accounts', 'investments', 'job'];
                    const currentIndex = tabs.indexOf(currentTab);
                    if (currentIndex < tabs.length - 1) {
                      setCurrentTab(tabs[currentIndex + 1]);
                    }
                  }}
                >
                  Next
                </Button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
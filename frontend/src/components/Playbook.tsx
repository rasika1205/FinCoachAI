import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../App.tsx';
import { Button } from './ui/button.tsx';
import { Input } from './ui/input.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card.tsx';
import { Badge } from './ui/badge.tsx';
import { ScrollArea } from './ui/scroll-area.tsx';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  BookOpen, 
  Lightbulb,
  TrendingUp,
  PiggyBank,
  Target,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

type ActionItem = {
  text: string;
  priority: "high" | "medium" | "low";
};

type Message = {
  id: number;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  actions?: ActionItem[];
};

export default function Playbook() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize with welcome message and suggestions
    setMessages([{
      id: 1,
      type: 'bot',
      content: `Welcome to your AI Financial Advisor! 👋

I'm here to help you with personalized financial planning based on your profile. I can assist you with:

• Investment strategies tailored to your income
• Savings optimization techniques  
• Debt management and loan planning
• Financial goal setting and tracking
• Market insights and recommendations

What would you like to discuss today?`,
      timestamp: new Date()
    }]);

    setSuggestions([
      "How can I improve my savings rate?",
      "What investment strategy suits my profile?",
      "Should I pay off my loans early?",
      "How to set realistic financial goals?",
      "Best practices for emergency fund?"
    ]);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (!currentMessage.trim()) return;

  const userMessage: Message = {
    id: Date.now(),
    type: 'user',
    content: currentMessage,
    timestamp: new Date(),
  };

  setMessages(prev => [...prev, userMessage]);
  setCurrentMessage('');
  setLoading(true);

  try {
    const response = await fetch('http://localhost:5000/playbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user?.email,
        query: currentMessage,
      }),
    });

    if (!response.ok) {
      throw new Error('API error');
    }

    const data = await response.json();

    const botMessage: Message = {
      id: Date.now() + 1,
      type: 'bot',
      content: data.advice,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, botMessage]);
  } catch (error) {
    console.error('Error fetching advice:', error);
    toast.error('Failed to get financial advice');

    const errorMessage: Message = {
      id: Date.now() + 1,
      type: 'bot',
      content:
        "I'm sorry, but I'm having trouble connecting to the financial advisor service. Please try again later.",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, errorMessage]);
  } finally {
    setLoading(false);
  }
};


  const handleSuggestionClick = (suggestion: string) => {
    setCurrentMessage(suggestion);
  };


  const generateActionItems = (question: string): ActionItem[] => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('savings')) {
      return [
        { text: "Set up automatic savings transfer", priority: "high" },
        { text: "Review and optimize monthly expenses", priority: "medium" },
        { text: "Open high-yield savings account", priority: "low" }
      ];
    }
    
    if (lowerQuestion.includes('investment')) {
      return [
        { text: "Start SIP in diversified equity fund", priority: "high" },
        { text: "Complete KYC and open investment accounts", priority: "high" },
        { text: "Set up portfolio review reminders", priority: "low" }
      ];
    }
    
    return [
      { text: "Update financial profile", priority: "medium" },
      { text: "Set monthly review reminder", priority: "low" }
    ];
  };

  const formatMessage = (content: string) => {
  return content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/• (.*?)(\n|$)/g, "<ul><li>$1</li></ul>")
    .replace(/(\d+\.) (.*?)(\n|$)/g, "<ol><li>$2</li></ol>")
    .split("\n")
    .map(line => line.trim())
    .filter(line => line)
    .join("<br/>");
};


  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
        {/* Main Chat Area */}
        <div className="lg:col-span-3 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                AI Financial Playbook
              </CardTitle>
              <CardDescription>
                Get personalized financial advice powered by AI and your profile data
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.type === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-blue-500 text-white'
                        }`}>
                          {message.type === 'user' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>
                        
                        <div className={`p-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}>
                          <div 
                            className="text-sm whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                          />
                          
                          {message.actions && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-medium opacity-75">Recommended Actions:</p>
                              {message.actions.map((action, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    action.priority === 'high' ? 'bg-red-500' :
                                    action.priority === 'medium' ? 'bg-yellow-500' :
                                    'bg-green-500'
                                  }`} />
                                  <span className="text-xs">{action.text}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="text-xs opacity-50 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {loading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                          <span className="text-sm">Analyzing your financial profile...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Input Area */}
              <div className="border-t p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="Ask me anything about your finances..."
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={loading || !currentMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="h-4 w-4" />
                Quick Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full text-left justify-start h-auto p-3 whitespace-normal"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <MessageCircle className="h-3 w-3 mr-2 flex-shrink-0 mt-0.5" />
                  {suggestion}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Financial Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-4 w-4" />
                Popular Topics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg cursor-pointer">
                <PiggyBank className="h-4 w-4 text-green-500" />
                <span className="text-sm">Savings Optimization</span>
              </div>
              <div className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg cursor-pointer">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Investment Planning</span>
              </div>
              <div className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg cursor-pointer">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Risk Management</span>
              </div>
              <div className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg cursor-pointer">
                <Clock className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Retirement Planning</span>
              </div>
            </CardContent>
          </Card>

          {/* AI Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-4 w-4" />
                AI Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Badge variant="secondary" className="w-full justify-start">
                  <Bot className="h-3 w-3 mr-1" />
                  Personalized Advice
                </Badge>
                <Badge variant="secondary" className="w-full justify-start">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Market Insights  
                </Badge>
                <Badge variant="secondary" className="w-full justify-start">
                  <Target className="h-3 w-3 mr-1" />
                  Goal Planning
                </Badge>
                <Badge variant="secondary" className="w-full justify-start">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Risk Analysis
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Powered by advanced AI trained on financial expertise and your personal data.
              </p>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Important Disclaimer:</p>
                  <p>
                    This AI advisor provides general guidance based on your profile. 
                    Always consult with certified financial advisors for major investment decisions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
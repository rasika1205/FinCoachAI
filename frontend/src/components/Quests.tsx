import { useState, useEffect } from 'react';
import { useAuth } from '../App.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card.tsx';
import { Badge } from './ui/badge.tsx';
import { Progress } from './ui/progress.tsx';
import { Button } from './ui/button.tsx';
import { 
  Trophy, 
  Star, 
  Target, 
  CheckCircle, 
  Clock, 
  Gift,
  TrendingUp,
  PiggyBank,
  Building2,
  CreditCard,
  Briefcase,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

interface Quest {
  id: number;
  title: string;
  description: string;
  icon: string;
  points: number;
  progress: number;
  max_progress: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Badge {
  name: string;
  description: string;
  icon: string;
  earned_date: string;
}

interface CompletedQuest {
  id: number;
  title: string;
  description: string;
  points: number;
  completed_date: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  level: number;
}

interface QuestData {
  user_points: number;
  user_level: number;
  user_badges: Badge[];
  available_quests: Quest[];
  completed_quests: CompletedQuest[];
  leaderboard: LeaderboardEntry[];
}

export default function Quests() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [questData, setQuestData] = useState<QuestData | null>(null);

  const fetchQuestData = async () => {
    if (!user?.email) return;
    setLoading(true);

    try {
      // Fetch quests
      const questRes = await fetch(`http://localhost:5000/quests?email=${user.email}`);
      if (!questRes.ok) throw new Error("Failed to fetch quests");
      const questsJson = await questRes.json();

      // Fetch leaderboard
      const lbRes = await fetch("http://localhost:5000/quests/leaderboard");
      const leaderboardJson = lbRes.ok ? await lbRes.json() : { leaderboard: [] };

      setQuestData({
        ...questsJson,
        leaderboard: leaderboardJson.leaderboard
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load quest data");
      setQuestData({
        user_points: 0,
        user_level: 1,
        user_badges: [],
        available_quests: [],
        completed_quests: [],
        leaderboard: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestData();
  }, []);

  const claimReward = async (questId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/update/quests/${questId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email })
      });
      if (!response.ok) throw new Error("Failed to claim reward");
      const result = await response.json();
      toast.success(`🎉 Quest completed! +${result.points} points`);
      fetchQuestData(); // Refresh quests and leaderboard
    } catch (error) {
      console.error(error);
      toast.error("Failed to claim quest reward");
    }
  };

  const getIconComponent = (iconName: string) => {
  const icons: Record<string, React.ComponentType<any>> = {
    Trophy,
    Star,
    Target,
    PiggyBank,
    TrendingUp,
    Building2,
    CreditCard,
    Briefcase,
    Calendar,
    Gift
  };
  return icons[iconName] || Trophy;
};

  const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy': return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'hard': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'tracking': return 'bg-blue-500';
    case 'savings': return 'bg-green-500';
    case 'investment': return 'bg-purple-500';
    case 'assets': return 'bg-orange-500';
    case 'credit': return 'bg-pink-500';
    case 'advice': return 'bg-indigo-500';
    default: return 'bg-gray-500';
  }
};

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!questData) return null;

  const nextLevelPoints = questData.user_level * 500;
  const currentLevelProgress = (questData.user_points % 500);
  const progressPercentage = (currentLevelProgress / 500) * 100;

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl mb-2 flex items-center justify-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Financial Quests
        </h1>
        <p className="text-muted-foreground">
          Complete challenges to earn points, badges, and improve your financial habits
        </p>
      </div>

      {/* User Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Level {questData.user_level}
            </CardTitle>
            <CardDescription>Your current level</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-2">
              <Progress value={progressPercentage} className="w-full" />
              <p className="text-sm text-muted-foreground">
                {currentLevelProgress} / 500 XP to Level {questData.user_level + 1}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Gift className="h-5 w-5 text-blue-500" />
              {questData.user_points} Points
            </CardTitle>
            <CardDescription>Total points earned</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {questData.user_points.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Keep earning more!</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Trophy className="h-5 w-5 text-green-500" />
              {questData.user_badges.length} Badges
            </CardTitle>
            <CardDescription>Achievements unlocked</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {questData.user_badges.length}
            </div>
            <p className="text-sm text-muted-foreground">Collect them all!</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Quests */}
      <Card>
        <CardHeader>
          <CardTitle>Active Quests</CardTitle>
          <CardDescription>Complete these challenges to earn points and badges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questData.available_quests.map((quest) => {
              const IconComponent = getIconComponent(quest.icon);
              const isCompleted = quest.progress >= quest.max_progress;
              
              return (
                <div
                  key={quest.id}
                  className={`p-4 border rounded-lg ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-card'}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getCategoryColor(quest.category)} bg-opacity-20`}>
                        <IconComponent className={`h-5 w-5 ${getCategoryColor(quest.category).replace('bg-', 'text-')}`} />
                      </div>
                      <div>
                        <h4 className="font-medium">{quest.title}</h4>
                        <p className="text-sm text-muted-foreground">{quest.description}</p>
                      </div>
                    </div>
                    <Badge className={getDifficultyColor(quest.difficulty)}>
                      {quest.difficulty}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress: {quest.progress}/{quest.max_progress}</span>
                      <span className="font-semibold text-blue-600">+{quest.points} pts</span>
                    </div>
                    <Progress 
                      value={(quest.progress / quest.max_progress) * 100} 
                      className="w-full"
                    />
                  </div>

                  {isCompleted && (
                    <Button 
                      onClick={() => claimReward(quest.id)}
                      className="w-full mt-3"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Claim Reward
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Earned Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Earned Badges</CardTitle>
          <CardDescription>Your achievements and milestones</CardDescription>
        </CardHeader>
        <CardContent>
          {questData.user_badges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {questData.user_badges.map((badge, index) => {
                const IconComponent = getIconComponent(badge.icon);
                
                return (
                  <div key={index} className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="p-2 bg-yellow-500 bg-opacity-20 rounded-full">
                      <IconComponent className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{badge.name}</h4>
                      <p className="text-sm text-muted-foreground">{badge.description}</p>
                      <p className="text-xs text-yellow-600">
                        Earned: {badge.earned_date ? new Date(badge.earned_date).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No badges earned yet.</p>
              <p className="text-sm">Complete your first quest to earn your first badge!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Quests */}
      {questData.completed_quests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed Quests</CardTitle>
            <CardDescription>Your past achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {questData.completed_quests.map((quest) => (
                <div key={quest.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-medium">{quest.title}</h4>
                      <p className="text-sm text-muted-foreground">{quest.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-600">+{quest.points} pts</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(quest.completed_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>See how you rank among other users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {questData.leaderboard.map((user) => (
              <div 
                key={user.rank} 
                className={`flex items-center justify-between p-3 rounded-lg ${
                  user.name === 'You' ? 'bg-blue-50 border border-blue-200' : 'bg-muted'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    user.rank === 1 ? 'bg-yellow-500 text-white' :
                    user.rank === 2 ? 'bg-gray-400 text-white' :
                    user.rank === 3 ? 'bg-orange-500 text-white' :
                    'bg-gray-200 text-gray-700'
                  }`}>
                    {user.rank}
                  </div>
                  <div>
                    <p className={`font-medium ${user.name === 'You' ? 'text-blue-600' : ''}`}>
                      {user.name}
                    </p>
                    <p className="text-sm text-muted-foreground">Level {user.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{user.points.toLocaleString()} pts</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
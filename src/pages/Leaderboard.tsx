import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { quizApi, leaderboardApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, Home } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  accuracy: number;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {
    if (selectedQuizId) {
      loadLeaderboard(selectedQuizId);
    }
  }, [selectedQuizId]);

  const loadQuizzes = async () => {
    try {
      const data = await quizApi.getAll();
      
      if (data.quizzes && data.quizzes.length > 0) {
        setQuizzes(data.quizzes);
        setSelectedQuizId(data.quizzes[0]._id);
      }
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    }
  };

  const loadLeaderboard = async (quizId: string) => {
    try {
      const data = await leaderboardApi.get(quizId);
      
      const leaderboardData = data.leaderboard.map((entry: any, idx: number) => ({
        name: entry.name,
        score: entry.score,
        accuracy: entry.accuracy,
        rank: idx + 1,
      }));
      
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-blob-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-blob-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto pt-6 sm:pt-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-12 gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Award className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-accent" />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Leaderboard
            </h1>
          </div>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="border-accent/50 hover:bg-accent/20"
          >
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </div>

        {quizzes.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
              <SelectTrigger className="w-full sm:w-64 bg-card border-primary/50">
                <SelectValue placeholder="Select Quiz" />
              </SelectTrigger>
              <SelectContent>
                {quizzes.map((quiz) => (
                  <SelectItem key={quiz._id} value={quiz._id}>
                    {quiz.title || `Quiz ${quiz.code}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {leaderboard.length > 0 ? (
          <div className="space-y-6 sm:space-y-8">
            {/* Podium Display for Top 3 */}
            {leaderboard.length >= 3 && (
              <div className="relative flex items-end justify-center gap-2 sm:gap-4 mb-8 sm:mb-12 h-64 sm:h-80">
                {/* Second Place */}
                <div className="flex flex-col items-center scale-75 sm:scale-100">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center mb-2 sm:mb-4 border-2 sm:border-4 border-white shadow-xl">
                    <span className="text-2xl sm:text-4xl font-bold text-white">2</span>
                  </div>
                  <p className="text-sm sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2 text-center px-1">{leaderboard[1].name}</p>
                  <p className="text-xs sm:text-base lg:text-lg font-semibold text-accent">{leaderboard[1].score} OP</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{leaderboard[1].accuracy.toFixed(0)}%</p>
                  <div className="w-20 h-24 sm:w-32 sm:h-40 bg-primary/20 rounded-t-xl mt-2 sm:mt-4 flex items-center justify-center">
                    <span className="text-3xl sm:text-6xl font-bold text-white/50">2</span>
                  </div>
                </div>

                {/* First Place */}
                <div className="flex flex-col items-center -mt-4 sm:-mt-8 scale-90 sm:scale-100">
                  <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center mb-2 sm:mb-4 border-2 sm:border-4 border-white shadow-2xl relative">
                    <span className="text-3xl sm:text-5xl font-bold text-white">1</span>
                    <div className="absolute -top-4 sm:-top-8 w-8 h-8 sm:w-12 sm:h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Award className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                    </div>
                  </div>
                  <p className="text-base sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2 text-center px-1">{leaderboard[0].name}</p>
                  <p className="text-sm sm:text-lg lg:text-xl font-semibold text-accent">{leaderboard[0].score} OP</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{leaderboard[0].accuracy.toFixed(0)}%</p>
                  <div className="w-20 h-32 sm:w-32 sm:h-52 bg-primary/30 rounded-t-xl mt-2 sm:mt-4 flex items-center justify-center">
                    <span className="text-4xl sm:text-7xl font-bold text-white/50">1</span>
                  </div>
                </div>

                {/* Third Place */}
                <div className="flex flex-col items-center scale-75 sm:scale-100">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center mb-2 sm:mb-4 border-2 sm:border-4 border-white shadow-xl">
                    <span className="text-2xl sm:text-4xl font-bold text-white">3</span>
                  </div>
                  <p className="text-sm sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2 text-center px-1">{leaderboard[2].name}</p>
                  <p className="text-xs sm:text-base lg:text-lg font-semibold text-accent">{leaderboard[2].score} OP</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{leaderboard[2].accuracy.toFixed(0)}%</p>
                  <div className="w-20 h-20 sm:w-32 sm:h-32 bg-primary/15 rounded-t-xl mt-2 sm:mt-4 flex items-center justify-center">
                    <span className="text-3xl sm:text-6xl font-bold text-white/50">3</span>
                  </div>
                </div>
              </div>
            )}

            {/* Rest of the leaderboard */}
            {leaderboard.length > 3 && (
              <Card className="bg-card/80 backdrop-blur-sm border border-primary/20 p-4 sm:p-6 lg:p-8">
                <div className="space-y-2 sm:space-y-3">
                  {leaderboard.slice(3).map((entry, idx) => (
                    <div
                      key={idx + 3}
                      className="bg-secondary/30 border border-primary/10 rounded-xl p-3 sm:p-4 hover:bg-secondary/50 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-base sm:text-lg flex-shrink-0">
                            {entry.rank}
                          </div>
                          <p className="text-base sm:text-lg lg:text-xl font-semibold">{entry.name}</p>
                        </div>
                        <div className="text-left sm:text-right w-full sm:w-auto pl-13 sm:pl-0">
                          <p className="text-base sm:text-lg font-bold text-accent">{entry.score} points</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{entry.accuracy.toFixed(0)}% accuracy</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* If less than 3 participants, show regular list */}
            {leaderboard.length < 3 && (
              <Card className="bg-card/80 backdrop-blur-sm border border-primary/20 p-4 sm:p-6 lg:p-8">
                <div className="space-y-2 sm:space-y-3">
                  {leaderboard.map((entry, idx) => (
                    <div
                      key={idx}
                      className="bg-secondary/30 border border-primary/10 rounded-xl p-3 sm:p-4"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-base sm:text-lg flex-shrink-0 ${
                            entry.rank === 1
                              ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white'
                              : 'bg-primary/20'
                          }`}>
                            {entry.rank}
                          </div>
                          <p className="text-base sm:text-lg lg:text-xl font-semibold">{entry.name}</p>
                        </div>
                        <div className="text-left sm:text-right w-full sm:w-auto pl-13 sm:pl-0">
                          <p className="text-base sm:text-lg font-bold text-accent">{entry.score} points</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{entry.accuracy.toFixed(0)}% accuracy</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        ) : (
          <Card className="bg-card border-2 border-accent/50 p-6 sm:p-8 lg:p-12 text-center">
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground">
              {quizzes.length === 0
                ? "No active quizzes available"
                : "No participants yet"}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { quizApi, leaderboardApi, SOCKET_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, Home, RefreshCw, Wifi, WifiOff, Users } from "lucide-react";
import { io, Socket } from "socket.io-client";

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  accuracy: number;
  correctAnswers?: number;
  totalAnswers?: number;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<{ _id: string; title?: string; code?: string }[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    loadQuizzes();

    // Connect Socket.IO for real-time leaderboard updates
    const socket = io(SOCKET_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('🔌 Leaderboard socket connected');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Real-time leaderboard push from server
    socket.on('leaderboard_update', ({ quizId, leaderboard: newLeaderboard }) => {
      if (quizId === selectedQuizIdRef.current) {
        const mapped = newLeaderboard.map((entry: LeaderboardEntry) => ({
          ...entry,
          rank: entry.rank,
        }));
        setLeaderboard(mapped);
        setLastUpdated(new Date());
        console.log('📡 Real-time leaderboard update received');
      }
    });

    socket.on('participant_joined', ({ name, participantCount }) => {
      console.log(`👥 ${name} joined. Total: ${participantCount}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Keep a ref to selectedQuizId for use inside socket callbacks
  const selectedQuizIdRef = useRef(selectedQuizId);
  useEffect(() => {
    selectedQuizIdRef.current = selectedQuizId;
  }, [selectedQuizId]);

  // When quiz selection changes, leave old room and join new one
  useEffect(() => {
    if (selectedQuizId) {
      loadLeaderboard(selectedQuizId);
      // Join quiz room to receive real-time updates
      socketRef.current?.emit('join_quiz_room', {
        quizId: selectedQuizId,
        participantId: 'admin-viewer',
        name: 'Admin',
      });
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
    setIsRefreshing(true);
    try {
      const data = await leaderboardApi.get(quizId);
      const leaderboardData = data.leaderboard.map((entry: LeaderboardEntry) => ({
        ...entry,
        rank: entry.rank,
      }));
      setLeaderboard(leaderboardData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const medalColors = [
    'from-yellow-300 to-yellow-500',
    'from-gray-300 to-gray-500',
    'from-amber-600 to-amber-800',
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-blob-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-blob-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto pt-6 sm:pt-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-12 gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Award className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-accent" />
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                Leaderboard
              </h1>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Real-time connection indicator */}
            <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
              isConnected
                ? 'bg-green-500/10 border-green-500/30 text-green-500'
                : 'bg-red-500/10 border-red-500/30 text-red-500'
            }`}>
              {isConnected
                ? <><Wifi className="h-3 w-3" /> Live</>
                : <><WifiOff className="h-3 w-3" /> Offline</>
              }
            </div>
            <Button
              onClick={() => selectedQuizId && loadLeaderboard(selectedQuizId)}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="border-primary/30"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="border-accent/50 hover:bg-accent/20"
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </div>
        </div>

        {/* Quiz Selector */}
        {quizzes.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <Select value={selectedQuizId} onValueChange={setSelectedQuizId}>
              <SelectTrigger className="w-full sm:w-72 bg-card border-primary/50">
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
            {/* Podium — top 3 */}
            {leaderboard.length >= 3 && (
              <Card className="bg-card/80 backdrop-blur-sm border border-primary/20 p-6 sm:p-8">
                <div className="relative flex items-end justify-center gap-2 sm:gap-6 h-72 sm:h-80">
                  {/* 2nd Place */}
                  <div className="flex flex-col items-center">
                    <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br ${medalColors[1]} flex items-center justify-center mb-2 sm:mb-3 border-4 border-white/20 shadow-xl`}>
                      <span className="text-2xl sm:text-4xl font-bold text-white">2</span>
                    </div>
                    <p className="text-sm sm:text-lg font-bold mb-1 text-center max-w-[80px] sm:max-w-[120px] truncate">{leaderboard[1].name}</p>
                    <p className="text-xs sm:text-base font-semibold text-accent">{leaderboard[1].score} pts</p>
                    <p className="text-xs text-muted-foreground">{leaderboard[1].accuracy.toFixed(0)}%</p>
                    <div className="w-20 sm:w-28 h-24 sm:h-36 bg-gradient-to-t from-primary/30 to-primary/10 rounded-t-xl mt-3 flex items-center justify-center">
                      <span className="text-4xl sm:text-6xl font-bold text-white/30">2</span>
                    </div>
                  </div>

                  {/* 1st Place */}
                  <div className="flex flex-col items-center -mt-8">
                    <div className="relative">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <div className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br ${medalColors[0]} flex items-center justify-center border-4 border-white/30 shadow-2xl`}>
                        <span className="text-3xl sm:text-5xl font-bold text-white">1</span>
                      </div>
                    </div>
                    <p className="text-base sm:text-xl font-bold mt-3 mb-1 text-center max-w-[100px] sm:max-w-[140px] truncate">{leaderboard[0].name}</p>
                    <p className="text-sm sm:text-lg font-semibold text-accent">{leaderboard[0].score} pts</p>
                    <p className="text-xs text-muted-foreground">{leaderboard[0].accuracy.toFixed(0)}%</p>
                    <div className="w-20 sm:w-28 h-36 sm:h-52 bg-gradient-to-t from-accent/30 to-accent/10 rounded-t-xl mt-3 flex items-center justify-center">
                      <span className="text-5xl sm:text-7xl font-bold text-white/30">1</span>
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div className="flex flex-col items-center">
                    <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br ${medalColors[2]} flex items-center justify-center mb-2 sm:mb-3 border-4 border-white/20 shadow-xl`}>
                      <span className="text-2xl sm:text-4xl font-bold text-white">3</span>
                    </div>
                    <p className="text-sm sm:text-lg font-bold mb-1 text-center max-w-[80px] sm:max-w-[120px] truncate">{leaderboard[2].name}</p>
                    <p className="text-xs sm:text-base font-semibold text-accent">{leaderboard[2].score} pts</p>
                    <p className="text-xs text-muted-foreground">{leaderboard[2].accuracy.toFixed(0)}%</p>
                    <div className="w-20 sm:w-28 h-20 sm:h-28 bg-gradient-to-t from-primary/20 to-primary/5 rounded-t-xl mt-3 flex items-center justify-center">
                      <span className="text-3xl sm:text-5xl font-bold text-white/30">3</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Full Rankings Table */}
            <Card className="bg-card/80 backdrop-blur-sm border border-primary/20 p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-primary">All Participants ({leaderboard.length})</h2>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`border rounded-xl p-3 sm:p-4 transition-all ${
                      entry.rank <= 3
                        ? 'bg-gradient-to-r from-primary/10 to-accent/5 border-primary/30'
                        : 'bg-secondary/30 border-primary/10 hover:bg-secondary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-base sm:text-lg flex-shrink-0 ${
                          entry.rank === 1 ? `bg-gradient-to-br ${medalColors[0]} text-white` :
                          entry.rank === 2 ? `bg-gradient-to-br ${medalColors[1]} text-white` :
                          entry.rank === 3 ? `bg-gradient-to-br ${medalColors[2]} text-white` :
                          'bg-primary/20 text-primary'
                        }`}>
                          {entry.rank}
                        </div>
                        <div className="min-w-0">
                          <p className="text-base sm:text-lg lg:text-xl font-semibold truncate">{entry.name}</p>
                          {entry.correctAnswers !== undefined && (
                            <p className="text-xs text-muted-foreground">{entry.correctAnswers}/{entry.totalAnswers} correct</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base sm:text-lg font-bold text-accent">{entry.score} pts</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{entry.accuracy.toFixed(0)}% acc</p>
                      </div>
                    </div>
                    {/* Score bar */}
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                        style={{ width: `${Math.min(100, entry.accuracy)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <Card className="bg-card border-2 border-accent/50 p-6 sm:p-8 lg:p-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground">
              {quizzes.length === 0 ? "No quizzes available yet" : "No participants yet — waiting for players..."}
            </p>
            {isConnected && <p className="text-xs text-green-500 mt-2">🟢 Live updates active</p>}
          </Card>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;

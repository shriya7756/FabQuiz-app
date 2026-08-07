import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Clock, Zap, Wifi, WifiOff } from "lucide-react";
import { quizApi, responseApi, getImageUrl, SOCKET_BASE_URL } from "@/lib/api";
import { io, Socket } from "socket.io-client";

interface Question {
  _id: string;
  id?: string;
  question_text: string;
  image_url?: string;
  marks: number;
  time_limit: number;
  options: Array<{
    _id: string;
    id?: string;
    option_text: string;
    is_correct: boolean;
  }>;
}

const ParticipantQuiz = () => {
  const { quizId, participantId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Record<string, unknown> | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    loadQuiz();

    // Connect Socket.IO
    const socket = io(SOCKET_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('🔌 Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔌 Socket disconnected');
    });

    socket.on('quiz_completed', ({ quizId: completedQuizId }) => {
      if (completedQuizId === quizId) {
        toast.info("Quiz has ended by the host.", { duration: 4000 });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [quizId]);

  // Timer effect
  useEffect(() => {
    if (!isWaiting && !isSubmitting && timeLeft > 0 && questions[currentQuestionIndex]) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isWaiting, isSubmitting, timeLeft, currentQuestionIndex]);

  const loadQuiz = async () => {
    try {
      const { quiz: quizData } = await quizApi.getById(quizId!);
      setQuiz(quizData);
      setQuestions(quizData.questions || []);
      setTimeLeft(quizData.questions?.[0]?.time_limit || 30);
      setIsWaiting(false);

      // Join the socket room after loading quiz
      if (socketRef.current?.connected) {
        joinRoom(quizId!);
      } else if (socketRef.current) {
        socketRef.current.once('connect', () => joinRoom(quizId!));
      }
    } catch (error) {
      console.error('Failed to load quiz:', error);
      toast.error("Failed to load quiz. Please try again.", { duration: 5000 });
      setTimeout(() => navigate('/'), 2000);
    }
  };

  const joinRoom = (qid: string) => {
    socketRef.current?.emit('join_quiz_room', {
      quizId: qid,
      participantId,
      name: 'Participant',
    });
    console.log(`📡 Joined quiz room: quiz:${qid}`);
  };

  const handleTimeout = async () => {
    await submitAnswer(null);
  };

  const submitAnswer = async (optionId: string | null) => {
    if (!questions[currentQuestionIndex] || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const currentQuestion = questions[currentQuestionIndex];
      const response = await responseApi.submit(participantId!, currentQuestion._id, optionId || '');

      // Emit socket event for real-time leaderboard update
      socketRef.current?.emit('answer_submitted', {
        quizId,
        participantId,
        questionId: currentQuestion._id,
        optionId,
        isCorrect: response.response?.isCorrect,
      });

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOption(null);
        setTimeLeft(questions[currentQuestionIndex + 1].time_limit);
        setIsSubmitting(false);
      } else {
        toast.success("🎆 Quiz completed! Loading your results...", { duration: 3000 });
        // Emit quiz complete event
        socketRef.current?.emit('quiz_complete', { quizId });
        setTimeout(() => {
          navigate(`/results/${quizId}/${participantId}`);
        }, 1000);
      }
    } catch (error: unknown) {
      console.error("Error submitting answer:", error);
      toast.error("Failed to submit answer. Please try again.", { duration: 5000 });
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (selectedOption && !isSubmitting) {
      submitAnswer(selectedOption);
    }
  };

  if (isWaiting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
        <Card className="bg-card border border-border p-6 sm:p-12 text-center shadow-lg max-w-md mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-primary border-t-transparent mx-auto mb-4 sm:mb-6" />
          <h2 className="text-xl sm:text-2xl font-bold text-primary mb-3 sm:mb-4">Waiting for quiz to start...</h2>
          <p className="text-sm sm:text-base text-muted-foreground">The host will begin shortly</p>
        </Card>
      </div>
    );
  }

  if (!questions[currentQuestionIndex]) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="max-w-4xl mx-auto pt-6 sm:pt-12 relative z-10">
        {/* Header row: connection indicator + timer */}
        <div className="flex justify-between items-center mb-4 sm:mb-8 animate-fade-in-up">
          {/* WebSocket connection status */}
          <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
            isConnected
              ? 'bg-green-500/10 border-green-500/30 text-green-500'
              : 'bg-red-500/10 border-red-500/30 text-red-500'
          }`}>
            {isConnected
              ? <><Wifi className="h-3 w-3" /> Live</>
              : <><WifiOff className="h-3 w-3" /> Reconnecting</>
            }
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-2 sm:gap-3 bg-card border-2 ${
            timeLeft <= 10 ? 'border-destructive animate-pulse-slow' : 'border-primary'
          } rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-lg hover-lift transition-all duration-300`}>
            <Clock className={`h-5 w-5 sm:h-6 sm:w-6 ${timeLeft <= 10 ? 'text-destructive' : 'text-primary'}`}
              style={{ animation: timeLeft <= 10 ? 'pulse 0.5s ease-in-out infinite' : 'none' }} />
            <span className={`text-xl sm:text-2xl font-bold ${timeLeft <= 10 ? 'text-destructive' : 'text-primary'}`}>
              {timeLeft}s
            </span>
            {timeLeft <= 10 && <Zap className="h-4 w-4 text-destructive animate-pulse" />}
          </div>
        </div>

        {/* Question Progress */}
        <div className="text-center mb-4 sm:mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-3 bg-secondary/50 backdrop-blur-sm px-6 py-2 rounded-full">
            <span className="text-muted-foreground text-base sm:text-lg font-medium">
              Question <span className="text-primary font-bold">{currentQuestionIndex + 1}</span> of {questions.length}
            </span>
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Card */}
        <Card className="bg-card/95 backdrop-blur-sm border-2 border-border p-6 sm:p-12 mb-6 sm:mb-8 shadow-2xl hover-lift animate-scale-in">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8 text-primary break-words leading-relaxed">
            {currentQuestion.question_text}
          </h2>

          {/* Question Image */}
          {currentQuestion.image_url && (() => {
            let imageUrl = getImageUrl(currentQuestion.image_url);
            if (!imageUrl && currentQuestion.image_url.startsWith('/')) {
              imageUrl = `http://localhost:3001${currentQuestion.image_url}`;
            }
            if (!imageUrl) imageUrl = currentQuestion.image_url;
            return (
              <div className="mb-6 sm:mb-8 flex justify-center">
                <img
                  src={imageUrl}
                  alt="Question"
                  className="max-w-full h-auto max-h-96 rounded-lg border-2 border-border shadow-lg"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    const fallback = `http://localhost:3001${currentQuestion.image_url}`;
                    if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                  }}
                />
              </div>
            );
          })()}

          {/* Marks badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
              {currentQuestion.marks} {currentQuestion.marks === 1 ? 'mark' : 'marks'}
            </span>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {currentQuestion.options.map((option, idx) => (
              <Button
                key={option._id || option.id}
                onClick={() => !isSubmitting && setSelectedOption(option._id || option.id!)}
                variant={selectedOption === (option._id || option.id) ? "default" : "outline"}
                className={`w-full text-left justify-start text-sm sm:text-base lg:text-lg py-4 sm:py-6 lg:py-8 break-words whitespace-normal transition-all duration-300 hover-scale animate-slide-in-right stagger-${idx + 1} ${
                  selectedOption === (option._id || option.id)
                    ? 'bg-gradient-to-r from-primary to-accent shadow-lg scale-105 border-2 border-primary'
                    : 'hover:border-primary/50 hover:bg-primary/5'
                } ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={isSubmitting}
              >
                <span className={`mr-3 sm:mr-4 font-bold flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${
                  selectedOption === (option._id || option.id) ? 'bg-white text-primary' : 'bg-primary/10 text-primary'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="break-words">{option.option_text}</span>
              </Button>
            ))}
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center animate-fade-in-up">
          <Button
            onClick={handleSubmit}
            disabled={!selectedOption || isSubmitting}
            className={`bg-gradient-to-r from-primary to-accent text-base sm:text-lg lg:text-xl px-8 sm:px-12 lg:px-16 py-4 sm:py-6 lg:py-8 w-full sm:w-auto shadow-xl transition-all duration-300 ${
              selectedOption && !isSubmitting
                ? 'hover-scale hover-glow cursor-pointer'
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Submitting...
              </span>
            ) : currentQuestionIndex < questions.length - 1 ? (
              <span className="flex items-center gap-2">
                Next Question
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Finish Quiz
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantQuiz;

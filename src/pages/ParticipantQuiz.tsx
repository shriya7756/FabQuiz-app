import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Clock, Zap } from "lucide-react";
import { quizApi, responseApi, getImageUrl } from "@/lib/api";

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
  const location = useLocation();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    loadQuiz();
    subscribeToQuizStatus();
  }, [quizId]);

  useEffect(() => {
    if (!isWaiting && timeLeft > 0) {
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
  }, [isWaiting, timeLeft, currentQuestionIndex]);

  const loadQuiz = async () => {
    try {
      // Fetch quiz from MongoDB using quiz ID
      const { quiz: quizData } = await quizApi.getById(quizId!);
      
      console.log('📥 Quiz data loaded:', quizData);
      console.log('📊 Total questions:', quizData.questions?.length);
      console.log('🖼️ Questions with images:', quizData.questions?.map((q: any) => ({
        text: q.question_text?.substring(0, 50) + '...',
        hasImage: !!q.image_url,
        imageUrl: q.image_url,
        fullUrl: q.image_url ? `http://localhost:3001${q.image_url}` : 'No image'
      })));
      
      setQuiz(quizData);
      setQuestions(quizData.questions || []);
      setTimeLeft(quizData.questions?.[0]?.time_limit || 30);
      setIsWaiting(false);
    } catch (error) {
      console.error('❌ Failed to load quiz:', error);
      toast.error("Failed to load quiz. Please try again.", { duration: 5000 });
      setTimeout(() => navigate('/'), 2000);
    }
  };


  const subscribeToQuizStatus = () => {
    // MongoDB quizzes are always active - no polling needed
  };

  const handleTimeout = async () => {
    await submitAnswer(null);
  };

  const submitAnswer = async (optionId: string | null) => {
    if (!questions[currentQuestionIndex]) return;

    try {
      const currentQuestion = questions[currentQuestionIndex];

      // Submit answer to MongoDB
      await responseApi.submit(participantId!, currentQuestion._id, optionId || '');

      // Move to next question or finish
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOption(null);
        setTimeLeft(questions[currentQuestionIndex + 1].time_limit);
      } else {
        // Quiz complete - go to results
        toast.success("🎆 Quiz completed!", { duration: 4000 });
        setTimeout(() => {
          navigate(`/results/${quizId}/${participantId}`);
        }, 500);
      }
    } catch (error: any) {
      console.error("Error submitting answer:", error);
      toast.error("Failed to submit answer. Please try again.", { duration: 5000 });
    }
  };

  const handleSubmit = () => {
    submitAnswer(selectedOption);
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
  
  // Debug: Log current question image info
  if (currentQuestion.image_url) {
    console.log('Current question has image:', {
      questionText: currentQuestion.question_text,
      imageUrl: currentQuestion.image_url,
      fullImageUrl: getImageUrl(currentQuestion.image_url)
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="max-w-4xl mx-auto pt-6 sm:pt-12 relative z-10">
        {/* Timer */}
        <div className="flex justify-end mb-4 sm:mb-8 animate-fade-in-up">
          <div className={`flex items-center gap-2 sm:gap-3 bg-card border-2 ${
            timeLeft <= 10 
              ? 'border-destructive animate-pulse-slow' 
              : 'border-primary'
          } rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-lg hover-lift transition-all duration-300`}>
            <Clock className={`h-5 w-5 sm:h-6 sm:w-6 ${
              timeLeft <= 10 ? 'text-destructive' : 'text-primary'
            } animate-spin-slow`} style={{ animation: timeLeft <= 10 ? 'pulse 0.5s ease-in-out infinite' : 'none' }} />
            <span className={`text-xl sm:text-2xl font-bold ${
              timeLeft <= 10 ? 'text-destructive' : 'text-primary'
            }`}>
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
            {/* Progress bar */}
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
            // Build image URL with multiple fallbacks
            let imageUrl = getImageUrl(currentQuestion.image_url);
            
            // Fallback 1: Direct construction
            if (!imageUrl && currentQuestion.image_url.startsWith('/')) {
              imageUrl = `http://localhost:3001${currentQuestion.image_url}`;
            }
            
            // Fallback 2: Use as-is
            if (!imageUrl) {
              imageUrl = currentQuestion.image_url;
            }
            
            console.log('🖼️ Displaying image:', {
              original: currentQuestion.image_url,
              computed: imageUrl,
              question: currentQuestion.question_text.substring(0, 50)
            });
            
            return (
              <div className="mb-6 sm:mb-8 flex justify-center">
                <img 
                  src={imageUrl} 
                  alt="Question" 
                  className="max-w-full h-auto max-h-96 rounded-lg border-2 border-border shadow-lg"
                  crossOrigin="anonymous"
                  onLoad={() => {
                    console.log('✅ Image loaded successfully!', imageUrl);
                  }}
                  onError={(e) => {
                    console.error('❌ Failed to load image!');
                    console.error('Original URL:', currentQuestion.image_url);
                    console.error('Attempted URL:', imageUrl);
                    console.error('Server should be: http://localhost:3001');
                    // Try alternative URL as last resort
                    const fallbackUrl = `http://localhost:3001${currentQuestion.image_url}`;
                    if (e.currentTarget.src !== fallbackUrl) {
                      console.log('🔄 Trying fallback URL:', fallbackUrl);
                      e.currentTarget.src = fallbackUrl;
                    }
                  }}
                />
              </div>
            );
          })()}

          <div className="space-y-3 sm:space-y-4">
            {currentQuestion.options.map((option, idx) => (
              <Button
                key={option._id || option.id}
                onClick={() => setSelectedOption(option._id || option.id)}
                variant={selectedOption === (option._id || option.id) ? "default" : "outline"}
                className={`w-full text-left justify-start text-sm sm:text-base lg:text-lg py-4 sm:py-6 lg:py-8 break-words whitespace-normal transition-all duration-300 hover-scale animate-slide-in-right stagger-${idx + 1} ${
                  selectedOption === (option._id || option.id)
                    ? 'bg-gradient-to-r from-primary to-accent shadow-lg scale-105 border-2 border-primary'
                    : 'hover:border-primary/50 hover:bg-primary/5'
                }`}
              >
                <span className={`mr-3 sm:mr-4 font-bold flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${
                  selectedOption === (option._id || option.id)
                    ? 'bg-white text-primary'
                    : 'bg-primary/10 text-primary'
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
            disabled={!selectedOption}
            className={`bg-gradient-to-r from-primary to-accent text-base sm:text-lg lg:text-xl px-8 sm:px-12 lg:px-16 py-4 sm:py-6 lg:py-8 w-full sm:w-auto shadow-xl transition-all duration-300 ${
              selectedOption 
                ? 'hover-scale hover-glow cursor-pointer' 
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            {currentQuestionIndex < questions.length - 1 ? (
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

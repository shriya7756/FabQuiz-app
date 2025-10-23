import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resultsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Award, Target, Home, Check, X } from "lucide-react";
import { toast } from "sonner";

interface QuestionReview {
  questionText: string;
  selectedOption: string | null;
  correctOption: string;
  isCorrect: boolean;
}

const Results = () => {
  const { quizId, participantId } = useParams();
  const navigate = useNavigate();
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [participantName, setParticipantName] = useState("");
  const [questionReviews, setQuestionReviews] = useState<QuestionReview[]>([]);

  useEffect(() => {
    loadResults();
  }, [quizId, participantId]);

  const loadResults = async () => {
    try {
      const data = await resultsApi.get(quizId!, participantId!);
      
      setParticipantName(data.participant.name);
      setScore(data.score);
      setTotalQuestions(data.totalQuestions);
      setAccuracy(data.accuracy);
      
      const reviews = data.responses.map((r: any) => {
        const selectedOption = r.options.find((opt: any) => opt._id === r.selectedOptionId);
        const correctOption = r.options.find((opt: any) => opt.isCorrect);
        
        return {
          questionText: r.questionText,
          selectedOption: selectedOption?.optionText || "Not answered",
          correctOption: correctOption?.optionText || "",
          isCorrect: r.isCorrect,
        };
      });
      
      setQuestionReviews(reviews);
    } catch (error) {
      console.error('Failed to load results:', error);
      toast.error('Failed to load results. Please try again.', { duration: 5000 });
    }
  };



  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6">
      <div className="max-w-6xl mx-auto pt-6 sm:pt-12">
        {/* Results Header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Quiz Complete!
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground">{participantName}</p>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16">
          <Card className="bg-card border border-border p-6 sm:p-8 lg:p-12 text-center shadow-lg">
            <Trophy className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 text-primary mx-auto mb-4 sm:mb-6" />
            <h3 className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-2">Score</h3>
            <p className="text-3xl sm:text-4xl lg:text-6xl font-bold text-primary">
              {score} marks
            </p>
          </Card>

          <Card className="bg-card border border-border p-6 sm:p-8 lg:p-12 text-center shadow-lg">
            <Target className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 text-primary mx-auto mb-4 sm:mb-6" />
            <h3 className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-2">Accuracy</h3>
            <p className="text-3xl sm:text-4xl lg:text-6xl font-bold text-primary">
              {accuracy.toFixed(0)}%
            </p>
          </Card>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 sm:mb-12">
          <Button
            onClick={() => navigate(`/leaderboard`)}
            className="bg-gradient-to-r from-primary to-accent hover:scale-105 transition-transform px-8 py-6 text-lg"
          >
            <Award className="mr-2 h-5 w-5" />
            View Leaderboard
          </Button>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="hover:scale-105 transition-transform px-8 py-6 text-lg border-2"
          >
            <Home className="mr-2 h-5 w-5" />
            Go Home
          </Button>
        </div>

        {/* Question Review Section */}
        {questionReviews.length > 0 && (
          <Card className="bg-card border border-border p-6 sm:p-8 lg:p-12 shadow-lg mt-8 sm:mt-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-6 sm:mb-8">Review Answers</h2>
            <div className="space-y-4 sm:space-y-6">
              {questionReviews.map((review, idx) => (
                <div
                  key={idx}
                  className={`border rounded-xl p-4 sm:p-6 ${
                    review.isCorrect
                      ? 'bg-success/10 border-success/30'
                      : 'bg-destructive/10 border-destructive/30'
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      review.isCorrect ? 'bg-success' : 'bg-destructive'
                    }`}>
                      {review.isCorrect ? (
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      ) : (
                        <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4">
                        Question {idx + 1}: {review.questionText}
                      </h3>
                      <div className="space-y-2">
                        <p className="text-sm sm:text-base text-muted-foreground">
                          <span className="font-semibold">Your answer:</span>{" "}
                          <span className={review.isCorrect ? 'text-success' : 'text-destructive'}>
                            {review.selectedOption}
                          </span>
                        </p>
                        {!review.isCorrect && (
                          <p className="text-sm sm:text-base text-muted-foreground">
                            <span className="font-semibold">Correct answer:</span>{" "}
                            <span className="text-success">{review.correctOption}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

      </div>
    </div>
  );
};

export default Results;

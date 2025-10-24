import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

const Feedback = () => {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [allFeedback, setAllFeedback] = useState([]);


  useEffect(() => {
    // Load feedback from localStorage
    const storedFeedback = localStorage.getItem("fabquiz-feedback");
    if (storedFeedback) {
      try {
        const parsedFeedback = JSON.parse(storedFeedback);
        setAllFeedback(parsedFeedback);
      } catch (error) {
        console.error("Error parsing stored feedback:", error);
      }
    }
  }, []);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error("Please enter your feedback", { duration: 5000 });
      return;
    }

    setLoading(true);

    try {
      // Try API first, fallback to localStorage
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: feedback.trim(),
        }),
      });

      if (response.ok) {
        // Reload feedback from API
        const getResponse = await fetch('/api/feedback');
        if (getResponse.ok) {
          const { feedback: updatedFeedback } = await getResponse.json();
          setAllFeedback(updatedFeedback);
        }
      } else {
        // Fallback to localStorage
        const newFeedback = {
          id: Date.now().toString(),
          content: feedback.trim(),
          created_at: new Date().toISOString(),
        };

        const updatedFeedback = [newFeedback, ...allFeedback];
        setAllFeedback(updatedFeedback);
        localStorage.setItem("fabquiz-feedback", JSON.stringify(updatedFeedback));
      }

      toast.success("Thank you for your feedback!", { duration: 5000 });
      setFeedback("");
    } catch (error) {
      // Fallback to localStorage
      const newFeedback = {
        id: Date.now().toString(),
        content: feedback.trim(),
        created_at: new Date().toISOString(),
      };

      const updatedFeedback = [newFeedback, ...allFeedback];
      setAllFeedback(updatedFeedback);
      localStorage.setItem("fabquiz-feedback", JSON.stringify(updatedFeedback));

      toast.success("Thank you for your feedback!", { duration: 5000 });
      setFeedback("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6">
      <div className="max-w-4xl mx-auto pt-6 sm:pt-12">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="bg-card border border-border p-6 sm:p-8 shadow-lg">
            <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Share Your Feedback
            </h1>
            <p className="text-center text-muted-foreground mb-8">
              Help us improve FabQuiz by sharing your thoughts and suggestions
            </p>

            <div className="space-y-6">
              <div>
                <label htmlFor="feedback" className="block text-sm font-medium mb-2">
                  Your Feedback
                </label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us what you think about FabQuiz... What do you like? What can we improve?"
                  className="min-h-[150px] resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {feedback.length}/1000 characters
                </p>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !feedback.trim()}
                  className="bg-gradient-to-r from-primary to-accent text-white px-8 py-3"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="mt-8 p-4 bg-primary/5 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                Your feedback is anonymous and helps us make FabQuiz better for everyone.
              </p>
            </div>
          </Card>

          {/* View All Feedback Section */}
          <div className="mt-8">
            <Card className="bg-card border border-border p-6 shadow-lg">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">All Feedback</h2>
              </div>

              <div className="space-y-4">
                {allFeedback.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No feedback submitted yet. Be the first to share your thoughts!
                  </p>
                ) : (
                  allFeedback.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="bg-muted/50 rounded-lg p-4 border border-border/50"
                    >
                      <p className="text-foreground leading-relaxed">{item.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(item.created_at).toLocaleDateString()} at{" "}
                        {new Date(item.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;

import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthModal } from "@/components/AuthModal";
import bgQuiz from "@/assets/bg-quiz.png";

const Index = () => {
  const navigate = useNavigate();
  const [quizCode, setQuizCode] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleJoinQuiz = () => {
    if (quizCode.trim()) {
      navigate(`/join/${quizCode}`);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgQuiz})` }}
      />

      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 md:pb-20">
          {/* Hero Section */}
          <section className="min-h-[70vh] sm:min-h-[80vh] md:min-h-[85vh] flex items-center justify-center mb-12 sm:mb-16 md:mb-20">
            <div className="max-w-4xl w-full">
              {/* Main Glassmorphism Card */}
              <div className="bg-card/30 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-primary/20 p-6 sm:p-8 md:p-10 lg:p-12 shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:border-primary/40 animate-fade-in">
                <div className="text-center space-y-4 sm:space-y-6 md:space-y-8">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight animate-scale-in bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    FabQuiz
                  </h1>
                  
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-foreground/90 font-medium animate-fade-in px-2">
                    Create engaging live quizzes in seconds
                  </p>
                  
                  <p className="text-sm sm:text-base md:text-lg text-foreground/80 max-w-2xl mx-auto animate-fade-in leading-relaxed px-4">
                    Real-time quizzes with leaderboards, timers, and instant scoring. No login required for participants.
                  </p>

                  {/* Join Quiz Section */}
                  <div className="pt-4 sm:pt-6 md:pt-8 space-y-3 sm:space-y-4 md:space-y-5">
                    <p className="text-xs sm:text-sm text-foreground/70 font-semibold uppercase tracking-wider">Enter quiz code</p>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-md mx-auto px-4 sm:px-0">
                      <Input
                        type="text"
                        placeholder="Enter code"
                        value={quizCode}
                        onChange={(e) => setQuizCode(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleJoinQuiz()}
                        className="bg-card/50 backdrop-blur-sm border-primary/30 text-foreground text-base sm:text-lg h-12 sm:h-14 hover:border-primary/50 transition-all focus:border-primary w-full"
                      />
                      <Button 
                        onClick={handleJoinQuiz}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 sm:h-14 px-6 sm:px-8 hover:scale-105 transition-transform w-full sm:w-auto min-w-[100px]"
                      >
                        Join
                      </Button>
                    </div>
                  </div>

                  {/* Create Quiz Button */}
                  <div className="pt-4 sm:pt-6 px-4 sm:px-0">
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 sm:px-10 md:px-12 py-5 sm:py-6 md:py-7 text-base sm:text-lg md:text-xl rounded-full animate-scale-in hover:scale-110 transition-transform shadow-lg hover:shadow-primary/30 w-full sm:w-auto"
                      onClick={() => setIsAuthModalOpen(true)}
                    >
                      Create Quiz
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="max-w-6xl mx-auto mb-12 sm:mb-16 md:mb-20 px-4 sm:px-0">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-primary mb-8 sm:mb-10 md:mb-12 animate-fade-in">
              How It Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {[
                {
                  step: "1",
                  title: "Admin Creates Quiz",
                  description: "Sign up/login to create custom quizzes with questions, timers, and scoring"
                },
                {
                  step: "2",
                  title: "Share Code or QR",
                  description: "Get a unique quiz code and QR code to share with participants instantly"
                },
                {
                  step: "3",
                  title: "Play & Compete",
                  description: "Participants join without signup, answer questions, and compete on the leaderboard"
                }
              ].map((item, i) => (
                <div 
                  key={i}
                  className="bg-card/30 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-primary/20 p-6 sm:p-7 md:p-8 hover:border-primary/50 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl animate-fade-in group"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-5 md:mb-6 group-hover:scale-110 transition-transform">
                    {item.step}
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-2 sm:mb-3 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Rules Section */}
          <section className="max-w-5xl mx-auto px-4 sm:px-0">
            <div className="bg-card/30 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-primary/20 p-6 sm:p-8 md:p-10 shadow-xl hover:border-primary/40 transition-all duration-300 animate-fade-in">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-foreground mb-6 sm:mb-7 md:mb-8">
                Platform Rules
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                {[
                  {
                    icon: "✓",
                    title: "Admin Access",
                    text: "Only logged-in users can create and manage quizzes"
                  },
                  {
                    icon: "✓",
                    title: "Participant Freedom",
                    text: "No signup required for participants to join quizzes"
                  },
                  {
                    icon: "✓",
                    title: "Real-Time Scoring",
                    text: "Instant score calculation and leaderboard updates"
                  },
                  {
                    icon: "✓",
                    title: "Review Answers",
                    text: "View correct answers and your performance after completing"
                  },
                  {
                    icon: "✓",
                    title: "Timed Questions",
                    text: "Each question has a timer for competitive play"
                  },
                  {
                    icon: "✓",
                    title: "Fair Play",
                    text: "One attempt per participant with accuracy tracking"
                  }
                ].map((rule, i) => (
                  <div 
                    key={i}
                    className="flex gap-3 sm:gap-4 items-start p-3 sm:p-4 rounded-xl hover:bg-primary/5 transition-colors group"
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-lg sm:text-xl font-bold flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                      {rule.icon}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {rule.title}
                      </h3>
                      <p className="text-foreground/80 text-xs sm:text-sm leading-relaxed">
                        {rule.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>

      <AuthModal
        open={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        onSuccess={() => navigate("/admin/dashboard")}
      />
    </div>
  );
};

export default Index;

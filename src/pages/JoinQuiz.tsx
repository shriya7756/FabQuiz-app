import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { quizApi, participantApi } from "@/lib/api";

const JoinQuiz = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    college: "",
    branch: "",
    year: "",
  });
  const [loading, setLoading] = useState(false);
  const [quizExists, setQuizExists] = useState(false);

  useEffect(() => {
    checkQuizExists();
  }, [code]);

  const checkQuizExists = async () => {
    if (!code) return;

    try {
      await quizApi.getByCode(code.toUpperCase());
      setQuizExists(true);
    } catch (error) {
      toast.error("Quiz not found. Please check the code.", { duration: 5000 });
      setTimeout(() => navigate("/"), 2000);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Name is required", { duration: 4000 });
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required", { duration: 4000 });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email", { duration: 5000 });
      return;
    }

    if (!formData.phoneNumber.trim() || formData.phoneNumber.length < 10) {
      toast.error("Please enter a valid 10-digit phone number", { duration: 5000 });
      return;
    }

    if (!formData.college.trim()) {
      toast.error("College name is required", { duration: 4000 });
      return;
    }

    if (!formData.branch.trim()) {
      toast.error("Branch is required", { duration: 4000 });
      return;
    }

    if (!formData.year) {
      toast.error("Year is required", { duration: 4000 });
      return;
    }

    setLoading(true);

    try {
      // Get quiz details
      const { quiz } = await quizApi.getByCode(code!.toUpperCase());

      // Join quiz via API with all details
      const { participant } = await participantApi.join(
        code!.toUpperCase(), 
        formData.name.trim(),
        formData.email.trim(),
        formData.phoneNumber.trim(),
        formData.college.trim(),
        formData.branch.trim(),
        formData.year
      );

      toast.success("🎮 Joined successfully! Good luck!", { duration: 4000 });

      // Navigate to quiz screen
      navigate(`/quiz/${quiz._id}/participant/${participant._id}`, {
        state: { participantName: formData.name.trim() },
      });
    } catch (error: any) {
      console.error("Error joining quiz:", error);
      
      // Handle duplicate participant
      if (error.message.includes('already joined')) {
        toast.error("⚠️ You have already joined this quiz! Each person can only participate once.", { duration: 6000 });
      } else {
        toast.error(error.message || "Failed to join quiz. Please try again.", { duration: 5000 });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!quizExists) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Checking quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-card border-2 border-border rounded-2xl p-6 sm:p-8 shadow-2xl animate-scale-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Join Quiz
          </h1>
          <p className="text-center text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">
            Code: <span className="text-primary font-bold text-lg sm:text-xl">{code}</span>
          </p>

          <form onSubmit={handleJoin} className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-sm sm:text-base font-medium">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
                className="mt-2 h-10 sm:h-12"
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm sm:text-base font-medium">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@example.com"
                className="mt-2 h-10 sm:h-12"
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <Label htmlFor="phone" className="text-sm sm:text-base font-medium">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, '') })}
                placeholder="1234567890"
                maxLength={10}
                className="mt-2 h-10 sm:h-12"
                required
              />
            </div>

            {/* College */}
            <div>
              <Label htmlFor="college" className="text-sm sm:text-base font-medium">College/Institution *</Label>
              <Input
                id="college"
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                placeholder="Enter your college name"
                className="mt-2 h-10 sm:h-12"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Branch */}
              <div>
                <Label htmlFor="branch" className="text-sm sm:text-base font-medium">Branch *</Label>
                <Input
                  id="branch"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="e.g., CSE, ECE"
                  className="mt-2 h-10 sm:h-12"
                  required
                />
              </div>

              {/* Year */}
              <div>
                <Label htmlFor="year" className="text-sm sm:text-base font-medium">Year *</Label>
                <select
                  id="year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="mt-2 h-10 sm:h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base sm:text-lg bg-gradient-to-r from-primary to-accent hover-scale shadow-lg"
              >
                {loading ? "Joining..." : "Join Quiz"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              ⚠️ Note: Each person can only participate once per quiz
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinQuiz;

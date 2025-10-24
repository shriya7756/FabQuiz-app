import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, X, Check, QrCode, Copy, Home, LogOut, Sparkles, Upload, Trash2 } from "lucide-react";
import QRCodeLib from "qrcode";
import { quizApi, imageApi, getImageUrl } from "@/lib/api";

interface Question {
  question_text: string;
  marks: number;
  time_limit: number;
  image_url?: string;
  options: { text: string; is_correct: boolean }[];
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    question_text: "",
    marks: 1,
    time_limit: 30,
    image_url: undefined,
    options: [{ text: "", is_correct: false }],
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [quizCode, setQuizCode] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage for authentication
    const authData = localStorage.getItem('fabquiz_auth');
    if (authData) {
      const { authenticated, timestamp, email } = JSON.parse(authData);
      // Check if authentication is still valid (24 hours)
      if (authenticated && Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        setUser({ id: 'demo-user', email });
        return;
      } else {
        localStorage.removeItem('fabquiz_auth');
        navigate("/");
      }
    } else {
      navigate("/");
    }
  }, [navigate]);

  const addOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, { text: "", is_correct: false }],
    });
  };

  const removeOption = (index: number) => {
    setCurrentQuestion({
      ...currentQuestion,
      options: currentQuestion.options.filter((_, i) => i !== index),
    });
  };

  const toggleCorrect = (index: number) => {
    setCurrentQuestion({
      ...currentQuestion,
      options: currentQuestion.options.map((opt, i) => ({
        ...opt,
        is_correct: i === index,
      })),
    });
  };

  const updateOption = (index: number, text: string) => {
    setCurrentQuestion({
      ...currentQuestion,
      options: currentQuestion.options.map((opt, i) =>
        i === index ? { ...opt, text } : opt
      ),
    });
  };

  const addQuestion = () => {
    // Basic validation
    if (!currentQuestion.question_text.trim()) {
      toast.error("Question text is required", { duration: 5000 });
      return;
    }

    if (currentQuestion.marks < 1) {
      toast.error("Marks must be at least 1", { duration: 5000 });
      return;
    }

    if (currentQuestion.time_limit < 10) {
      toast.error("Time limit must be at least 10 seconds", { duration: 5000 });
      return;
    }

    // Validate options
    const validOptions = currentQuestion.options.filter(o => o.text.trim());
    if (validOptions.length < 2) {
      toast.error("At least 2 options required", { duration: 5000 });
      return;
    }

    if (!validOptions.some(o => o.is_correct)) {
      toast.error("Mark at least one correct answer", { duration: 5000 });
      return;
    }

    // Create validated question
    const validatedQuestion: Question = {
      question_text: currentQuestion.question_text.trim(),
      marks: currentQuestion.marks,
      time_limit: currentQuestion.time_limit,
      image_url: currentQuestion.image_url, // Include the uploaded image URL
      options: validOptions,
    };

    setQuestions([...questions, validatedQuestion]);
    setCurrentQuestion({
      question_text: "",
      marks: 1,
      time_limit: 30,
      image_url: undefined,
      options: [{ text: "", is_correct: false }],
    });
    toast.success("✅ Question added successfully!", { duration: 4000 });
  };

  const generateQuizCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB", { duration: 5000 });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file", { duration: 5000 });
      return;
    }

    setUploadingImage(true);
    try {
      const { imageUrl } = await imageApi.upload(file);
      setCurrentQuestion({ ...currentQuestion, image_url: imageUrl });
      toast.success("✅ Image uploaded successfully!", { duration: 4000 });
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error(error.message || "Failed to upload image", { duration: 5000 });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setCurrentQuestion({ ...currentQuestion, image_url: undefined });
    toast.success("Image removed", { duration: 4000 });
  };

  const handleDone = async () => {
    if (questions.length === 0) {
      toast.error("Add at least one question", { duration: 5000 });
      return;
    }

    const loadingToast = toast.loading("Creating your quiz...");
    
    try {

      // Format questions for MongoDB
      const formattedQuestions = questions.map((q) => ({
        question_text: q.question_text,
        marks: q.marks,
        time_limit: q.time_limit,
        image_url: q.image_url || null,
        options: q.options.map((opt) => ({
          option_text: opt.text,
          is_correct: opt.is_correct,
        })),
      }));

      // Create quiz in MongoDB
      const authData = localStorage.getItem('fabquiz_auth');
      const adminEmail = authData ? JSON.parse(authData).email : 'admin@fabquiz.com';
      
      const response = await quizApi.create(
        `Quiz by ${adminEmail.split('@')[0]}`,
        formattedQuestions,
        adminEmail
      );

      const { quiz } = response;
      
      if (!quiz || !quiz.code) {
        throw new Error('Invalid response from server');
      }

      // Generate shareable join URL
      const publicOrigin = import.meta.env?.VITE_PUBLIC_ORIGIN;
      const baseOrigin = publicOrigin && typeof publicOrigin === 'string' && publicOrigin.trim().length > 0 
        ? publicOrigin.trim() 
        : window.location.origin;
      const joinUrl = `${baseOrigin}/join/${quiz.code}`;
      const qrUrl = await QRCodeLib.toDataURL(joinUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      setQuizCode(quiz.code);
      setQrCodeUrl(qrUrl);
      setQuizId(quiz._id);

      toast.dismiss(loadingToast);
      toast.success("🎉 Quiz created successfully!", { duration: 5000 });
    } catch (error: any) {
      console.error("Error creating quiz:", error);
      toast.dismiss(loadingToast);
      toast.error(error.message || "Failed to create quiz. Please try again.", { duration: 6000 });
    }
  };

  const handleGoHome = () => {
    navigate("/");
  };

  const handleLogout = async () => {
    localStorage.removeItem('fabquiz_auth');
    navigate("/");
  };

  if (!user) return null;

  if (quizCode && qrCodeUrl) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="max-w-2xl mx-auto relative z-10">
          <div className="bg-card/95 backdrop-blur-sm border-2 border-primary/30 rounded-3xl p-6 sm:p-12 animate-scale-in text-center shadow-2xl hover-lift">
            {/* Success Icon */}
            <div className="mb-6 sm:mb-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto animate-glow">
                <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
            </div>

            <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-fade-in-up">
              🎉 Quiz Created Successfully!
            </h2>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base animate-fade-in">Share this code with your participants</p>
            
            {/* QR Code */}
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl inline-block mb-6 sm:mb-8 shadow-lg hover-scale animate-fade-in-up">
              <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64" />
            </div>

            {/* Quiz Code */}
            <div className="space-y-4 sm:space-y-6">
              <div className="animate-slide-in-right">
                <Label className="text-sm sm:text-base md:text-lg font-semibold text-muted-foreground">Quiz Code</Label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center mt-3">
                  <code className="text-2xl sm:text-4xl md:text-5xl font-bold text-primary bg-secondary/80 backdrop-blur-sm px-4 sm:px-8 md:px-10 py-2 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl shadow-lg border-2 border-primary/20 tracking-wider hover-glow">
                    {quizCode}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(quizCode);
                      toast.success("📋 Code copied to clipboard!", { duration: 4000 });
                    }}
                    className="hover-scale border-2 border-primary/30 hover:border-primary h-10 w-10 sm:h-12 sm:w-12"
                  >
                    <Copy className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
              </div>

              {/* Share URL */}
              <div className="bg-secondary/30 backdrop-blur-sm p-3 sm:p-4 rounded-xl animate-fade-in">
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 font-medium">Direct Link:</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs sm:text-sm text-primary break-all flex-1 bg-background/50 p-2 rounded">
                    {(import.meta.env?.VITE_PUBLIC_ORIGIN && typeof import.meta.env.VITE_PUBLIC_ORIGIN === 'string' && import.meta.env.VITE_PUBLIC_ORIGIN.trim().length > 0) 
                      ? import.meta.env.VITE_PUBLIC_ORIGIN 
                      : window.location.origin}/join/{quizCode}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      const url = `${(import.meta.env?.VITE_PUBLIC_ORIGIN && typeof import.meta.env.VITE_PUBLIC_ORIGIN === 'string' && import.meta.env.VITE_PUBLIC_ORIGIN.trim().length > 0) 
                        ? import.meta.env.VITE_PUBLIC_ORIGIN 
                        : window.location.origin}/join/${quizCode}`;
                      navigator.clipboard.writeText(url);
                      toast.success("🔗 Link copied to clipboard!", { duration: 4000 });
                    }}
                    className="hover-scale flex-shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleGoHome}
                className="bg-gradient-to-r from-primary to-accent px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl w-full sm:w-auto shadow-xl hover-scale hover-glow animate-fade-in-up"
              >
                <Home className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-10 left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-12 gap-4 animate-fade-in-up">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              Create Quiz
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">Build your interactive quiz in minutes</p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="hover-scale border-2 border-primary/30 hover:border-primary"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Question Builder */}
        <Card className="bg-card/95 backdrop-blur-sm border-2 border-border p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 shadow-2xl hover-lift animate-fade-in">
          <div className="space-y-6">
            <div>
              <Label>Question</Label>
              <Input
                value={currentQuestion.question_text}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
                placeholder="Enter your question"
                className="mt-2"
              />
            </div>

            {/* Image Upload Section */}
            <div>
              <Label>Question Image (Optional)</Label>
              <div className="mt-2 space-y-3">
                {currentQuestion.image_url && getImageUrl(currentQuestion.image_url) ? (
                  <div className="relative inline-block">
                    <img 
                      src={getImageUrl(currentQuestion.image_url)!} 
                      alt="Question Preview" 
                      className="max-w-full h-auto max-h-64 rounded-lg border-2 border-border"
                      onError={(e) => {
                        console.error('Failed to load image preview:', currentQuestion.image_url);
                        toast.error("Failed to load image preview", { duration: 5000 });
                      }}
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={removeImage}
                      className="absolute top-2 right-2 shadow-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="flex-1"
                      id="image-upload"
                    />
                    <Button
                      variant="outline"
                      disabled={uploadingImage}
                      onClick={() => document.getElementById('image-upload')?.click()}
                      className="whitespace-nowrap"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadingImage ? "Uploading..." : "Upload Image"}
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Supported formats: JPG, PNG, GIF, WebP (Max 5MB)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Marks</Label>
                <Input
                  type="number"
                  min="1"
                  value={currentQuestion.marks}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, marks: parseInt(e.target.value) })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Time (seconds)</Label>
                <Input
                  type="number"
                  min="10"
                  value={currentQuestion.time_limit}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, time_limit: parseInt(e.target.value) })}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label>Options</Label>
              <div className="space-y-3 mt-2">
                {currentQuestion.options.map((option, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <Input
                      value={option.text}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant={option.is_correct ? "default" : "outline"}
                        onClick={() => toggleCorrect(idx)}
                        className="flex-1 sm:flex-none"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      {currentQuestion.options.length > 1 && (
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => removeOption(idx)}
                          className="flex-1 sm:flex-none"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={addOption}
                className="mt-3"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Option
              </Button>
            </div>

            <Button
              onClick={addQuestion}
              className="w-full bg-gradient-to-r from-primary to-accent"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Question
            </Button>
          </div>
        </Card>

        {/* Questions List */}
        {questions.length > 0 && (
          <Card className="bg-card border border-border p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 shadow-md">
            <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-primary">Added Questions ({questions.length})</h3>
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={idx} className="bg-secondary/30 p-3 sm:p-4 rounded-lg">
                  <p className="font-semibold mb-2 text-sm sm:text-base">{idx + 1}. {q.question_text}</p>
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <span>Marks: {q.marks}</span>
                    <span>Time: {q.time_limit}s</span>
                    <span>Options: {q.options.length}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {questions.length > 0 && (
          <Button
            onClick={handleDone}
            className="w-full bg-gradient-to-r from-primary to-accent text-base sm:text-lg lg:text-xl py-6 sm:py-8"
          >
            <QrCode className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
            Generate Quiz Code & QR
          </Button>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

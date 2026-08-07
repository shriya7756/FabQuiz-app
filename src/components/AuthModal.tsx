import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import emailjs from '@emailjs/browser';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AuthModal = ({ open, onOpenChange, onSuccess }: AuthModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupCode, setSignupCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [showCodeLogin, setShowCodeLogin] = useState(false);
  const [showCodeSignup, setShowCodeSignup] = useState(false);

  const handleSendCode = async (e: React.FormEvent, isSignup = false) => {
    e.preventDefault();
    setIsLoading(true);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    const email = isSignup ? signupEmail : loginEmail;

    try {
      await emailjs.send(
        'service_xswukan',
        'template_9zoj6zr',
        { email, code, type: isSignup ? 'signup' : 'login' },
        'gMme7aKVLMFXlNOzU'
      );
      toast.success(`✅ ${isSignup ? 'Signup' : 'Login'} code sent to ${email}`, { duration: 6000 });
    } catch (error: unknown) {
      console.error('EmailJS error:', error);
      // Dev bypass: show the code in a toast so admin can still log in
      toast.info(
        `📧 Email service unavailable — Your code is: ${code}`,
        {
          duration: 30000,
          description: 'Copy this code and enter it below to proceed',
        }
      );
      console.info(`🔑 DEV BYPASS — Auth code: ${code}`);
    }

    if (isSignup) setShowCodeSignup(true);
    else setShowCodeLogin(true);
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (loginCode === generatedCode) {
      localStorage.setItem('fabquiz_auth', JSON.stringify({
        email: loginEmail,
        authenticated: true,
        timestamp: Date.now(),
      }));
      toast.success("✅ Logged in successfully!", { duration: 4000 });
      onOpenChange(false);
      setIsLoading(false);
      onSuccess();
    } else {
      toast.error("❌ Invalid code. Please try again.", { duration: 5000 });
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (signupCode === generatedCode) {
      localStorage.setItem('fabquiz_auth', JSON.stringify({
        email: signupEmail,
        authenticated: true,
        timestamp: Date.now(),
      }));
      toast.success("✅ Account created successfully!", { duration: 4000 });
      onOpenChange(false);
      setIsLoading(false);
      onSuccess();
    } else {
      toast.error("❌ Invalid code. Please try again.", { duration: 5000 });
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setShowCodeLogin(false);
    setShowCodeSignup(false);
    setLoginCode("");
    setSignupCode("");
    setGeneratedCode("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetModal(); }}>
      <DialogContent className="bg-card border-2 border-accent/50 backdrop-blur-xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
            {showCodeLogin ? "Enter Login Code" : showCodeSignup ? "Enter Signup Code" : "Admin Access"}
          </DialogTitle>
        </DialogHeader>

        {showCodeLogin ? (
          <form onSubmit={handleLogin} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="login-code">Login Code</Label>
              <Input
                id="login-code"
                type="text"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                className="bg-input border-primary/30 focus:border-accent transition-all text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
              />
              <p className="text-xs text-muted-foreground text-center">
                Enter the 6-digit code sent to your email (check the notification above if email failed)
              </p>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-accent/50 transition-all"
            >
              {isLoading ? "Verifying..." : "Login"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setShowCodeLogin(false); setLoginCode(""); setGeneratedCode(""); }} className="w-full">
              Back to Email
            </Button>
          </form>
        ) : showCodeSignup ? (
          <form onSubmit={handleSignup} className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="signup-code">Signup Code</Label>
              <Input
                id="signup-code"
                type="text"
                value={signupCode}
                onChange={(e) => setSignupCode(e.target.value)}
                className="bg-input border-primary/30 focus:border-accent transition-all text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
              />
              <p className="text-xs text-muted-foreground text-center">
                Enter the 6-digit code (check the notification above if email failed)
              </p>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-accent/50 transition-all"
            >
              {isLoading ? "Creating..." : "Create Account"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setShowCodeSignup(false); setSignupCode(""); setGeneratedCode(""); }} className="w-full">
              Back to Email
            </Button>
          </form>
        ) : (
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
              <TabsTrigger value="login" className="data-[state=active]:bg-primary">Login</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-primary">Signup</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-6">
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="bg-input border-primary/30 focus:border-accent transition-all"
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-accent/50 transition-all">
                  {isLoading ? "Sending..." : "Send Login Code"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-6">
              <form onSubmit={(e) => handleSendCode(e, true)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="bg-input border-primary/30 focus:border-accent transition-all"
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-accent/50 transition-all">
                  {isLoading ? "Sending..." : "Send Signup Code"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

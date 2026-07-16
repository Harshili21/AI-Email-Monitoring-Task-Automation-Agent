import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Inbox, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Sign In — MailPilot" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("manager@company.com");
  const [password, setPassword] = useState("password");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password, remember);
      toast.success("Authentication successful");
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - Login Form */}
      <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Inbox className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">MailPilot</span>
          </div>
          
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
            Sign in to your workspace
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your corporate credentials to continue to the dashboard.
          </p>

          <div className="mt-8">
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                  Email Address
                </Label>
                <div className="mt-2">
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-md border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mt-2">
                  <Label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                    Password
                  </Label>
                  <a href="#" className="text-sm font-medium text-primary hover:text-primary/90 hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="mt-2">
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(v) => setRemember(!!v)}
                  className="rounded-sm border-primary text-primary focus:ring-primary"
                />
                <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
                  Keep me signed in
                </label>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full flex justify-center py-2.5 px-4"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </div>
            </form>
          </div>
          
          <div className="mt-10">
            <p className="text-center text-xs text-muted-foreground">
              Secure access requires an authorized corporate account.<br />
              Contact IT Support if you are experiencing issues.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Branding/Feature Highlight */}
      <div className="relative hidden w-0 flex-1 lg:block bg-slate-900">
        <div className="absolute inset-0 h-full w-full object-cover p-12 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-white/50">
            {/* Optional subtle background elements */}
          </div>
          
          <div className="max-w-xl text-white space-y-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Intelligent Inbox Management
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              MailPilot streamlines your customer communication, automatically routing emails, extracting tasks, and analyzing sentiment to improve response times and customer satisfaction.
            </p>
            
            <div className="pt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <span className="text-slate-300">Automated classification and routing</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <span className="text-slate-300">Seamless ClickUp task synchronization</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 text-purple-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <span className="text-slate-300">Real-time sentiment and urgency analysis</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>&copy; {new Date().getFullYear()} MailPilot Enterprise.</span>
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  );
}

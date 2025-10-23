import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Clock, Play, Square, Activity, LogOut } from "lucide-react";

type Session = {
  id: string;
  employee_id: string;
  login_time: string;
  logout_time: string | null;
  total_minutes: number | null;
  active_minutes: number | null;
  idle_minutes: number | null;
  productivity_score: number | null;
  productivity_label: string | null;
  apps_used: any;
  created_at: string;
};

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [sessionTime, setSessionTime] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadEmployeeData(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Timer for current session
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentSession && !currentSession.logout_time) {
      interval = setInterval(() => {
        const start = new Date(currentSession.login_time).getTime();
        const now = new Date().getTime();
        setSessionTime(Math.floor((now - start) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentSession]);

  const loadEmployeeData = async (userId: string) => {
    try {
      // Load employee profile
      const { data: empData, error: empError } = await supabase
        .from("employees")
        .select("*")
        .eq("id", userId)
        .single();

      if (empError) throw empError;
      setEmployee(empData);

      // Load current active session
      const { data: activeSession, error: sessionError } = await supabase
        .from("sessions")
        .select("*")
        .eq("employee_id", userId)
        .is("logout_time", null)
        .order("login_time", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError && sessionError.code !== "PGRST116") throw sessionError;
      setCurrentSession(activeSession);

      // Load recent sessions
      const { data: sessions, error: historyError } = await supabase
        .from("sessions")
        .select("*")
        .eq("employee_id", userId)
        .not("logout_time", "is", null)
        .order("login_time", { ascending: false })
        .limit(5);

      if (historyError) throw historyError;
      setRecentSessions(sessions || []);
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startWork = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("sessions")
        .insert({
          employee_id: user.id,
          login_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      setCurrentSession(data);
      toast({
        title: "Work session started",
        description: "Your attendance is now being tracked.",
      });
    } catch (error: any) {
      toast({
        title: "Error starting session",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const endWork = async () => {
    if (!currentSession) return;
    setLoading(true);

    try {
      const logout = new Date();
      const login = new Date(currentSession.login_time);
      const totalMinutes = Math.floor((logout.getTime() - login.getTime()) / 60000);
      
      // Simple productivity calculation (for MVP, assume 80% active time)
      const activeMinutes = Math.floor(totalMinutes * 0.8);
      const idleMinutes = totalMinutes - activeMinutes;
      const productivityScore = activeMinutes / totalMinutes;
      
      let productivityLabel = "Not Productive";
      if (productivityScore > 0.8) productivityLabel = "Highly Productive";
      else if (productivityScore > 0.5) productivityLabel = "Moderately Productive";

      const { error } = await supabase
        .from("sessions")
        .update({
          logout_time: logout.toISOString(),
          total_minutes: totalMinutes,
          active_minutes: activeMinutes,
          idle_minutes: idleMinutes,
          productivity_score: productivityScore,
          productivity_label: productivityLabel,
        })
        .eq("id", currentSession.id);

      if (error) throw error;

      toast({
        title: "Work session ended",
        description: `Session duration: ${formatTime(totalMinutes * 60)}. Productivity: ${productivityLabel}`,
      });

      setCurrentSession(null);
      setSessionTime(0);
      loadEmployeeData(user.id);
    } catch (error: any) {
      toast({
        title: "Error ending session",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getProductivityBadge = (label: string | null) => {
    if (!label) return null;
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      "Highly Productive": "default",
      "Moderately Productive": "secondary",
      "Not Productive": "destructive",
    };
    return <Badge variant={variants[label]}>{label}</Badge>;
  };

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Employee Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome, {employee.full_name}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Current Session Card */}
        <Card className="shadow-lg animate-slide-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Current Session
            </CardTitle>
            <CardDescription>Track your work attendance in real-time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentSession && !currentSession.logout_time ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-mono font-bold text-primary">
                    {formatTime(sessionTime)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Active Session Time</p>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-3 h-3 rounded-full bg-accent animate-pulse-slow"></div>
                  <span className="text-sm font-medium text-accent">Recording...</span>
                </div>
                <Button
                  onClick={endWork}
                  disabled={loading}
                  className="w-full"
                  variant="destructive"
                >
                  <Square className="w-4 h-4 mr-2" />
                  End Work Session
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-muted-foreground">No active session</p>
                <Button
                  onClick={startWork}
                  disabled={loading}
                  className="w-full bg-gradient-primary shadow-glow"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Work Session
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card className="shadow-lg animate-slide-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-secondary" />
              Recent Sessions
            </CardTitle>
            <CardDescription>Your work history and productivity insights</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No completed sessions yet</p>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-all"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {new Date(session.login_time).toLocaleDateString()} •{" "}
                        {new Date(session.login_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Duration: {formatTime((session.total_minutes || 0) * 60)}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      {getProductivityBadge(session.productivity_label)}
                      {session.productivity_score && (
                        <p className="text-xs text-muted-foreground">
                          Score: {(session.productivity_score * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EmployeeDashboard;

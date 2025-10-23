import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Users, Activity, Clock, TrendingUp, LogOut, Calendar } from "lucide-react";

type Employee = {
  id: string;
  email: string;
  full_name: string;
  hourly_rate: number;
  created_at: string;
  updated_at: string;
};

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

type SessionWithEmployee = Session & {
  employees: Employee;
};

const HRDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isHR, setIsHR] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sessions, setSessions] = useState<SessionWithEmployee[]>([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeSessions: 0,
    avgProductivity: 0,
  });

  useEffect(() => {
    checkHRAccess();
  }, []);

  const checkHRAccess = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    // Check if user has HR role
    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    if (error || !roles?.some((r) => r.role === "hr")) {
      toast({
        title: "Access Denied",
        description: "You don't have HR privileges. Redirecting...",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setIsHR(true);
    loadHRData();
  };

  const loadHRData = async () => {
    try {
      // Load all employees
      const { data: empData, error: empError } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });

      if (empError) throw empError;
      setEmployees(empData || []);

      // Load recent sessions with employee info
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select(`
          *,
          employees (*)
        `)
        .order("login_time", { ascending: false })
        .limit(20);

      if (sessionError) throw sessionError;
      setSessions(sessionData || []);

      // Calculate stats
      const activeSessions = sessionData?.filter((s) => !s.logout_time).length || 0;
      const completedSessions = sessionData?.filter((s) => s.productivity_score !== null) || [];
      const avgScore =
        completedSessions.length > 0
          ? completedSessions.reduce((sum, s) => sum + (s.productivity_score || 0), 0) /
            completedSessions.length
          : 0;

      setStats({
        totalEmployees: empData?.length || 0,
        activeSessions,
        avgProductivity: avgScore * 100,
      });
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const formatTime = (minutes: number | null) => {
    if (!minutes) return "0h 0m";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const getProductivityBadge = (label: string | null) => {
    if (!label) return <Badge variant="outline">Pending</Badge>;
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      "Highly Productive": "default",
      "Moderately Productive": "secondary",
      "Not Productive": "destructive",
    };
    return <Badge variant={variants[label]}>{label}</Badge>;
  };

  if (!isHR) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Verifying access...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">HR Dashboard</h1>
            <p className="text-sm text-muted-foreground">Workforce Analytics & Management</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 animate-fade-in">
          <Card className="shadow-lg border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-primary" />
                Total Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.totalEmployees}</div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-l-4 border-l-accent">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="w-5 h-5 text-accent" />
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{stats.activeSessions}</div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-l-4 border-l-secondary">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-secondary" />
                Avg Productivity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">
                {stats.avgProductivity.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions Table */}
        <Card className="shadow-lg animate-slide-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Sessions
            </CardTitle>
            <CardDescription>Monitor employee attendance and productivity in real-time</CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No sessions recorded yet</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Active Time</TableHead>
                      <TableHead>Idle Time</TableHead>
                      <TableHead>Productivity</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">
                          {session.employees.full_name}
                          <div className="text-xs text-muted-foreground">
                            {session.employees.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              {new Date(session.login_time).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(session.login_time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {session.logout_time &&
                                ` - ${new Date(session.logout_time).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatTime(session.total_minutes)}</TableCell>
                        <TableCell className="text-accent font-medium">
                          {formatTime(session.active_minutes)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatTime(session.idle_minutes)}
                        </TableCell>
                        <TableCell>
                          {session.productivity_score ? (
                            <div className="space-y-1">
                              {getProductivityBadge(session.productivity_label)}
                              <div className="text-xs text-muted-foreground">
                                {(session.productivity_score * 100).toFixed(0)}%
                              </div>
                            </div>
                          ) : (
                            <Badge variant="outline">N/A</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {session.logout_time ? (
                            <Badge variant="secondary">Completed</Badge>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-accent animate-pulse-slow"></div>
                              <Badge variant="default">Active</Badge>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employee List */}
        <Card className="shadow-lg animate-slide-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary" />
              All Employees
            </CardTitle>
            <CardDescription>Manage your workforce and payroll settings</CardDescription>
          </CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No employees registered yet</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Hourly Rate</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{employee.full_name}</TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell className="text-accent font-semibold">
                          ${employee.hourly_rate.toFixed(2)}/hr
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(employee.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default HRDashboard;

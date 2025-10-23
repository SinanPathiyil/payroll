-- Create app role enum for employee and HR roles
CREATE TYPE public.app_role AS ENUM ('employee', 'hr');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create employees table (profile data)
CREATE TABLE public.employees (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  hourly_rate FLOAT NOT NULL DEFAULT 15.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create sessions table (attendance and activity tracking)
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  login_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  logout_time TIMESTAMP WITH TIME ZONE,
  total_minutes INTEGER,
  active_minutes INTEGER DEFAULT 0,
  idle_minutes INTEGER DEFAULT 0,
  productivity_score FLOAT,
  productivity_label TEXT,
  apps_used JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create payroll table
CREATE TABLE public.payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_days INTEGER NOT NULL,
  total_hours FLOAT NOT NULL,
  hourly_rate FLOAT NOT NULL,
  total_pay FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (employee_id, period_start, period_end)
);

-- Enable RLS on payroll
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "HR can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'hr'));

-- RLS Policies for employees
CREATE POLICY "Employees can view their own profile"
  ON public.employees FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "HR can view all employees"
  ON public.employees FOR SELECT
  USING (public.has_role(auth.uid(), 'hr'));

CREATE POLICY "Employees can update their own profile"
  ON public.employees FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "HR can update all employees"
  ON public.employees FOR UPDATE
  USING (public.has_role(auth.uid(), 'hr'));

CREATE POLICY "HR can insert employees"
  ON public.employees FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'hr'));

-- RLS Policies for sessions
CREATE POLICY "Employees can view their own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = employee_id);

CREATE POLICY "HR can view all sessions"
  ON public.sessions FOR SELECT
  USING (public.has_role(auth.uid(), 'hr'));

CREATE POLICY "Employees can insert their own sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Employees can update their own sessions"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = employee_id);

CREATE POLICY "HR can update all sessions"
  ON public.sessions FOR UPDATE
  USING (public.has_role(auth.uid(), 'hr'));

-- RLS Policies for payroll
CREATE POLICY "Employees can view their own payroll"
  ON public.payroll FOR SELECT
  USING (auth.uid() = employee_id);

CREATE POLICY "HR can view all payroll"
  ON public.payroll FOR SELECT
  USING (public.has_role(auth.uid(), 'hr'));

CREATE POLICY "HR can insert payroll"
  ON public.payroll FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'hr'));

CREATE POLICY "HR can update payroll"
  ON public.payroll FOR UPDATE
  USING (public.has_role(auth.uid(), 'hr'));

-- Function to auto-update employees updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for employees table
CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to create employee profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.employees (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Employee')
  );
  
  -- Assign employee role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  RETURN NEW;
END;
$$;

-- Trigger to create employee profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
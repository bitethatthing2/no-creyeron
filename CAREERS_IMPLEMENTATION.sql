-- ============================================================================
-- SIDE HUSTLE CAREERS IMPLEMENTATION - SQL SCHEMA
-- ============================================================================
-- This file contains the complete database schema for the careers system
-- ============================================================================

-- Create job_applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Position Information
    position_title VARCHAR(100) NOT NULL,
    position_location VARCHAR(100) NOT NULL,
    
    -- Basic Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    location VARCHAR(255),
    
    -- Experience & Skills
    previous_experience TEXT,
    relevant_skills TEXT,
    availability JSONB, -- Store availability as JSON
    preferred_start_date DATE,
    hours_per_week VARCHAR(20),
    
    -- Personality Questions (MOST IMPORTANT)
    why_this_job TEXT NOT NULL, -- Why do you want this job?
    handle_pressure TEXT NOT NULL, -- How do you handle pressure?
    stay_busy_example TEXT NOT NULL, -- How do you stay busy during slow periods?
    teamwork_example TEXT,
    challenging_customer TEXT,
    
    -- Additional Information
    references TEXT,
    additional_info TEXT,
    reliable_transportation VARCHAR(10), -- 'yes' or 'no'
    right_to_work BOOLEAN DEFAULT true,
    
    -- File Storage
    resume_url VARCHAR(500), -- Path to resume in storage bucket
    
    -- Application Management
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'interview', 'trial', 'hired', 'rejected')),
    notes TEXT, -- Internal notes for hiring team
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_position ON public.job_applications(position_title);
CREATE INDEX IF NOT EXISTS idx_job_applications_submitted ON public.job_applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_job_applications_email ON public.job_applications(email);

-- Enable Row Level Security
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow anyone to insert applications (public can apply)
CREATE POLICY "Anyone can submit job applications" ON public.job_applications
    FOR INSERT WITH CHECK (true);

-- RLS Policy: Only authenticated staff can view/update applications
CREATE POLICY "Staff can view all applications" ON public.job_applications
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager', 'staff')
        )
    );

CREATE POLICY "Staff can update applications" ON public.job_applications
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_job_applications_updated_at 
    BEFORE UPDATE ON public.job_applications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STORAGE BUCKET SETUP
-- ============================================================================

-- Create storage bucket for job applications
INSERT INTO storage.buckets (id, name, public) 
VALUES ('job-applications', 'job-applications', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for job applications bucket
CREATE POLICY "Anyone can upload resumes" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'job-applications' AND
        (storage.foldername(name))[1] = 'resumes'
    );

CREATE POLICY "Staff can view all job application files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'job-applications' AND
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager', 'staff')
        )
    );

-- ============================================================================
-- HELPFUL VIEWS FOR BACKEND TEAM
-- ============================================================================

-- View for recent applications (last 30 days)
CREATE OR REPLACE VIEW public.recent_job_applications AS
SELECT 
    id,
    position_title,
    position_location,
    first_name || ' ' || last_name AS full_name,
    email,
    phone,
    status,
    submitted_at,
    -- Personality score (basic scoring system)
    CASE 
        WHEN LENGTH(why_this_job) > 200 AND LENGTH(handle_pressure) > 200 AND LENGTH(stay_busy_example) > 200
        THEN 'High'
        WHEN LENGTH(why_this_job) > 100 AND LENGTH(handle_pressure) > 100 AND LENGTH(stay_busy_example) > 100
        THEN 'Medium'
        ELSE 'Low'
    END AS personality_response_quality
FROM public.job_applications
WHERE submitted_at >= NOW() - INTERVAL '30 days'
ORDER BY submitted_at DESC;

-- View for applications requiring review
CREATE OR REPLACE VIEW public.applications_pending_review AS
SELECT 
    id,
    position_title,
    first_name || ' ' || last_name AS full_name,
    email,
    why_this_job,
    handle_pressure,
    stay_busy_example,
    submitted_at,
    EXTRACT(days FROM (NOW() - submitted_at)) AS days_waiting
FROM public.job_applications
WHERE status = 'pending'
ORDER BY submitted_at ASC;

-- ============================================================================
-- SAMPLE QUERIES FOR BACKEND TEAM
-- ============================================================================

/*
-- Get all applications for a specific position
SELECT * FROM public.job_applications 
WHERE position_title = 'Bartender' AND status = 'pending'
ORDER BY submitted_at DESC;

-- Get applications with strong personality responses
SELECT 
    first_name || ' ' || last_name AS name,
    position_title,
    why_this_job,
    handle_pressure,
    stay_busy_example
FROM public.job_applications
WHERE 
    LENGTH(why_this_job) > 150 AND
    LENGTH(handle_pressure) > 150 AND
    LENGTH(stay_busy_example) > 150 AND
    status = 'pending';

-- Update application status
UPDATE public.job_applications 
SET 
    status = 'interview',
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    notes = 'Great personality responses, scheduling interview'
WHERE id = 'application-uuid-here';

-- Get resume URL for download
SELECT 
    first_name || ' ' || last_name AS name,
    resume_url,
    CASE 
        WHEN resume_url IS NOT NULL 
        THEN 'https://[your-supabase-url]/storage/v1/object/public/job-applications/' || resume_url
        ELSE 'No resume uploaded'
    END AS download_url
FROM public.job_applications
WHERE id = 'application-uuid-here';
*/

-- ============================================================================
-- ANALYTICS QUERIES
-- ============================================================================

-- Application statistics by position
CREATE OR REPLACE VIEW public.application_stats_by_position AS
SELECT 
    position_title,
    position_location,
    COUNT(*) as total_applications,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'interview') as interview_count,
    COUNT(*) FILTER (WHERE status = 'hired') as hired_count,
    COUNT(*) FILTER (WHERE resume_url IS NOT NULL) as applications_with_resume,
    AVG(LENGTH(why_this_job)) as avg_response_length
FROM public.job_applications
WHERE submitted_at >= NOW() - INTERVAL '90 days'
GROUP BY position_title, position_location
ORDER BY total_applications DESC;

-- Monthly application trends
CREATE OR REPLACE VIEW public.monthly_application_trends AS
SELECT 
    DATE_TRUNC('month', submitted_at) as month,
    COUNT(*) as applications_count,
    COUNT(*) FILTER (WHERE status = 'hired') as hired_count,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'hired')::numeric / 
        COUNT(*)::numeric * 100, 2
    ) as hire_rate_percentage
FROM public.job_applications
WHERE submitted_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', submitted_at)
ORDER BY month DESC;
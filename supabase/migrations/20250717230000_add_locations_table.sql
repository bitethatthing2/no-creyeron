-- Create locations table for wolfpack location verification
CREATE TABLE public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius_miles DECIMAL(5, 2) DEFAULT 0.5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Everyone can view active locations"
ON public.locations
FOR SELECT
TO public
USING (is_active = true);

-- Insert Side Hustle Bar location (Salem, MA)
INSERT INTO public.locations (name, latitude, longitude, radius_miles, is_active)
VALUES ('Side Hustle Bar', 42.5195, -70.8967, 0.5, true);

-- Add trigger for updated_at
CREATE TRIGGER update_locations_updated_at 
BEFORE UPDATE ON public.locations 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
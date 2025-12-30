-- Create Documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    size INTEGER NOT NULL,
    type TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'contact', 'deal', 'account')),
    entity_id UUID NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- create policy "Users can view documents" ON documents FOR SELECT USING (true);
-- create policy "Users can insert documents" ON documents FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
-- create policy "Users can delete documents" ON documents FOR DELETE USING (auth.uid() = uploaded_by);

-- Simplified RLS for now (Open access for authenticated users)
CREATE POLICY "Enable read access for authenticated users" ON documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable delete access for authenticated users" ON documents FOR DELETE TO authenticated USING (true);

-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('crm-documents', 'crm-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Grant access to storage objects
CREATE POLICY "Allow authenticated uploads" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'crm-documents');

CREATE POLICY "Allow authenticated read" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'crm-documents');

CREATE POLICY "Allow authenticated delete" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'crm-documents');

/*
  # Create Storage Bucket for Project Attachments

  1. Storage Setup
    - Create `project-attachments` bucket with public access
    - Configure bucket for file uploads up to 10MB
  
  2. Security
    - Enable RLS on storage.objects
    - Add policy for authenticated users to upload files
    - Add policy for authenticated users to read files
    - Add policy for file owners to delete their files
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-attachments',
  'project-attachments',
  true,
  10485760,
  NULL
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload project attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-attachments');

CREATE POLICY "Anyone can view project attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'project-attachments');

CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

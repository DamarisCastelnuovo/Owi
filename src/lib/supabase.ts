import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://wgkidfekuhphrlsrhnlv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indna2lkZmVrdWhwaHJsc3Jobmx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMDg1NzUsImV4cCI6MjA5NDU4NDU3NX0.C8hn6RMvzjIgAa3RFW6JnY7YWtp2QdSpxdb5IRszui8'
)

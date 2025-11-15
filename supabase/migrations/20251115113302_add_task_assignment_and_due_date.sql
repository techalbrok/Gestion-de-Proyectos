/*
  # Add task assignment and due date columns

  1. Changes to sub_tasks table
    - Add `assigned_to` column (uuid, nullable, foreign key to users)
    - Add `due_date` column (date, nullable)
  
  2. Security
    - Update existing RLS policies to account for new columns
*/

-- Add assigned_to column to sub_tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sub_tasks' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE sub_tasks ADD COLUMN assigned_to uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add due_date column to sub_tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sub_tasks' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE sub_tasks ADD COLUMN due_date date;
  END IF;
END $$;

-- Create index on assigned_to for better query performance
CREATE INDEX IF NOT EXISTS idx_sub_tasks_assigned_to ON sub_tasks(assigned_to);

-- Create index on due_date for better query performance
CREATE INDEX IF NOT EXISTS idx_sub_tasks_due_date ON sub_tasks(due_date);

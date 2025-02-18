
-- Add ingredients column to recipes and favorites tables
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS ingredients TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS ingredients TEXT[] NOT NULL DEFAULT '{}';

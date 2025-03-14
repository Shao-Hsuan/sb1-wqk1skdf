-- Create version_branches table
CREATE TABLE IF NOT EXISTS version_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  description text,
  parent_branch_id uuid REFERENCES version_branches(id),
  is_main boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(goal_id, name)
);

-- Create version_snapshots table
CREATE TABLE IF NOT EXISTS version_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES version_branches(id) ON DELETE CASCADE,
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  description text,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  restored_at timestamptz,
  restored_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE version_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies for version_branches
CREATE POLICY "Users can create their own branches"
  ON version_branches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own branches"
  ON version_branches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own branches"
  ON version_branches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own branches"
  ON version_branches
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for version_snapshots
CREATE POLICY "Users can create their own snapshots"
  ON version_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own snapshots"
  ON version_snapshots
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger to update branch timestamp
CREATE OR REPLACE FUNCTION update_branch_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_branch_timestamp
  BEFORE UPDATE ON version_branches
  FOR EACH ROW
  EXECUTE FUNCTION update_branch_timestamp();

-- Create trigger to create main branch when goal is created
CREATE OR REPLACE FUNCTION create_main_branch()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO version_branches (goal_id, user_id, name, description, is_main)
  VALUES (NEW.id, NEW.user_id, 'main', '主要版本', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_main_branch_on_goal_creation
  AFTER INSERT ON goals
  FOR EACH ROW
  EXECUTE FUNCTION create_main_branch();

-- Add comments for documentation
COMMENT ON TABLE version_branches IS '存儲目標的不同版本分支';
COMMENT ON TABLE version_snapshots IS '存儲每個分支的版本快照';
COMMENT ON COLUMN version_branches.is_main IS '是否為主要分支';
COMMENT ON COLUMN version_snapshots.data IS '包含目標、日誌、收藏等相關資料的快照';
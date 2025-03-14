/*
  # 創建排程任務表

  1. 新表格
    - `scheduled_tasks`
      - `id` (uuid, 主鍵)
      - `goal_id` (uuid, 外鍵參考 goals 表)
      - `user_id` (uuid, 外鍵參考 auth.users 表)
      - `last_letter_at` (timestamp, 上次生成信件的時間)
      - `next_letter_at` (timestamp, 下次生成信件的時間)
      - `created_at` (timestamp, 創建時間)

  2. 安全性
    - 啟用 RLS
    - 添加讀取和更新的策略
*/

-- 創建排程任務表
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  last_letter_at timestamptz,
  next_letter_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(goal_id, user_id)
);

-- 啟用 RLS
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;

-- 創建讀取策略
CREATE POLICY "Users can read their own scheduled tasks"
  ON scheduled_tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 創建更新策略
CREATE POLICY "Users can update their own scheduled tasks"
  ON scheduled_tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 創建觸發器函數，在創建新目標時自動創建排程任務
CREATE OR REPLACE FUNCTION create_scheduled_task()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO scheduled_tasks (goal_id, user_id)
  VALUES (NEW.id, NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 創建觸發器
DROP TRIGGER IF EXISTS create_scheduled_task_trigger ON goals;
CREATE TRIGGER create_scheduled_task_trigger
  AFTER INSERT ON goals
  FOR EACH ROW
  EXECUTE FUNCTION create_scheduled_task();
-- アクセスカウンター用テーブル
CREATE TABLE IF NOT EXISTS access_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 初期レコード挿入
INSERT INTO access_counter (id, count) VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- RLSポリシー（全員が読み取り可能、更新は認証不要）
ALTER TABLE access_counter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read counter"
  ON access_counter
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can update counter"
  ON access_counter
  FOR UPDATE
  TO anon
  USING (id = 1);

-- カウント増加用のRPCファンクション
CREATE OR REPLACE FUNCTION increment_counter()
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE access_counter
  SET count = count + 1, updated_at = NOW()
  WHERE id = 1
  RETURNING count INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

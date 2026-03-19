-- Feature: Chemistry Score
-- Thêm learning_style vào profiles (cache kết quả phân tích AI)
-- Thêm chemistry_score vào matches

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS learning_style jsonb;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS chemistry_score float;

-- blogs テーブルに tags カラムを追加
-- SNSのハッシュタグのように複数のタグを保持できるように text[] 型を使用します
ALTER TABLE public.blogs 
ADD COLUMN tags TEXT[] DEFAULT '{}' NOT NULL;

-- 検索効率向上のため、GIN インデックスを作成（タグによるフィルタリングを想定）
CREATE INDEX idx_blogs_tags ON public.blogs USING GIN (tags);

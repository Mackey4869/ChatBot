-- 1. pgvector 拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions; --

-- 2. blogs テーブルにベクトル保存用カラムを追加
-- 次元数は、利用するLLMに合わせて設定します（後述）
ALTER TABLE public.blogs 
ADD COLUMN embedding extensions.vector(768); -- とりあえず768（Geminiの標準）

-- 3. 高速検索用のインデックスを作成
CREATE INDEX ON public.blogs USING hnsw (embedding extensions.vector_cosine_ops);
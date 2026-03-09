-- 1. ブログの各断片（チャンク）を保存するテーブル
CREATE TABLE public.blog_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    -- Geminiの標準モデル text-embedding-004 は 768次元です
    embedding extensions.vector(768), 
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 検索速度向上のためのインデックス
CREATE INDEX ON public.blog_sections USING hnsw (embedding extensions.vector_cosine_ops);

-- 3. RAG用の検索関数 (RPC)
-- ユーザーの質問ベクトルを受け取り、類似度が高い順にブログの断片を返します
CREATE OR REPLACE FUNCTION match_blog_sections (
  query_embedding extensions.vector(768),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  blog_id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    blog_sections.id,
    blog_sections.blog_id,
    blog_sections.content,
    1 - (blog_sections.embedding <=> query_embedding) AS similarity
  FROM blog_sections
  WHERE 1 - (blog_sections.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
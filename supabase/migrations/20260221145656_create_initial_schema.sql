-- 1. users テーブル (Supabaseの標準認証 auth.users と紐付け)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'student')),
    password_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. personal_pages テーブル (個人ページ)
CREATE TABLE public.personal_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    password_hash TEXT,
    content TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. blog_categories テーブル (カテゴリマスタ)
CREATE TABLE public.blog_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- 初期カテゴリデータの挿入
INSERT INTO public.blog_categories (name) VALUES 
    ('research'), 
    ('tech'), 
    ('personal');

-- 4. blogs テーブル (ブログ本文)
CREATE TABLE public.blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES public.blog_categories(id),
    title TEXT NOT NULL,
    content TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. meeting_records テーブル (音声面談記録)
CREATE TABLE public.meeting_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_id UUID REFERENCES public.blogs(id) ON DELETE SET NULL,
    audio_url TEXT NOT NULL,
    raw_transcript TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. schedules テーブル (個人のスケジュール)
CREATE TABLE public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_public BOOLEAN DEFAULT true
);

-- 7. zemi_slots テーブル (研究ゼミの枠)
CREATE TABLE public.zemi_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    max_capacity INTEGER NOT NULL DEFAULT 5,
    booked_count INTEGER NOT NULL DEFAULT 0
);
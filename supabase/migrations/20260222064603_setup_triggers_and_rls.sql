-- pgcrypto拡張機能を有効化（後述のパスワードハッシュ化で使用します）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 新規ユーザー登録時に実行される関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- 1. usersテーブルに基本情報を登録（デフォルトは 'student' とする）
  INSERT INTO public.users (id, name, role)
  -- raw_user_meta_data から名前を取得。なければ 'No Name'
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', 'No Name'), 'student');

  -- 2. personal_pagesテーブルに個人ページを自動開設
  INSERT INTO public.personal_pages (user_id)
  VALUES (new.id);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER により管理者権限で実行される

-- auth.usersテーブルのINSERT後に上記の関数を呼び出すトリガー
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- テーブルのRLSを有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_pages ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- public.users のポリシー
-- ==========================================
-- ログインしているユーザーは、全ユーザーのリストを見ることができる（チャット等で必要）
CREATE POLICY "ログインユーザーは全ユーザー情報を閲覧可能" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- 自分のプロフィールのみ更新可能
CREATE POLICY "自分のプロフィールのみ更新可能" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ==========================================
-- public.personal_pages のポリシー
-- ==========================================
-- 管理者(admin) または 本人のみが無条件で閲覧可能
CREATE POLICY "管理者と本人は個人ページを閲覧可能" ON public.personal_pages
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- 本人のみ自分のページの設定（パスワードなど）を更新可能
CREATE POLICY "本人のみ個人ページを更新可能" ON public.personal_pages
  FOR UPDATE USING (auth.uid() = user_id);

-- パスワードが一致するかどうかを検証する関数（Next.jsから supabase.rpc() で呼び出す）
CREATE OR REPLACE FUNCTION public.verify_personal_page_password(page_id UUID, input_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  -- 該当ページのパスワードハッシュを取得
  SELECT password_hash INTO stored_hash FROM public.personal_pages WHERE id = page_id;
  
  -- パスワードが設定されていない場合はアクセス拒否
  IF stored_hash IS NULL THEN
     RETURN FALSE;
  END IF;
  
  -- 入力されたパスワードをハッシュ化して比較 (pgcryptoのcrypt関数を使用)
  RETURN stored_hash = crypt(input_password, stored_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
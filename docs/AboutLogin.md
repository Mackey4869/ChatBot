
# ログイン仕様と操作手順

このドキュメントはフロントエンド側のログイン／ログアウト挙動、環境変数、テスト手順、保護ルーティングの実装についてまとめたものです。

**主な実装ファイル**
- `frontend/lib/supabase.ts`：Supabase クライアントの生成（ブラウザではセッション永続化を有効化、クライアントをシングルトン化）。
- `frontend/components/AuthProvider.tsx`：Supabase セッションを取得・監視し、`session`／`user`／`initialized` を React Context で提供。
- `frontend/components/AuthGuard.tsx`：クライアントサイドのルート保護。未認証時は `/Login` にリダイレクト。
- `frontend/app/(auth)/Login/page.tsx`：ログイン画面（メール/パスワードで `signInWithPassword` を呼ぶ）。
- `frontend/components/layout/mobile-layout.tsx`：ヘッダ右上にログアウトアイコンを配置、確認モーダルを表示。

---

## 環境変数（必須）
- `NEXT_PUBLIC_SUPABASE_URL`：Supabase プロジェクト URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`：フロント用の公開 ANON キー
- `NEXT_PUBLIC_SUPABASE_DEBUG`（任意）：`true` にすると認証イベント等のデバッグログをブラウザに出力します。デフォルトは無効。

注意：`SUPABASE_SERVICE_ROLE_KEY` などのサービスロールキーは絶対にクライアントに公開しないでください。

---

## ログインフロー（クライアント側）
1. `Login` ページでメール・パスワードを入力し送信。
2. フロントエンドは `frontend/lib/supabase.ts` の `createClient()` で取得した Supabase クライアントの `auth.signInWithPassword({ email, password })` を呼び出します。
3. サインイン成功時は `AuthProvider` の `onAuthStateChange` が発火して `session` と `user` を Context にセットします。
4. `AuthGuard` が `initialized` と `session` を見て未認証なら `/Login` へリダイレクト、認証済みならページを表示します。

実装上のポイント：
- `AuthProvider` は初回に `supabase.auth.getSession()` を呼び、`initialized` を true にしてから保護判定を行います（フリッカー回避）。
- `lib/supabase.ts` はブラウザで実行される場合に `auth.persistSession` を有効にし、localStorage にセッションを保持します。これによりページリロード後もログイン状態が維持されます。

---

## ログアウト
1. ヘッダ右上のログアウトアイコンを押すと確認モーダルが出ます（「ログアウトしますか？」）。
2. 確認で `supabase.auth.signOut()` を呼び、正常終了後に `AuthProvider` の状態が変化します。
3. ログアウト時は `AuthGuard` により `/Login` へリダイレクトされます。

---

## ルーティング保護の動作
- `AuthGuard` はクライアントサイドで動作する保護機構です。`AuthProvider` の `initialized` が完了するまで何も描画しない（null 返却）ため、ページを一瞬でも表示してしまうことを防ぎます。
- 許可された公開パス（現状は `/Login`、`/_next`、`/favicon.ico` 等）は allowlist に含めています。公開ページを増やす場合は `AuthGuard` の allowlist を更新してください。

注意：クライアントサイド保護はブラウザ経由の UI 表示を防ぎますが、API エンドポイントや SSR を完全に保護するにはサーバ側での検証（httpOnly cookie と Next.js middleware 等）が必要です。

---

## デバッグとログ
- デバッグログはデフォルトで抑制されています。詳細ログが必要な場合は開発環境で `NEXT_PUBLIC_SUPABASE_DEBUG=true` を設定してください。これにより `AuthProvider` の認証イベント（login/logout/初期セッション検出）がブラウザに出力されます。

---

## 開発時の起動方法（簡潔）
コンテナを使う場合（プロジェクトルートで）:
```bash
docker compose up -d --build front
docker compose logs -f front
```
ローカルで直接実行する場合:
```bash
cd frontend
npm install
npm run dev
```

ブラウザで `http://localhost:3000/Login` を開き、ログインしてください。

---

## テスト手順（確認項目）
1. 未ログインで `/` にアクセス → `/Login` にリダイレクトされること。
2. `Login` で正しい資格情報を入力しログイン → 保護されたページ（`/` や `/Chat` 等）を閲覧できること。
3. ページをリロードしてもログイン状態が維持されること。
4. ヘッダのログアウトアイコンを押してモーダルからログアウト → `/Login` に戻ること。

---

## よくあるトラブルと対処
- 「Supabase 環境変数が設定されていません」という赤いメッセージが表示される場合：`.env` に `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を追加し、コンテナ/サーバを再起動してください。
- ログが大量に流れる場合：`NEXT_PUBLIC_SUPABASE_DEBUG` を `false` または未設定にしてください。弊実装では明示的に `true` のときのみログを出力します。
- 認証状態が更新されない場合：`frontend/lib/supabase.ts` がシングルトン化されているか（`createClient()` が複数インスタンスを作らないか）、dev サーバを再起動して古いサブスクリプションをクリアしてください。

---

## 次の改善提案（将来）
- サーバー側でのセッション管理：ログイン時にサーバでトークンを検証し、httpOnly cookie を発行する方式に移行すると、XSS によるトークン漏洩リスクを低減できます。
- Next.js `middleware.ts` を使ったサーバ側ルーティング保護：API ルートや SSR ページを含め強固な保護が可能になります。
- ログ管理の改善：`logger` ユーティリティ導入によるログレベル管理や外部ログ集約サービスへの送信。

---

必要ならこのドキュメントを英語版に変換したり、`/api/session` を使った httpOnly cookie のサンプル実装を追加します。どれを先に行いましょうか？


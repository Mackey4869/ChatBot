
# Supabase 認証（フロント） 使い方まとめ

このドキュメントは、フロントエンド側で Supabase Auth を使って
「新規登録（サインアップ）」「ログイン」「ログアウト」「セッション管理」を行う基本的な方法をまとめたものです。

基本事項
- フロントでは公開可能な ANON キー（`NEXT_PUBLIC_SUPABASE_ANON_KEY` 等）を使ってクライアントを作成します。
- サーバー側で管理操作や RPC を呼ぶ場合はサービスロールキー（`SUPABASE_SERVICE_ROLE_KEY`）をサーバー限定で使うようにしてください。
- サーバー実装の参考: [frontend/lib/supabase.server.ts](frontend/lib/supabase.server.ts)

セットアップ（簡易）

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
export default supabase;
```

1) サインアップ（メール／パスワード）

```javascript
const { data, error } = await supabase.auth.signUp({
	email: 'user@example.com',
	password: 'super-secret'
});
if (error) {
	// エラーハンドリング
}
// data には user や session 情報が入る（メール確認フローが有効な場合は session が null のこともある）
```

2) サインイン（メール／パスワード）

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
	email: 'user@example.com',
	password: 'super-secret'
});
if (error) {
	// 認証失敗時の処理
}
// data.session にアクセストークン等が入る
```

3) サインアウト

```javascript
const { error } = await supabase.auth.signOut();
if (error) {
	// エラー処理
}
```

4) 現在のユーザー情報 / セッション取得

```javascript
const { data } = await supabase.auth.getUser();
const user = data?.user || null;

// またはセッション全体を確認
const sessionResp = await supabase.auth.getSession();
const session = sessionResp?.data?.session || null;
```

5) 認証状態の監視（リアクティブに扱う）

```javascript
supabase.auth.onAuthStateChange((event, session) => {
	// event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' など
	// session: 現在の session オブジェクト
});
```

6) マジックリンク / ワンタイムパス（OTP）や OAuth

```javascript
// メールでのマジックリンク
await supabase.auth.signInWithOtp({ email: 'user@example.com' });

// OAuth（例: Google）
await supabase.auth.signInWithOAuth({ provider: 'google' });
```

注意点とベストプラクティス
- ANON キーはフロント用、SERVICE_ROLE_KEY はサーバー用に分ける。SERVICE_ROLE_KEY をクライアントに絶対公開しないこと。
- ブラウザでセッションを扱う場合、Supabase クライアントは内部で token を管理しますが、よりセキュアにするにはログイン後にサーバーで httpOnly cookie を発行する方式が推奨されます（サーバー側でトークンを検証して cookie を返す実装が必要）。
- メール確認（confirm）のフローを有効にしている場合は、サインアップ直後に session が返らないことがあります。フロントはそのケースをハンドリングしてください。
- エラーメッセージは API の `error` オブジェクトを参照してユーザーに分かりやすく表示してください。

サーバー側での検証が必要なパターン
- API エンドポイントにユーザー識別を必須化したい場合は、フロントから Authorization ヘッダ（Bearer token）を送ってもらい、サーバーで検証するか、サーバー経由で httpOnly cookie を発行してセッションを管理する実装が必要です。
- サーバーサイドで Supabase の管理 API を使う（ユーザーの強制パスワードリセット／ロール付与等）場合は `SUPABASE_SERVICE_ROLE_KEY` を利用してください。

参考実装（Next.js の簡易パターン）
- 1) フロントで `supabase.auth.signInWithPassword` を呼ぶ。
- 2) 返ってきた session.access_token を `/api/session` に POST する。
- 3) サーバー (`/api/session`) が受け取り、token を検証して httpOnly cookie をセットする。

関連ファイル
- サーバー用 Supabase クライアント: [frontend/lib/supabase.server.ts](frontend/lib/supabase.server.ts)

クライアント側の Supabase クライアントは `frontend/lib/supabase.ts`（ブラウザ用、`NEXT_PUBLIC_` キーのみ使用）です。サーバー側で管理操作や RPC を呼ぶ場合は `frontend/lib/supabase.server.ts` を利用してください。
- RLS / ユーザープロビジョニング: [supabase/migrations/20260222064603_setup_triggers_and_rls.sql](supabase/migrations/20260222064603_setup_triggers_and_rls.sql)

トラブルシュート（よくある問題）
- "API key not found" 系: `.env` にキーがあるか、Next.js の実行環境に渡っているか確認。コンテナ環境では `env_file` の形式に注意。
- CORS や リダイレクトの問題（OAuth）: Supabase コンソールの認証設定で正しいリダイレクト URI を登録してください。

このドキュメントに追加してほしいサンプル（例）: `httpOnly cookie` を発行する `/api/auth/login` の実装例、フロントの React フック例などが必要なら次に作成します。

<!-- 管理者関連の詳細は docs/adminAPI.md に移動しました -->

管理者の運用方法・API 仕様は `docs/adminAPI.md` を参照してください。


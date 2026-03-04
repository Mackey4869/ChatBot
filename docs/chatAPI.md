
# Chat API 仕様

## 概要
- エンドポイント: `POST /api/chat`
- 用途: ユーザーの質問を受け取り、質問文を埋め込み（embedding）→ Supabase 上のチャンク化済みドキュメントと類似度検索 → 取得した関連断片をコンテキストとして LLM に投げ、回答を生成して返却する。
- ログ: チャットログは保持しない（ステートレスな問い合わせ）想定。

## 動作フロー
1. クライアントが `message` を含む JSON を `POST /api/chat` に送信。
2. サーバー側で `lib/ai.generateEmbedding` を用いて `message` をベクトル化（768次元を想定）。
3. Supabase の RPC（例: `match_blog_sections`）を呼び出し、類似度の高いチャンクを取得する。パラメータ例: `match_threshold`, `match_count`。
4. 取得したチャンク（`content` 等）を連結してコンテキストを構築。
5. コンテキストと元の質問を `lib/ai.generateChatResponse`（Gemini 等の LLM）に渡して応答を生成。
6. 生成した回答と、参照に使ったソース（検索結果）を JSON で返す。

## リクエスト（JSON）
例:

```json
{
	"message": "Next.js で認証を実装する際の注意点を教えて"
}
```

## レスポンス（JSON）
- 正常例 (200):

```json
{
	"answer": "（LLM が生成した日本語の回答）",
	"sources": [ /* Supabase から返されたチャンクの配列 */ ]
}
```

- 異常例: 400（入力不正）や 500（サーバーエラー）と共に `{ "error": "..." }` を返す。

## Supabase RPC について
- このリポジトリでは `match_blog_sections` のような RPC が migration 内に定義されている想定です（`supabase/migrations` を参照）。
- RPC パラメータ例:
	- `query_embedding`: ベクトル配列
	- `match_threshold`: 類似度閾値（例: 0.3）
	- `match_count`: 上位 n 件（例: 5）
- RPC の戻り値には、少なくとも各チャンクの `content` とメタ情報（例: `blog_id`, `section_id`, `similarity`）が含まれていると便利です。実際のフィールド名は migration の定義に合わせてください。

## 必要な環境変数（サーバー側）
- Embedding / LLM: `GEMINI_API_KEY`
- LLM モデル（任意）: `GEMINI_CHAT_MODEL`（未指定時はコード内デフォルトを使用）
- Supabase 関連:
	- `SUPABASE_PROJECT_ID`（推奨）または `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL`
	- `SUPABASE_SERVICE_ROLE_KEY`（サーバー側で DB 操作や RPC を使う場合はサービスロールキーを推奨）
	- 代替: `NEXT_PUBLIC_SUPABASE_ANON_KEY` や `SUPABASE_ACCESS_TOKEN`

## テスト方法（curl / Thunder Client）

ローカルで Next.js が `http://localhost:3000` で動いている想定の例:

```bash
curl -X POST http://localhost:3000/api/chat \
	-H "Content-Type: application/json" \
	-d '{"message":"最近のブログでTypeScriptのベストプラクティスを教えて"}'
```

Thunder Client を使う場合はメソッドを `POST`、URL を `http://localhost:3000/api/chat`、Body を上記 JSON にします。

## エラーハンドリングとトラブルシューティング
- Embedding 生成で失敗した場合: `GEMINI_API_KEY` の設定を確認。
- RPC 呼び出しで失敗した場合: Supabase のキー/権限（サービスロール）や RPC 名・引数の整合性を確認。
- 期待するフィールドが返らない場合: migration に定義されている RPC の戻り値（カラム名）に合わせてルートハンドラを修正してください。

## セキュリティ注意点
- `SUPABASE_SERVICE_ROLE_KEY` は強力な権限を持つため、フロントエンドに公開しないでください。サーバー側のみで使用してください。
- ユーザー提供コンテンツを LLM に渡す場合、個人情報や機密情報の取り扱いに注意してください。

## 実装の補足
- 実装例は `frontend/app/api/chat/route.ts` にあり、`lib/ai.ts` の `generateEmbedding` / `generateChatResponse` を利用します。必要に応じて RPC 名や戻り値のフィールド名をプロジェクトの migration 定義に合わせてください。

### 追記（最近の実装変更）
- デフォルトのチャットモデルは `gemini-2.5-flash` に変更されています。必要なら `GEMINI_CHAT_MODEL` で上書きしてください。
- `lib/ai.ts` 側では Gemini SDK の `generateContent` を使い、返却された `response.text()` を読み取って最終テキストを取得する実装になっています。SDK のバージョンによってレスポンス構造が異なるため、エラーが出る場合は `lib/ai.ts` の抽出ロジックを確認してください。
- 埋め込みは引き続き `gemini-embedding-001` を想定（768次元）です。Supabase 側の `vector(768)` 型と整合しています。


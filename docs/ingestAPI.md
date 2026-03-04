# ingest API 仕様

## 概要
- エンドポイント: `POST /api/ingest`
- 用途: ブログ記事を受け取り、記事本体を保存 → 本文をチャンク化 → 各チャンクを埋め込み（embedding）して `blog_sections` テーブルに保存するワークフローを実行します。

## 動作フロー
1. クライアントが記事（タイトル、本文 等）を送信
2. サーバーが `blogs` テーブルに記事を保存（`is_published: true` など）
3. `utils/splitText` で本文をチャンク化（デフォルト: 500文字、重複100文字）
4. 各チャンクについて `lib/ai.generateEmbedding` を呼び、埋め込みベクトルを生成（APIに `outputDimensionality: 768` を指定）
5. `blog_sections` テーブルに `blog_id`, `content`, `embedding` を保存（`embedding` は vector(768) を想定）

## リクエスト（JSON）
例:

```
{
  "title": "テスト記事",
  "content": "本文のテストです。...",
  "category_id": 1,
  "author_id": {自動で決まるユーザーID}
}
```

## レスポンス
- 正常: `200` と JSON `{ "success": true, "blogId": <id> }`
- 異常: `500` 等と `{ "error": "..." }`（サーバーログに詳細）

## 必要な環境変数（サーバー側）
- Supabase 関連:
  - `SUPABASE_PROJECT_ID` (プロジェクトID, 例: wfkriqqu...)
  - `SUPABASE_ACCESS_TOKEN` または優先して `SUPABASE_SERVICE_ROLE_KEY`（サービスロールキーを最優先で使用）
  - 代替: `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`（環境に応じて）
- Embedding（Gemini）:
  - `GEMINI_API_KEY`

> 注意: サーバー側で DB 書き込みを行うためにはサービスロール権限が必要な場合があります。`

## チャンク化の仕様（現状）
- 実装: `frontend/utils/textSplit.ts`
- デフォルト: `chunkSize = 500` 文字、`overlap = 100` 文字
- 実際のスライド幅: `chunkSize - overlap = 400` 文字ずつ進む
- 特性: 単純固定長分割。文区切りやトークンベースの最適化は行っていないため、必要なら改良可能。

## 埋め込み（Embedding）仕様
- クライアント: `frontend/lib/ai.ts` を使用して `GoogleGenerativeAI` 経由で生成
- モデル: `gemini-embedding-001`（コード内の定数 `EMBEDDING_MODEL`）
- 出力次元: API に `outputDimensionality: 768` を指定してリクエスト。戻り値は 768 次元を想定し、冗長/不足がある場合はサーバー側で切り詰め/パディングを行います。

## テーブル（期待されるスキーマ）
- `blogs`（例）: `id`, `title`, `content`, `category_id`, `author_id`, `is_published`, `created_at` 等
- `blog_sections`（例）: `id`, `blog_id`, `content`, `embedding` (vector(768)), `created_at` 等

## テスト方法（Thunder Client）

Thunder Client を使った手順（VS Code 拡張）:

1. VS Code で Thunder Client を開き、`New Request` を作成します。
2. メソッドを `POST`、URL に次のいずれかを設定します:
   - ホスト側から叩く場合（推奨）: `http://localhost:{{HOST_PORT}}/api/ingest`
     - `{{HOST_PORT}}` はルートの `.env` に設定した `HOST_PORT`（例: `3003`）。指定がなければ `3000`。
   - コンテナ内で実行中の Next に直接叩く場合: `http://localhost:3000/api/ingest`（この場合は Thunder Client をコンテナ内で動かすか、`docker compose exec front` 経由で curl を使います）
3. `Headers` に次を追加:
   - `Content-Type: application/json`
   - （任意）`Accept: application/json`
4. `Body` を `JSON` にして、ペイロードを入力します。例:

```json
{
  "title": "テスト記事",
  "content": "本文のテストです。",
  "category_id": 1,
  "author_id": {自動で決まるユーザーID}
}
```

5. `Send` をクリックして実行します。正常なら `200` と `{ "success": true, "blogId": <id> }` が返ります。

注記:
- `HOST_PORT` の確認はルートの `.env` または `docker-compose.yml` を参照してください。
- Thunder Client 側に API キーを入れる必要は通常ありません（サーバー側の env を参照するため）。

（参考）コンテナ内から curl でテストする場合:

```bash
docker compose exec front curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"title":"テスト記事","content":"本文のテストです。","category_id":1,"author_id":1}'
```

## トラブルシューティング
- Thunder Client で "APIキーがない" と出る場合: サーバー側で `GEMINI_API_KEY` や Supabase のキーが読み込まれていない可能性があります。Thunder Client 側にキーを入れる必要は通常ありません。
- コンテナ内の環境変数確認:

```bash
docker compose exec front printenv | grep -Ei 'SUPABASE|GEMINI'
```

- サーバー / Next.js ログ確認:

```bash
docker compose logs -f frontend
```

- `.env` のフォーマット注意: `env_file` は通常 `KEY=value` 形式を期待します。現在の `.env` が `KEY = "value"` のようにスペースと引用符を含む場合、コンテナに渡らないことがあるため、必要であれば私が整形します。

## セキュリティ注意
- `SUPABASE_SERVICE_ROLE_KEY` は強力な権限を持つため、公開クライアント（ブラウザ）に送らないでください。サーバー側のみで利用してください。

---
更新や補足が必要であれば、実際の `docker compose` の出力や API 実行時のエラーメッセージを貼ってください。私が原因を解析して次の修正を提案します。

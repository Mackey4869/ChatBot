# API 仕様: `GET /api/blogs` と `PUT /api/ingest`

## 概要
このドキュメントは、フロントエンド内で実装されている以下のAPIの仕様を示します。

- `GET /api/blogs` — ブログ一覧取得 / 単一ブログ取得（実装: `frontend/app/api/blogs/route.ts`）
- `DELETE /api/blogs` — ブログの削除（管理者限定）（実装: `frontend/app/api/blogs/route.ts`）
- `PUT /api/ingest` — 既存ブログの更新（チャンク再生成・埋め込み再登録）（実装: `frontend/app/api/ingest/route.ts`）

---

## GET /api/blogs
- メソッド: `GET`
- パス: `/api/blogs`
- 用途: 公開ブログ一覧の取得、または `id` 指定で単一ブログを取得する。

### クエリパラメータ
- `id` (uuid) — 指定すると単一取得。返却はオブジェクト。
- `category_id` — カテゴリ絞り込み。
- `author_id` — 著者絞り込み。
- `limit` (number) — 取得件数。デフォルト `20`。
- `offset` (number) — スキップ件数。デフォルト `0`。
- `include_unpublished` (`true`|`false`) — `true` の場合は非公開記事も含める。管理者のみ有効。

### ヘッダー
- 通常: なし（公開記事取得時）
- 非公開記事を含める場合: `Authorization: Bearer <ADMIN_TOKEN>`（Supabase トークン。`users.role === 'admin'` が必要）

### レスポンス
- 成功 (一覧): `{ "data": [ { ...blog, author: {id,name}, category: {id,name} }, ... ] }`
- 成功 (単一): `{ "data": { ...blog, author: {...}, category: {...} } }`
- エラー: `{ "error": "message" }`（適切な HTTP ステータス）
- 404: `id` 指定で見つからない場合

### 補足
- 取得時は `author`（usersのid,name）と `category`（blog_categoriesのid,name）を含める。
- 管理者判定には Authorization ヘッダのトークンを `supabase.auth.getUser` で取得し、`users` テーブルの `role` を参照する。

---

## DELETE /api/blogs
- メソッド: `DELETE`
- パス: `/api/blogs`
- 用途: ブログ記事の削除。関連する `blog_sections` もカスケード削除される。管理者権限が必要。

### クエリパラメータ
- `id` (uuid) — 削除するブログのID。

### ヘッダー
- `Authorization: Bearer <ADMIN_TOKEN>` — `users.role === 'admin'` が必要。

### レスポンス
- 成功: `{ "success": true, "message": "Blog deleted successfully" }`
- 400: `id` が未指定の場合 `{ "error": "Blog ID is required" }`
- 401: 認証エラー
- 403: 権限エラー (管理者以外)
- 500: 内部エラー時

---

## PUT /api/ingest
- メソッド: `PUT`
- パス: `/api/ingest`
- 用途: 既存ブログ記事の更新。`blogs` テーブルを更新し、`blog_sections` を全削除して再生成する（簡易実装）。

### ヘッダー
- `Content-Type: application/json`
- 実装上は認証チェックが入っていないため、可能であれば `Authorization: Bearer <TOKEN>` を付ける運用を推奨。

### リクエストボディ (JSON) 例
```json
{
  "id": "11111111-2222-3333-4444-555555555555",
  "title": "更新後のタイトル",
  "content": "更新された本文。チャンク化され、埋め込みが再生成されます。",
  "category_id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "author_id": "author-uuid-here",
  "tags": ["tag1","tag2"]
}
```

### 動作詳細
1. `blogs` テーブルの該当 `id` を `update` し、`updated_at` を現在時刻で更新する。
2. 対応する `blog_sections` を全て削除（`delete().eq('blog_id', id)`）。
3. `splitText(content)` で本文をチャンク化。
4. 各チャンクを `generateEmbedding(chunk)` で埋め込み生成し、`blog_sections` に `blog_id`, `content`, `embedding` を挿入する。
5. 処理が終わったら `{ "success": true, "blog": <updatedBlog> }` を返す。

### 期待レスポンス
- 成功: `{ "success": true, "blog": { ...updatedBlog } }`
- 400: `id` が未指定の場合 `{ "error": "ID is required" }`
- 500: 内部エラー時 `{ "error": "message" }`

### 注意点
- 現在の実装は「全削除 → 再登録」方式のため、コンテンツ量が多いと処理時間が長くなる。
- 埋め込みの生成は逐次 (for-await) で呼ばれるため、並列化やバッチ挿入でパフォーマンス改善の余地あり。
- `SUPABASE` の認証・権限チェックを追加することを推奨（特に本番環境）。

---

## テスト例
- GET (一覧):
```
curl "http://localhost:3000/api/blogs?limit=10&offset=0"
```
- GET (単一):
```
curl "http://localhost:3000/api/blogs?id=<uuid>"
```
- DELETE (削除):
```
curl -X DELETE "http://localhost:3000/api/blogs?id=<uuid>" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```
- PUT (更新):
```
curl -X PUT "http://localhost:3000/api/ingest" \
  -H "Content-Type: application/json" \
  -d '{"id":"1111-...","title":"更新","content":"本文","category_id":null,"author_id":null,"tags":[]}'
```

---

ファイル実装: `frontend/app/api/blogs/route.ts`, `frontend/app/api/ingest/route.ts` を参照。

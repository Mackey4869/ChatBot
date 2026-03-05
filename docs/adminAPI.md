# Admin API 仕様

このドキュメントは、サーバー側の管理者関連 API (`/api/admin`) の仕様、利用方法、テスト手順をまとめたものです。

概要
- 管理者判定は `public.users` テーブルの `role` カラムを参照します（`'admin'` が管理者）。
- サーバー側 API は必ずクライアントから送られてきたユーザー用 `access_token` を検証し、DB上の `role` を確認してから管理操作を実行します。
- 実装ファイル: `frontend/app/api/admin/route.ts`

エンドポイント一覧

1) GET /api/admin
- 説明: 呼び出し元ユーザーの `role` を返します。クエリ `?list=true` を付けると、呼び出し元が admin の場合に管理者一覧を返します。
- ヘッダ: `Authorization: Bearer <USER_ACCESS_TOKEN>`
- レスポンス例:
  - 標準: `{ "role": "admin" }` または `{ "role": null }`
  - 管理者一覧: `{ "admins": [ { "id": "...", "name": "...", "role": "admin" }, ... ] }`

2) POST /api/admin
- 説明: 管理者付与/剥奪を行います（呼び出し元は `admin` である必要あり）。
- ヘッダ: `Authorization: Bearer <USER_ACCESS_TOKEN>`
- Body (JSON) — grant の例:
```json
{
  "action": "grant",
  "userId": "TARGET_USER_UUID"
}
```
- Body (JSON) — revoke の例:
```json
{
  "action": "revoke",
  "userId": "TARGET_USER_UUID"
}
```
- 成功時レスポンス例: `{ "ok": true, "updated": { "id": "...", "role": "admin" } }`

3) DELETE /api/admin
- 説明: 管理者剥奪（`role` を `student` に戻す）を行います（呼び出し元は `admin` である必要あり）。
- ヘッダ: `Authorization: Bearer <USER_ACCESS_TOKEN>`
- Body (JSON):
```json
{ "userId": "TARGET_USER_UUID" }
```
- 成功時レスポンス例: `{ "ok": true, "updated": { "id": "...", "role": "student" } }`

エラーコード/パターン
- 401 Unauthorized: トークンが無効または未提供
- 403 Forbidden: 呼び出し元が admin ではないのに管理操作を試みた
- 400 Bad Request: 不正なペイロード
- 500 Internal Server Error: DB 更新やトークン確認での例外

アクセストークンの取得（テスト用）
- Supabase のメール/パスワードによるログインで `access_token` を取得して利用します。例（curl）:
```bash
curl -X POST "https://<SUPABASE_URL>/auth/v1/token?grant_type=password" \
  -H "apikey: <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"your_password"}'
```
- レスポンス内の `access_token` を `Authorization: Bearer <access_token>` として API に付与してください。

Thunder Client の設定例（GUI）
- 共通ヘッダ:
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`

- GET 自分の role
  - Method: GET
  - URL: `http://localhost:3003/api/admin`

- GET 管理者一覧
  - Method: GET
  - URL: `http://localhost:3003/api/admin?list=true`

- POST grant
  - Method: POST
  - URL: `http://localhost:3003/api/admin`
  - Body JSON: 先述の grant 例

- DELETE revoke
  - Method: DELETE
  - URL: `http://localhost:3003/api/admin`
  - Body JSON: `{ "userId": "TARGET_USER_UUID" }`

簡単な curl テスト例
- 自分の role を確認:
```bash
curl -X GET http://localhost:3003/api/admin \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```
- 管理者付与:
```bash
curl -X POST http://localhost:3003/api/admin \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"action":"grant","userId":"TARGET_USER_UUID"}'
```

テスト手順（ローカル）
1. 開発サーバを起動: `pnpm dev` または `docker compose up`（プロジェクトの起動方法に従う）。
2. Supabase にテストユーザーを用意（コンソールから作成するか、`/auth/v1/token` でログインしてトークン取得）。
3. 取得した `access_token` を用いて `GET /api/admin` を実行し `role` を確認。
4. (管理者ユーザーが必要な場合) Supabase ダッシュボードや SQL で一時的にロールを付与:
```sql
UPDATE users SET role = 'admin' WHERE id = 'TARGET_USER_UUID';
```
5. `GET /api/admin?list=true` や `POST /api/admin` を実行して操作を検証。
6. 操作後、DB上の `users` 行が期待通り更新されているか確認する。

セキュリティ注意事項
- `SUPABASE_SERVICE_ROLE_KEY` はサーバーのみに保持し、クライアントへ絶対に渡さないこと。
- フロント側で `isAdmin` を表示しても、それだけでは権限の有無を保証しない。必ずサーバー側で権限を検証すること。
- 管理操作は監査ログ（別テーブル）に記録することを推奨します。

補足: `chat` エンドポイントとの関係
- 管理 API は `chat` (`/api/chat`) とは独立していますが、管理者は `chat` の動作に影響するコンテンツ管理（ブログやセクションの更新）を行える想定です。必要なら管理 API から更にコンテンツ管理用のエンドポイントを追加してください。

---
ファイル: `frontend/app/api/admin/route.ts`

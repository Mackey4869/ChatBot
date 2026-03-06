# 開発メモ / Setup & 注意事項

このファイルはローカル開発やコンテナでの起動時に必要な `.env` の配置場所、重要な注意点、確認コマンド、起動手順をまとめたものです。

**目次**
- `.env` の配置と役割
- フロントエンド / サーバー用クライアントの使い分け
- Docker / コンテナでの注意点
- 動作確認コマンド
- 再起動とキャッシュクリア

---

**.env の配置と役割**

- ルート（プロジェクト直下）`.env`
	- ここは**サーバー専用/管理者用の秘密情報**（例: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD`）を置くために想定しています。
	- このファイルはサーバー（ローカルや CI、デプロイ先）のみで保護して管理してください。フロントエンドのビルドやブラウザに渡してはいけません。

- `frontend/.env`
	- フロントエンドが参照する公開環境変数（`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`NEXT_PUBLIC_SUPABASE_DEBUG` など）を置きます。
	- このファイルはフロント用の設定で、**公開キーのみ**を含めてください（サービスロールキーは絶対に入れない）。

注意：`NEXT_PUBLIC_` プレフィックスが付く環境変数はビルド時にクライアントバンドルに埋め込まれます。

---

**フロントエンド / サーバー用クライアントの使い分け**

- `frontend/lib/supabase.ts`
	- ブラウザ専用クライアントです。`NEXT_PUBLIC_SUPABASE_ANON_KEY` のみ参照します。
	- クライアントでの `auth`（サインイン/サインアウト/セッション監視）に使ってください。

- `frontend/lib/supabase.server.ts`
	- サーバー専用クライアントです。`SUPABASE_SERVICE_ROLE_KEY` または `SUPABASE_ACCESS_TOKEN` を参照し、DB の書き込み・管理操作・RPC 呼び出し等に利用します。
	- サーバー側の API（`/api/*`）やバックエンドコードからのみ読み込んでください。

必ずサーバー側コードで `frontend/lib/supabase.server.ts` を使い、クライアント側（React コンポーネント等）では `frontend/lib/supabase.ts` を使用すること。

---

**Docker / コンテナでの注意点**

- `docker-compose.yml` の `env_file` を確認し、フロントサービスには `./frontend/.env` を指定してください。ルートの `.env` にサービスロールキーがある場合でも、**フロントのコンテナにそれを渡さない**設定が必須です。
- コンテナ起動時に環境変数が正しく渡っているか確認してください（以下の `printenv` コマンド参照）。

---

**動作確認コマンド（ローカル）**

- フロントにサービスロールキーが紛れ込んでいないか確認:
```bash
rg "SUPABASE_SERVICE_ROLE_KEY" -n frontend || true
```

- ビルド成果物や `.next` に古いキーが埋め込まれていないか確認（キーワードで検索）:
```bash
rg "m65HeDq3CkGDb4LhRTDBjlwL3lGxMcpZAj1-v0MkmVk" -n || true
```

- コンテナ内の環境変数確認（フロントコンテナ）:
```bash
docker compose exec front printenv | rg -i 'SUPABASE|GEMINI' || true
```

---

**起動 / 再起動手順（推奨）**

- ローカル（Next.js を直接使う場合）:
```bash
cd frontend
npm install
npm run dev
```

- Docker を使う場合（フロントのみ）:
```bash
# 停止・クリア・再ビルド
docker compose down
rm -rf frontend/.next
docker compose up --build -d
docker compose logs -f front
```

重要: 開発中に `lib/supabase.ts` を修正した場合、`.next`（ビルドキャッシュ）を削除してから再起動すると古いバンドルが残っている問題を回避できます。

---

**デバッグとトラブルシューティング**

- エラー例: `createClient はクライアント側からのみ呼び出してください。` が出る場合
	- 原因: サーバー実行（SSR や API）で `createClient()` を誤って呼び出している。サーバー側では `createServerClient()`（`supabase.server.ts`）を使っているか確認してください。

- エラー例: フロントに「サービスロールキーが見える」やビルドにキーが埋め込まれている場合
	- 対処: `frontend/.env` を確認し、サービスロールキーが含まれていないか削除。`rm -rf frontend/.next` の後に再ビルド。

---

**CI / デプロイ時の運用メモ**

- サービスロールキーは必ずデプロイ環境のシークレット管理に入れてください（例: GitHub Secrets、GCP Secret Manager、AWS Secrets Manager、Docker Swarm secret 等）。
- CI ではルートの `.env` をコミットしないこと。`.env` は .gitignore に入れてローカルのみ管理してください。

---

必要があれば、このファイルに `httpOnly cookie` を使ったセッション化の設計例や、CI 用の環境変数マトリクス（staging/production）テンプレートも追加します。どちらを追加しますか？

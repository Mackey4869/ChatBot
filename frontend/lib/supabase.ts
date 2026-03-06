/**
 * Supabase クライアント設定
 */
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID;

const SUPABASE_URL =
	process.env.NEXT_PUBLIC_SUPABASE_URL ||
	process.env.SUPABASE_URL ||
	(SUPABASE_PROJECT_ID ? `https://${SUPABASE_PROJECT_ID}.supabase.co` : undefined);

// 【重要】SERVICE_ROLE_KEY または ANON_KEY を優先するように順番を変更
const SUPABASE_KEY =
	process.env.SUPABASE_SERVICE_ROLE_KEY ||
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
	process.env.SUPABASE_ACCESS_TOKEN;

export function createClient(): SupabaseClient {
	if (!SUPABASE_URL || !SUPABASE_KEY) {
		throw new Error(
			'Supabase 環境変数が設定されていません。NEXT_PUBLIC_SUPABASE_URL とキーを確認してください。'
		);
	}

	// ログは必要な場合のみ出す（開発時でもコンソールを汚さないよう制御）
	// デバッグログは明示的に `NEXT_PUBLIC_SUPABASE_DEBUG=true` のときのみ有効化する
	const enableDebug = (typeof window !== 'undefined') && process.env.NEXT_PUBLIC_SUPABASE_DEBUG === 'true';
	if (enableDebug) {
		console.debug('Supabase クライアントを初期化します。URL:', SUPABASE_URL);
	}

	// クライアント（ブラウザ）実行時はセッションを永続化する
	const isBrowser = typeof window !== 'undefined';

	// シングルトン化: 複数インスタンスができるとイベントの重複やログ増加を招く
	// module スコープで一度だけ作る
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	if ((globalThis as any).__supabase_client) {
		return (globalThis as any).__supabase_client as SupabaseClient;
	}

	const client = createSupabaseClient(SUPABASE_URL, SUPABASE_KEY, {
		auth: {
			persistSession: isBrowser, // ブラウザでは true にして localStorage に保持
		},
	});

	// store globally so multiple imports reuse the same instance
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	(globalThis as any).__supabase_client = client;

	return client;
}
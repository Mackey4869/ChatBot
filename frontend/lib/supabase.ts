/**
 * Supabase クライアント設定
 */
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_PROJECT_ID = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || process.env.SUPABASE_PROJECT_ID;

const SUPABASE_URL =
	process.env.NEXT_PUBLIC_SUPABASE_URL ||
	process.env.SUPABASE_URL ||
	(SUPABASE_PROJECT_ID ? `https://${SUPABASE_PROJECT_ID}.supabase.co` : undefined);

// クライアント（ブラウザ）専用の Supabase クライアントを返します。
// 重要: ブラウザバンドルにサーバー専用のシークレットを含めないよう、
// ここでは公開キー（NEXT_PUBLIC_SUPABASE_ANON_KEY）のみを使用します。
export function createClient(): SupabaseClient {
	const isBrowser = typeof window !== 'undefined';

	if (!isBrowser) {
		throw new Error('createClient はクライアント側からのみ呼び出してください。サーバーでは createServerClient を使用してください。');
	}

	if (!SUPABASE_URL) {
		throw new Error('Supabase URL が設定されていません。NEXT_PUBLIC_SUPABASE_URL を確認してください。');
	}

	const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	if (!anonKey) {
		throw new Error('公開用 Supabase キーが設定されていません。NEXT_PUBLIC_SUPABASE_ANON_KEY を確認してください。');
	}

	const enableDebug = process.env.NEXT_PUBLIC_SUPABASE_DEBUG === 'true';
	if (enableDebug) {
		console.debug('Supabase (client) を初期化します。URL:', SUPABASE_URL);
	}

	// シングルトン化
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	if ((globalThis as any).__supabase_client) {
		return (globalThis as any).__supabase_client as SupabaseClient;
	}

	const client = createSupabaseClient(SUPABASE_URL, anonKey, {
		auth: {
			persistSession: true,
		},
	});

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	(globalThis as any).__supabase_client = client;

	return client;
}
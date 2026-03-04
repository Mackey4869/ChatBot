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
    
	// 開発時に確認しやすいようログを出す（本番時は消してOK）
	console.log('Supabase クライアントを初期化します。URL:', SUPABASE_URL);

	return createSupabaseClient(SUPABASE_URL, SUPABASE_KEY, {
		auth: { persistSession: false },
	});
}
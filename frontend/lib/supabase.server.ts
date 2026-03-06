/**
 * Server-only Supabase client.
 *
 * このファイルはサーバー実行環境でのみ読み込むことを想定しています。
 * サービスロールキーなどの機密情報はここでのみ参照してください。
 */
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID;

const SUPABASE_URL =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    (SUPABASE_PROJECT_ID ? `https://${SUPABASE_PROJECT_ID}.supabase.co` : undefined);

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_URL) {
    throw new Error('Server Supabase: SUPABASE_URL が設定されていません。');
}

if (!serviceKey) {
    throw new Error('Server Supabase: SUPABASE_SERVICE_ROLE_KEY または SUPABASE_ACCESS_TOKEN が設定されていません。');
}

// サーバー側は別名でシングルトン化
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (!(globalThis as any).__supabase_server_client) {
    // persistSession はサーバー側では不要
    const client = createSupabaseClient(SUPABASE_URL, serviceKey, {
        auth: { persistSession: false },
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (globalThis as any).__supabase_server_client = client;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const createServerClient = (): SupabaseClient => (globalThis as any).__supabase_server_client as SupabaseClient;

export default createServerClient;

/**
 * Server-only Supabase client.
 *
 * このファイルはサーバー実行環境でのみ読み込むことを想定しています。
 * サービスロールキーなどの機密情報はここでのみ参照してください。
 */
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';

// 開発環境で root の .env をコンテナ内にマウントしている場合、
// ここで限定的に読み込んで process.env に反映します（クライアント側には露出しません）。
try {
    const secretPath = '/run/secrets/root_env';
    if (fs.existsSync(secretPath)) {
        const envContent = fs.readFileSync(secretPath, 'utf8');
        envContent.split(/\r?\n/).forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const match = trimmed.match(/^([^=]+)=(.*)$/);
            if (!match) return;
            const key = match[1].trim();
            let val = match[2].trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            if (process.env[key] === undefined) process.env[key] = val;
        });
    }
} catch (e) {
    // 読み込み失敗は無視（dotenv を必須にしない）
}

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

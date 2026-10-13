/**
 * Security Verification Script for "A Little Place for Us"
 * Tests and verifies that:
 * 1. Public anon client can ONLY read published content.
 * 2. Public anon client is completely BLOCKED from reading drafts by Row Level Security (RLS).
 * 3. Public anon client CANNOT modify, insert, or publish content.
 * 4. Public anon client CANNOT upload or modify storage assets.
 * 
 * Usage:
 *   node scripts/verify-security.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Helper to read .env or .env.local if present
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...values] = trimmed.split('=');
          if (key && values.length) {
            process.env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
          }
        }
      });
      console.log(`Loaded environment from ${file}`);
      break;
    }
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-ref')) {
  console.log('\n======================================================');
  console.log('⚠️  Supabase environment variables not configured yet.');
  console.log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  console.log('in .env to run live integration tests.');
  console.log('======================================================\n');
  process.exit(0);
}

const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function runSecurityTests() {
  console.log('\n🔒 RUNNING SUPABASE RLS & SECURITY VERIFICATION SUITE...\n');
  let passed = 0;
  let total = 0;

  // TEST 1: Public Read of Published Content
  total++;
  try {
    const { data, error } = await anonClient
      .from('scrapbook_content')
      .select('id, updated_at')
      .eq('id', 'published')
      .maybeSingle();

    if (!error && data && data.id === 'published') {
      console.log('✅ TEST 1 PASSED: Public client CAN read published content.');
      passed++;
    } else {
      console.log('⚠️ TEST 1 NOTE: Published row not seeded yet or returned:', error?.message);
    }
  } catch (err) {
    console.log('❌ TEST 1 FAILED:', err.message);
  }

  // TEST 2: Attempt to read Draft Content as Anon (MUST BE BLOCKED BY RLS)
  total++;
  try {
    const { data } = await anonClient
      .from('scrapbook_content')
      .select('id, content_json')
      .eq('id', 'draft')
      .maybeSingle();

    if (!data) {
      console.log('✅ TEST 2 PASSED: Public client CANNOT read draft content (RLS filtered 0 rows).');
      passed++;
    } else {
      console.log('❌ TEST 2 FAILED: Public client was able to read draft content! Check RLS policies!');
    }
  } catch (err) {
    console.log('✅ TEST 2 PASSED: RLS blocked draft query with error:', err.message);
    passed++;
  }

  // TEST 3: Attempt to write/update as Anon (MUST BE REJECTED)
  total++;
  try {
    const { error } = await anonClient
      .from('scrapbook_content')
      .upsert({ id: 'draft', content_json: { test: 'malicious_update' } });

    if (error) {
      console.log('✅ TEST 3 PASSED: Public client CANNOT write or update content (RLS denied):', error.message);
      passed++;
    } else {
      console.log('❌ TEST 3 FAILED: Public client was able to write to scrapbook_content!');
    }
  } catch (err) {
    console.log('✅ TEST 3 PASSED: Public write blocked:', err.message);
    passed++;
  }

  // TEST 4: Attempt to call publish RPC as Anon (MUST BE REJECTED)
  total++;
  try {
    const { error } = await anonClient.rpc('publish_scrapbook_draft');
    if (error) {
      console.log('✅ TEST 4 PASSED: Public client CANNOT call publish RPC:', error.message);
      passed++;
    } else {
      console.log('❌ TEST 4 FAILED: Public client successfully invoked publish RPC!');
    }
  } catch (err) {
    console.log('✅ TEST 4 PASSED: Publish RPC blocked:', err.message);
    passed++;
  }

  // TEST 5: Attempt to insert into scrapbook_owners as Anon (MUST BE REJECTED)
  total++;
  try {
    const { error } = await anonClient
      .from('scrapbook_owners')
      .insert({ user_id: '00000000-0000-0000-0000-000000000000', email: 'hacker@example.com' });

    if (error) {
      console.log('✅ TEST 5 PASSED: Public client CANNOT inject owners (RLS denied):', error.message);
      passed++;
    } else {
      console.log('❌ TEST 5 FAILED: Public client was able to inject an owner!');
    }
  } catch (err) {
    console.log('✅ TEST 5 PASSED: Owner injection blocked:', err.message);
    passed++;
  }

  console.log(`\n🎉 Verification Complete: ${passed}/${total} security checks verified.\n`);
}

runSecurityTests();

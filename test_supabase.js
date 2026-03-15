const { createClient } = require('@supabase/supabase-js');
const url = 'https://ytvxkmdpfklyadxkjmpf.supabase.co';
const key = 'sb_publishable_WvKlOWQY8G2re2n8EeTv_g_dbreLQV_';
const supabase = createClient(url, key);
async function run() {
  const { data, error } = await supabase.from('applications').select('*');
  console.log('1. Base query -> data:', data?.length, 'error:', error);
  const { data: d2, error: e2 } = await supabase.from('applications').select('*, users(full_name, phone, occupation)');
  console.log('2. Join users -> data:', d2?.length, 'error:', e2);
}
run();

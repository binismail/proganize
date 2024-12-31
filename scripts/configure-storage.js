const { createClient } = require('@supabase/supabase-js');

// Get these values from your environment variables or .env file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function configureBucketCORS() {
  try {
    console.log('Configuring CORS rules for pdf-documents bucket...');
    
    const { data, error } = await supabase.storage.updateBucket('pdf-documents', {
      public: false,
      allowedMimeTypes: ['application/pdf'],
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      cors_rules: [{
        allowed_origins: ['*'],
        allowed_methods: ['GET', 'HEAD'],
        allowed_headers: ['*'],
        exposed_headers: [],
        max_age_seconds: 3600
      }]
    });

    if (error) {
      console.error('Error configuring bucket CORS:', error);
      return { success: false, error };
    }

    console.log('Successfully configured CORS rules');
    return { success: true, data };
  } catch (error) {
    console.error('Error configuring bucket CORS:', error);
    return { success: false, error };
  }
}

configureBucketCORS().catch(console.error);

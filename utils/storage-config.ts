const { supabase } = require('./supabase/instance');
const { STORAGE_CONSTANTS } = require('./constants');

async function configureBucketCORS() {
  try {
    const { data, error } = await supabase.storage.updateBucket(STORAGE_CONSTANTS.BUCKET_NAME, {
      public: false,
      allowedMimeTypes: ['application/pdf'],
      fileSizeLimit: STORAGE_CONSTANTS.MAX_FILE_SIZE,
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

    return { success: true, data };
  } catch (error) {
    console.error('Error configuring bucket CORS:', error);
    return { success: false, error };
  }
}

module.exports = { configureBucketCORS };

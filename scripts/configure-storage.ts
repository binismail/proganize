const { configureBucketCORS } = require('../utils/storage-config');

async function main() {
  console.log('Configuring storage bucket CORS rules...');
  const result = await configureBucketCORS();
  
  if (result.success) {
    console.log('Successfully configured storage bucket CORS rules');
  } else {
    console.error('Failed to configure storage bucket CORS rules:', result.error);
    process.exit(1);
  }
}

main().catch(console.error);

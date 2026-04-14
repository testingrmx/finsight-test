import 'dotenv/config';
import app from './app.js';
import mongoose from 'mongoose';

const PORT = parseInt(process.env.PORT) || 5001;
const MONGO = process.env.MONGODB_URI;

if (!MONGO) {
  console.error('\n========================================');
  console.error('ERROR: MONGODB_URI is not set.');
  console.error('Add it in Render → Environment Variables.');
  console.error('========================================\n');
  process.exit(1);
}

if (
  MONGO.includes('YOUR_USERNAME') ||
  MONGO.includes('xxxxx') ||
  MONGO.includes('<user>') ||
  MONGO.includes('<pass>')
) {
  console.error('\n========================================');
  console.error('ERROR: MONGODB_URI still has placeholder values.');
  console.error('Replace with your real Atlas connection string.');
  console.error('========================================\n');
  process.exit(1);
}

mongoose.connect(MONGO)
  .then(() => {
    console.log('MongoDB connected.');
    app.listen(PORT, () => console.log('Server running on port ' + PORT));
  })
  .catch(e => {
    console.error('MongoDB connection failed:', e.message);
    process.exit(1);
  });

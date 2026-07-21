require('dotenv').config();
const { connectDatabase, disconnectDatabase } = require('./config/db');
const Chapter = require('./models/Chapter');

(async () => {
  try {
    await connectDatabase();
    const chapters = await Chapter.find({}).select('name city isActive totalMembers');
    console.log(JSON.stringify(chapters, null, 2));
  } catch (e) {
    console.error('ERROR', e.message);
  } finally {
    await disconnectDatabase();
    process.exit(0);
  }
})();

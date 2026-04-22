const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // Ensure complaintId unique index is removed to allow per-student sequences.
    // This handles existing unique index left over from earlier schema.
    const db = mongoose.connection.db;
    try {
      const indexes = await db.collection('complaints').indexes();
      const hasComplaintIdIndex = indexes.some(i => i.name === 'complaintId_1' && i.unique);
      if (hasComplaintIdIndex) {
        await db.collection('complaints').dropIndex('complaintId_1');
        console.log('Dropped unique index complaintId_1 to allow per-student complaint IDs');
      }
    } catch (err) {
      // ignore if collection doesn't exist yet or index missing
    }
  } catch (error) {
    console.error("Mongo Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

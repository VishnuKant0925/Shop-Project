import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pandit_mill';
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout for connection attempt
    });
    console.log(`[MongoDB Connected] Host: ${conn.connection.host}, Database: ${conn.connection.name}`);
  } catch (error: any) {
    console.warn(`[MongoDB Notice] Database connection could not be established immediately: ${error.message}`);
    console.warn(`Note: You can update MONGODB_URI in backend/.env with your MongoDB Atlas connection string at any time.`);
  }
};

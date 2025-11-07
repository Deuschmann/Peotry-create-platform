const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // ！！！请确保这里的连接字符串是您自己的！！！
    const mongoURI = 'mongodb+srv://junzhema18_db_user:yessw12345@cluster0.1k5mnes.mongodb.net/?appName=Cluster0';
    
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const app = express();

// 连接数据库
connectDB();

// 初始化中间件
app.use(cors());
app.use(express.json({ extended: false }));

// 路由定义区域
app.use('/api', require('./routes/api'));
app.use('/api/private', require('./routes/private'));

// 默认根路由
app.get('/', (req, res) => res.send('Poetry API Running'));

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
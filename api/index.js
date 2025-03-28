const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadMiddleware = multer({ storage: storage });

const salt = bcrypt.genSaltSync(10);
const secret = process.env.JWT_SECRET || 'asdfe45we45w345wegw345werjktjwertkj';

app.use(cors({
  credentials: true,
  origin: ['http://localhost:5174', 'http://localhost:3000', 'http://localhost:5173']
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.post('/register', async (req,res) => {
  const {username,password} = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const existingUser = await User.findOne({username});
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    const userDoc = await User.create({
      username,
      password:bcrypt.hashSync(password,salt),
    });
    res.json(userDoc);
  } catch(e) {
    console.log(e);
    res.status(400).json({ error: e.message });
  }
});

app.post('/login', async (req,res) => {
  const {username,password} = req.body;
  const userDoc = await User.findOne({username});
  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    // logged in
    jwt.sign({username,id:userDoc._id}, secret, {}, (err,token) => {
      if (err) throw err;
      res.cookie('token', token).json({
        id:userDoc._id,
        username,
      });
    });
  } else {
    res.status(400).json('wrong credentials');
  }
});

app.get('/profile', (req,res) => {
  const {token} = req.cookies;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  jwt.verify(token, secret, {}, (err,info) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.json(info);
  });
});

app.post('/logout', (req,res) => {
  res.cookie('token', '').json('ok');
});

app.post('/post', uploadMiddleware.single('file'), async (req,res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async (err,info) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      const {title,summary,content} = req.body;
      const postDoc = await Post.create({
        title,
        summary,
        content,
        cover: req.file.filename, // Store only the filename
        author:info.id,
      });
      res.json(postDoc);
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

app.put('/post', uploadMiddleware.single('file'), async (req,res) => {
  try {
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async (err,info) => {
      if (err) throw err;
      const {id,title,summary,content} = req.body;
      const postDoc = await Post.findById(id);
      const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
      if (!isAuthor) {
        return res.status(400).json('you are not the author');
      }

      let cover = postDoc.cover;
      if (req.file) {
        // Delete old file if it exists
        if (postDoc.cover) {
          const oldFilePath = path.join(uploadsDir, postDoc.cover);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        cover = req.file.filename;
      }

      await postDoc.update({
        title,
        summary,
        content,
        cover,
      });

      res.json(postDoc);
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

app.get('/post', async (req,res) => {
  try {
    const posts = await Post.find()
      .populate('author', ['username'])
      .sort({createdAt: -1})
      .limit(20);
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

app.get('/post/:id', async (req, res) => {
  const {id} = req.params;
  const postDoc = await Post.findById(id).populate('author', ['username']);
  const comments = await Comment.find({ post: id })
    .populate('author', ['username'])
    .sort({ createdAt: -1 });
  res.json({ ...postDoc.toObject(), comments });
});

// Add comment endpoints
app.post('/comment', async (req, res) => {
  const {token} = req.cookies;
  const {postId, content} = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  try {
    const userInfo = await new Promise((resolve, reject) => {
      jwt.verify(token, secret, {}, (err, info) => {
        if (err) reject(err);
        resolve(info);
      });
    });

    const commentDoc = await Comment.create({
      content,
      author: userInfo.id,
      post: postId,
    });

    const populatedComment = await Comment.findById(commentDoc._id)
      .populate('author', ['username']);

    res.json(populatedComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

app.get('/post/:id/comments', async (req, res) => {
  const {id} = req.params;
  try {
    const comments = await Comment.find({ post: id })
      .populate('author', ['username'])
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
//
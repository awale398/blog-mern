const mongoose = require('mongoose');
const Post = require('./models/Post');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

async function fixPaths() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const posts = await Post.find();
    console.log(`Found ${posts.length} posts to fix`);

    for (const post of posts) {
      if (post.cover) {
        // Extract just the filename
        const filename = path.basename(post.cover);
        
        // Check if the file exists in the uploads directory
        const filePath = path.join(__dirname, 'uploads', filename);
        if (!fs.existsSync(filePath)) {
          console.log(`Warning: File not found: ${filename}`);
          continue;
        }

        console.log(`Fixing post ${post._id}:`);
        console.log(`  Original path: ${post.cover}`);
        console.log(`  New filename: ${filename}`);
        
        post.cover = filename;
        await post.save();
      }
    }

    // Clean up any orphaned files in the uploads directory
    const uploadsDir = path.join(__dirname, 'uploads');
    const files = fs.readdirSync(uploadsDir);
    const postCovers = (await Post.find()).map(post => post.cover);
    
    for (const file of files) {
      if (!postCovers.includes(file)) {
        const filePath = path.join(uploadsDir, file);
        fs.unlinkSync(filePath);
        console.log(`Deleted orphaned file: ${file}`);
      }
    }

    console.log('All posts fixed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing paths:', error);
    process.exit(1);
  }
}

fixPaths(); 
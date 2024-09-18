import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, update } from 'firebase/database';
import express from 'express';
import bodyParser from 'body-parser';

// Firebase Configuration
const firebaseConfig = {
    databaseURL: 'https://geproject-ad1e8-default-rtdb.asia-southeast1.firebasedatabase.app/',
};

const app_database = initializeApp(firebaseConfig);
const db = getDatabase(app_database);

// Initialize Express App
const app_node = express();
const port = 3001;

// Middleware
app_node.use(bodyParser.json());
app_node.use(bodyParser.urlencoded({ extended: true }));

// Like/unlike a post
app_node.post('/api/like-post/:postId', async (req, res) => {
    const { postId } = req.params;
    const { liked } = req.body;
    const userId = req.headers['user-id']; // Assume user ID is sent in headers

    try {
        const postRef = ref(db, `posts/${postId}`);
        const snapshot = await get(postRef);

        if (!snapshot.exists()) {
            return res.status(404).json({
                RespCode: 404,
                RespMessage: 'Post not found',
            });
        }

        const post = snapshot.val();
        const likedUsers = post.likedUsers || [];

        if (liked) {
            if (!likedUsers.includes(userId)) {
                likedUsers.push(userId);
            }
        } else {
            const index = likedUsers.indexOf(userId);
            if (index > -1) {
                likedUsers.splice(index, 1);
            }
        }

        await update(postRef, { likedUsers });
        return res.status(200).json({
            RespCode: 200,
            RespMessage: 'Like status updated',
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            RespCode: 500,
            RespMessage: err.message,
        });
    }
});

// Get liked status for a specific user
app_node.get('/api/get-liked-posts', async (req, res) => {
    const userId = req.headers['user-id']; // Assume user ID is sent in headers

    try {
        const snapshot = await get(ref(db, 'posts'));
        const likedPosts = {};

        snapshot.forEach(postSnapshot => {
            const postId = postSnapshot.key;
            const post = postSnapshot.val();
            likedPosts[postId] = post.likedUsers && post.likedUsers.includes(userId);
        });

        res.json(likedPosts);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            RespCode: 500,
            RespMessage: err.message,
        });
    }
});

app_node.listen(port, () => {
    console.log(`Server is running on port : ${port}`);
});

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Models
const userModel = require('./models/user');
const postModel = require('./models/post');

const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'socialsecretkey123';

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/dataaso')
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Middlewares
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/uploads');
    },
    filename: function (req, file, cb) {
        // Generate a random unique name while preserving the original file extension
        crypto.randomBytes(12, function (err, bytes) {
            const uniqueName = bytes.toString('hex') + path.extname(file.originalname);
            cb(null, uniqueName);
        });
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Authentication Guard Middleware
function isLoggedIn(req, res, next) {
    if (!req.cookies.token) {
        return res.redirect('/login');
    }
    try {
        const decoded = jwt.verify(req.cookies.token, JWT_SECRET);
        req.user = decoded; // { email, userid }
        next();
    } catch (err) {
        res.clearCookie('token');
        return res.redirect('/login');
    }
}

// ------------------- ROUTES -------------------

// Home Page: Register
app.get('/', (req, res) => {
    if (req.cookies.token) {
        try {
            jwt.verify(req.cookies.token, JWT_SECRET);
            return res.redirect('/feed');
        } catch (e) {
            res.clearCookie('token');
        }
    }
    res.render('index', { error: null });
});

// Login Page
app.get('/login', (req, res) => {
    if (req.cookies.token) {
        try {
            jwt.verify(req.cookies.token, JWT_SECRET);
            return res.redirect('/feed');
        } catch (e) {
            res.clearCookie('token');
        }
    }
    res.render('login', { error: null });
});

// Register User
app.post('/register', async (req, res) => {
    try {
        const { name, username, email, age, password } = req.body;

        if (!name || !username || !email || !password) {
            return res.render('index', { error: 'Please fill in all required fields' });
        }

        const existingUser = await userModel.findOne({
            $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
        });

        if (existingUser) {
            return res.render('index', { error: 'Username or email already registered' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await userModel.create({
            name,
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            age: age || null,
            password: hashedPassword,
            profilePic: 'default-avatar.svg'
        });

        const token = jwt.sign({ email: newUser.email, userid: newUser._id }, JWT_SECRET);
        res.cookie('token', token, { httpOnly: true });
        res.redirect('/feed');
    } catch (err) {
        console.error(err);
        res.render('index', { error: 'Registration failed. Please try again.' });
    }
});

// Login User
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        const token = jwt.sign({ email: user.email, userid: user._id }, JWT_SECRET);
        res.cookie('token', token, { httpOnly: true });
        res.redirect('/feed');
    } catch (err) {
        console.error(err);
        res.render('login', { error: 'Login failed. Please try again.' });
    }
});

// Logout
app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

// Social Feed (View all posts from all users)
app.get('/feed', isLoggedIn, async (req, res) => {
    try {
        const currentUser = await userModel.findById(req.user.userid);
        const posts = await postModel.find()
            .populate('user')
            .sort({ date: -1 });

        res.render('feed', { posts, user: currentUser });
    } catch (err) {
        console.error(err);
        res.status(500).send('Unable to load feed');
    }
});

// User Profile (View personal posts & details)
app.get('/profile', isLoggedIn, async (req, res) => {
    try {
        const user = await userModel.findById(req.user.userid).populate('posts');
        if (!user) return res.redirect('/login');

        // Sort personal posts newest first
        if (user.posts && user.posts.length > 0) {
            user.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        res.render('profile', { user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Unable to load profile');
    }
});

// Update Profile Picture (Multer upload)
app.post('/profile/upload-pic', isLoggedIn, upload.single('profilePic'), async (req, res) => {
    try {
        if (req.file) {
            await userModel.findByIdAndUpdate(req.user.userid, {
                profilePic: req.file.filename
            });
        }
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        res.redirect('/profile');
    }
});

// Create Post (Text + Optional Image with Multer)
app.post('/post', isLoggedIn, upload.single('image'), async (req, res) => {
    try {
        const { content } = req.body;
        const imageFilename = req.file ? req.file.filename : '';

        // If post is completely empty (no text and no image), ignore
        if (!content && !imageFilename) {
            return res.redirect(req.headers.referer || '/feed');
        }

        const newPost = await postModel.create({
            user: req.user.userid,
            content: content || '',
            image: imageFilename
        });

        const user = await userModel.findById(req.user.userid);
        user.posts.push(newPost._id);
        await user.save();

        res.redirect(req.headers.referer || '/feed');
    } catch (err) {
        console.error(err);
        res.redirect(req.headers.referer || '/feed');
    }
});

// Like / Unlike Post
app.get('/like/:id', isLoggedIn, async (req, res) => {
    try {
        const post = await postModel.findById(req.params.id);
        if (!post) return res.status(404).send('Post not found');

        const userId = req.user.userid;
        const alreadyLiked = post.likes.some(id => id.toString() === userId.toString());

        if (alreadyLiked) {
            post.likes.pull(userId);
        } else {
            post.likes.push(userId);
        }

        await post.save();
        res.redirect(req.headers.referer || '/feed');
    } catch (err) {
        console.error(err);
        res.redirect(req.headers.referer || '/feed');
    }
});

// Edit Post Page
app.get('/edit/:id', isLoggedIn, async (req, res) => {
    try {
        const post = await postModel.findById(req.params.id);
        const user = await userModel.findById(req.user.userid);

        if (!post) return res.status(404).send('Post not found');

        // Authorization check: only post creator can view edit page
        if (post.user.toString() !== req.user.userid.toString()) {
            return res.status(403).send('Unauthorized: You can only edit your own posts');
        }

        res.render('edit', { post, user });
    } catch (err) {
        console.error(err);
        res.redirect('/profile');
    }
});

// Update Post Action
app.post('/update/:id', isLoggedIn, async (req, res) => {
    try {
        const post = await postModel.findById(req.params.id);
        if (!post) return res.status(404).send('Post not found');

        // Authorization check
        if (post.user.toString() !== req.user.userid.toString()) {
            return res.status(403).send('Unauthorized: You can only edit your own posts');
        }

        post.content = req.body.content;
        await post.save();
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        res.redirect('/profile');
    }
});

// Delete Post Action
app.get('/delete/:id', isLoggedIn, async (req, res) => {
    try {
        const post = await postModel.findById(req.params.id);
        if (!post) return res.status(404).send('Post not found');

        // Authorization check
        if (post.user.toString() !== req.user.userid.toString()) {
            return res.status(403).send('Unauthorized: You can only delete your own posts');
        }

        // Pull post ID from author's posts array
        await userModel.findByIdAndUpdate(req.user.userid, {
            $pull: { posts: post._id }
        });

        // Delete the post document
        await postModel.findByIdAndDelete(req.params.id);

        res.redirect(req.headers.referer || '/profile');
    } catch (err) {
        console.error(err);
        res.redirect(req.headers.referer || '/profile');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

<div align="center">

  <h1>🌐 SocialHub</h1>
  <p><strong>A Full-Stack Social Networking Web Application built with Node.js, Express, MongoDB, and EJS.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="NodeJS" />
    <img src="https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Multer-File%20Uploads-FF6F00?style=for-the-badge" alt="Multer" />
    <img src="https://img.shields.io/badge/TailwindCSS-Dark%20Mode-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/JWT-Authentication-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  </p>

  <p>
    <a href="#-features">Features</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-project-architecture">Architecture</a> •
    <a href="#-api-endpoints">API Routes</a> •
    <a href="#-installation--setup">Getting Started</a> •
    <a href="#-interview-talking-points">Key Highlights</a>
  </p>

</div>

---

## 📖 About the Project

**SocialHub** is a responsive, full-stack social networking application created to demonstrate core backend engineering concepts. It covers user authentication, relational database modeling using Mongoose, multipart form file uploads using **Multer**, and strict authorization controls, all wrapped in a sleek, mobile-friendly dark UI styled with Tailwind CSS.

---

## 🚀 Features

### 🔐 Authentication & Route Protection
- **Secure Registration & Login**: User passwords salted and encrypted using `bcrypt`.
- **Stateless Session Management**: Authentication handled via **JSON Web Tokens (JWT)** stored in secure HTTP-only cookies.
- **Route Guard Middleware**: Custom `isLoggedIn` middleware that protects authenticated routes and gracefully redirects unauthorized traffic.

### 📸 File Uploads with Multer
- **Profile Picture Uploads**: Users can upload and update their profile avatar from their profile page.
- **Image Posts**: Users can share status updates containing text, attached images, or both.
- **Disk Storage Strategy**: Uploaded files are hashed with `crypto.randomBytes` to prevent file collisions and stored locally in `public/images/uploads`.

### 🌐 Social Feed & Interactions
- **Global Social Feed (`/feed`)**: Displays posts from all users with creator information, avatars, and timestamps.
- **Dynamic Like System**: Toggle likes on posts with live like counts.
- **Personal Profile (`/profile`)**: Manage your personal information, profile photo, and view a stream of your authored posts.

### 🛡️ Full CRUD with Ownership Authorization
- **Create**: Publish posts with text and optional images.
- **Read**: Fetch posts with associated author data using Mongoose relational `.populate()`.
- **Update**: Edit post text with strict backend ownership verification (users cannot edit posts created by others).
- **Delete**: Delete posts with automatic cleanup from the user's `posts` array in MongoDB.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Runtime Environment** | Node.js |
| **Web Framework** | Express.js (v5) |
| **Database & ODM** | MongoDB with Mongoose |
| **File Handling** | Multer |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcrypt`, `cookie-parser` |
| **Templating Engine** | EJS (Embedded JavaScript) |
| **Styling** | Tailwind CSS (Responsive Dark Mode) |

---

## 📐 Project Architecture & Data Flow

```text
               ┌────────────────────────────────────────────────────────┐
               │                        Browser                         │
               │            (Tailwind UI + EJS Templates)               │
               └───────────────────────────┬────────────────────────────┘
                                           │ HTTP Request (Cookies, Forms)
                                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                            Express Server                            │
│                                                                      │
│   ┌─────────────────────┐   ┌─────────────────┐   ┌──────────────┐   │
│   │   Cookie & Body     │──►│   isLoggedIn    │──►│ Route Handler│   │
│   │     Parsers         │   │ Auth Middleware │   │ (Feed, Posts)│   │
│   └─────────────────────┘   └─────────────────┘   └──────┬───────┘   │
│                                                          │           │
│                    ┌─────────────────────────────────────┤           │
│                    │                                     │           │
│                    ▼                                     ▼           │
│         ┌───────────────────────┐             ┌─────────────────────┐│
│         │   Multer Middleware   │             │   Mongoose Models   ││
│         │  (Save to /uploads)   │             │    (User & Post)    ││
│         └──────────┬────────────┘             └──────────┬──────────┘│
└────────────────────┼─────────────────────────────────────┼───────────┘
                     ▼                                     ▼
        ┌─────────────────────────┐             ┌─────────────────────┐
        │   File System Storage   │             │   MongoDB Database  │
        │ (/public/images/uploads)│             │     (dataaso)       │
        └─────────────────────────┘             └─────────────────────┘
```

---

## 📁 Directory Structure

```text
SOCIAL/
├── models/
│   ├── user.js             # Mongoose schema for User (auth, avatar, post refs)
│   └── post.js             # Mongoose schema for Post (author ref, image, likes)
├── public/
│   └── images/
│       ├── default-avatar.svg
│       └── uploads/        # Storage destination for Multer uploads
├── views/
│   ├── partials/
│   │   └── nav.ejs         # Global reusable navigation header
│   ├── index.ejs           # Register page
│   ├── login.ejs           # Login page
│   ├── feed.ejs            # Global social community feed
│   ├── profile.ejs         # Personal profile & user post manager
│   └── edit.ejs            # Edit post view
├── app.js                  # Express application setup, routes & middleware
├── package.json            # Dependencies and scripts
└── README.md
```

---

## 🚦 API Endpoints & Routes

| Method | Endpoint | Description | Protected (`isLoggedIn`) |
| :--- | :--- | :--- | :---: |
| `GET` | `/` | Renders user registration page | ❌ |
| `POST` | `/register` | Creates a new user account & issues JWT cookie | ❌ |
| `GET` | `/login` | Renders login page | ❌ |
| `POST` | `/login` | Authenticates credentials & sets JWT cookie | ❌ |
| `GET` | `/logout` | Clears auth token cookie and redirects | ❌ |
| `GET` | `/feed` | Global feed of all user posts | ✅ |
| `GET` | `/profile` | User's profile page and personal posts | ✅ |
| `POST` | `/profile/upload-pic` | Uploads user profile avatar via Multer | ✅ |
| `POST` | `/post` | Creates a new post (text + optional image via Multer) | ✅ |
| `GET` | `/like/:id` | Toggles like/unlike on a post | ✅ |
| `GET` | `/edit/:id` | Displays edit page for a post (owner only) | ✅ |
| `POST` | `/update/:id` | Updates post content (owner only) | ✅ |
| `GET` | `/delete/:id` | Deletes a post & removes reference from user (owner only) | ✅ |

---

## 💻 Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) installed (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally on port `27017`

### Steps

1. **Clone or navigate to the repository**:
   ```bash
   cd SOCIAL
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Verify MongoDB is running**:
   ```bash
   mongod
   ```

4. **Start the server**:
   ```bash
   npm start
   ```
   *Or with Nodemon for hot-reloading:*
   ```bash
   npm run dev
   ```

5. **Open in browser**:
   Navigate to [http://localhost:3001](http://localhost:3001)



## 📄 License

This project is licensed under the [ISC License](LICENSE).

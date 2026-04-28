# Deployment Guide: AI Customer Support

This project consists of a React frontend and a Node.js backend. Netlify is excellent for the frontend, but the backend requires a platform that supports persistent Node.js processes and WebSockets (like Render, Railway, or Fly.io).

## 🚀 Frontend Deployment (Netlify)

1. **Push to GitHub**: Ensure your project is in a GitHub repository.
2. **Connect to Netlify**:
   - Go to [Netlify](https://app.netlify.com/).
   - Click **Add new site** > **Import an existing project**.
   - Select your repository.
3. **Configure Build Settings**:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
4. **Environment Variables**:
   - Add `VITE_API_URL`: `https://your-backend-url.onrender.com` (you'll get this after deploying the backend).
5. **Deploy**: Netlify will build and deploy your site.

> [!TIP]
> Since this is a Single Page Application (SPA), you may need a `_redirects` file in `frontend/public` to handle routing:
> `/* /index.html 200`

---

## 🛠️ Backend Deployment (Render.com Recommended)

Render is recommended because it supports WebSockets and has a simple setup.

1. **Create a New Web Service**:
   - Connect your GitHub repository.
2. **Configure Settings**:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. **Add Environment Variables**:
   - `PORT`: `10000` (Render handles this automatically)
   - `DATABASE_URL`: Your Postgres connection string.
   - `GROQ_API_KEY`: Your Groq API key.
   - `GROQ_MODEL`: `llama3-8b-8192` (or your choice).
   - `JWT_SECRET`: A long random string.
   - `CLIENT_URL`: `https://your-app-name.netlify.app` (your frontend URL).
4. **Add a Database**:
   - Render offers a managed Postgres database. Once created, copy the **External Database URL** and paste it into the `DATABASE_URL` environment variable of your web service.

---

## 🏗️ Summary of Architecture

| Component | Platform | Configuration |
| :--- | :--- | :--- |
| **Frontend** | Netlify | Static hosting for Vite `dist` |
| **Backend** | Render/Railway | Persistent Node.js for Express + WebSockets |
| **Database** | Render/Neon | Managed PostgreSQL |

---

## 💡 Post-Deployment Tasks

1. Update the `VITE_API_URL` in Netlify with the Render URL.
2. Update the `CLIENT_URL` in Render with the Netlify URL.
3. Your app should now be fully functional in production!

const fs = require('fs');
const path = require('path');

const replacementText = `## ⚙️ Deployment Guide

### Step 1: Deploy Backend to Railway
1. Push your repository to GitHub.
2. Go to [Railway.app](https://railway.app/) and select **"New Project"** -> **"Deploy from GitHub repo"**.
3. Select your \`PromithicAI\` repository.
4. Go to **Settings -> Build** and set the **Root Directory** to \`/backend\`.
5. Go to **Variables** and add all your API keys from your \`.env.example\` file.
6. Go to **Settings -> Environment** and click **Generate Domain**. Copy this URL.

### Step 2: Deploy Frontend to Vercel
1. Update \`BACKEND_URL\` in \`js/llm.js\` (or your settings) to your new Railway domain.
2. Log in to [Vercel](https://vercel.com) using your GitHub account.
3. Select **"Import Project"** and choose the \`PromithicAI\` repository.
4. Keep the framework preset as **Other** and the root directory as \`./\`.
5. Click **Deploy**. Vercel will build the project using \`vercel.json\` for clean URL routing.

### Step 3: Configure Firebase Authentication
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project and navigate to **Authentication** -> **Settings**.
3. Under **Authorized domains**, click **"Add domain"** and add your Vercel deployment URL (e.g., \`promithic-ai.vercel.app\`).
4. Ensure **Email/Password** and **Google** are enabled under the **Sign-in method** tab.

### Step 4: Set up Supabase Database Schema
Run the following query in the **SQL Editor** of your Supabase dashboard to create the synced builds table:

\`\`\`sql
CREATE TABLE IF NOT EXISTS public.builds (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  prompt      TEXT NOT NULL,
  code        TEXT NOT NULL,
  template    TEXT DEFAULT 'custom',
  provider    TEXT DEFAULT 'claude',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_builds_user_id ON public.builds(user_id);
CREATE INDEX IF NOT EXISTS idx_builds_created_at ON public.builds(created_at DESC);
ALTER TABLE public.builds DISABLE ROW LEVEL SECURITY;
\`\`\`

`;

function updateFile(filePath) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        const regex = /## .* Deployment Guide[\s\S]*?(?=## .* Support the Project)/;
        if (regex.test(content)) {
            const newContent = content.replace(regex, replacementText);
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Updated ' + filePath);
        } else {
            console.log('Regex did not match in ' + filePath);
        }
    } else {
        console.error('File not found: ' + filePath);
    }
}

const readmePath = path.join(__dirname, '../README.md');
updateFile(readmePath);

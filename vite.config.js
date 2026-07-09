# GrowPath — deploy guide (baby steps)

You need 3 free accounts: **Supabase** (database), **GitHub** (code storage), **Vercel** (hosting).
Total time: ~20 minutes.

---

## STEP 1 — Create the database (Supabase)

1. Go to https://supabase.com → click **Start your project** → sign up (free).
2. Click **New project**. Give it a name (e.g. `growpath`), set a database password (save it somewhere), pick any region, click **Create new project**. Wait ~2 minutes while it sets up.
3. In the left sidebar, click the **SQL Editor** icon.
4. Click **New query**.
5. Open the file `supabase-schema.sql` (included in this folder), copy everything in it, paste into the SQL editor.
6. Click **Run**. You should see "Success. No rows returned." This created two tables: `leads` (everyone's answers) and `module_views` (which modules people clicked).
7. In the left sidebar, click **Project Settings** (gear icon) → **API**.
8. You'll see two values you need:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (a long string)
   Keep this tab open, you'll need to copy these in Step 3.

---

## STEP 2 — Put the code on GitHub

1. Go to https://github.com → sign up if you don't have an account.
2. Click the **+** icon top right → **New repository**. Name it `growpath` → **Create repository**.
3. On the new repo's page, click **uploading an existing file**.
4. Drag in every file and folder from this project folder (everything you downloaded, except don't worry — `.gitignore` already excludes `node_modules` and `.env`).
5. Scroll down, click **Commit changes**.

*(If you're comfortable with git/terminal instead: `git init`, `git add .`, `git commit -m "first commit"`, then follow GitHub's "push an existing repository" instructions — same result, faster.)*

---

## STEP 3 — Deploy it live (Vercel)

1. Go to https://vercel.com → sign up using your **GitHub** account (easiest — one click).
2. Click **Add New** → **Project**.
3. Find your `growpath` repo in the list → click **Import**.
4. Vercel auto-detects it's a Vite app — leave the build settings as default.
5. Before clicking Deploy, expand **Environment Variables** and add two:
   - Name: `VITE_SUPABASE_URL` → Value: (paste the Project URL from Step 1.8)
   - Name: `VITE_SUPABASE_ANON_KEY` → Value: (paste the anon public key from Step 1.8)
6. Click **Deploy**. Wait ~1 minute.
7. You'll get a live URL like `growpath.vercel.app` — that's your app, live on the internet. Open it and try it yourself first.

---

## STEP 4 — View the people who engaged

1. Go back to your Supabase project → left sidebar → **Table Editor**.
2. Click the `leads` table — every completed profile appears here as a row: age, income, expenses, goal, whether they said yes to exploring income ideas, and when.
3. Click the `module_views` table to see which money-making modules people actually opened.
4. To export it: in the Table Editor, click **Export** (or run a query in SQL Editor and export the results) → downloads as CSV, which opens fine in Excel/Google Sheets.

You now have a live app and a real database of every visitor's answers.

---

## Adding your real affiliate links later

Open `src/App.jsx`, find the `MODULES` array near the top, and for each module change:
```js
affiliate: { label: "...", desc: "...", url: "" }
```
to
```js
affiliate: { label: "...", desc: "...", url: "https://your-real-affiliate-link.com" }
```
Save, then push the change to GitHub (Step 2) — Vercel automatically redeploys within a minute of any GitHub update.

## Making changes generally

Any time you edit code and push to GitHub, Vercel redeploys automatically. No need to repeat the Vercel setup.

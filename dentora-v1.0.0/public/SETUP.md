# Dentora setup guide

You do not need to understand the code. Complete these steps in order, and do not share any secret key or password publicly.

## 1. Create the free Supabase database

1. Go to https://supabase.com and create a free account.
2. Select **New project**.
3. Give it a name such as `dentora`.
4. Create and safely store the database password.
5. Wait for the project dashboard to open.

## 2. Install the database

1. In Supabase, open **SQL Editor**.
2. Select **New query**.
3. Open `supabase/schema.sql` from this project.
4. Copy its entire contents into the SQL Editor.
5. Select **Run** once.
6. A successful run creates the tables, security rules, revision functions and default dental subjects.

Do not run the file repeatedly after you begin adding real data. Later database upgrades will use separate migration files.

## 3. Create your administrator account

1. In Supabase, open **Authentication > Users**.
2. Select **Add user > Create new user**.
3. Enter your email and a strong password.
4. Enable automatic email confirmation if the option appears.
5. Create the user.
6. Return to **SQL Editor** and run the command below after replacing the email:

```sql
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('YOUR_EMAIL@example.com');
```

## 4. Copy the three application keys

In Supabase, open **Project Settings > API** (the exact wording may be **API Keys**).

Copy these values somewhere private:

- Project URL
- Public `anon` or publishable key
- Secret `service_role` key

The service-role key must never be placed in a public message or in a variable beginning with `NEXT_PUBLIC_`.

## 5. Put the code in GitHub

1. Create a free account at https://github.com.
2. Create a new **private** repository named `dentora`.
3. Upload all files and folders from this Dentora project.
4. Ensure `.env.local` is never uploaded. It is already excluded by `.gitignore`.

GitHub Desktop is often easiest for uploading a whole folder without using commands.

## 6. Deploy free on Vercel

1. Create a free account at https://vercel.com using the same GitHub account.
2. Select **Add New > Project**.
3. Import the private `dentora` repository.
4. Vercel should recognise **Next.js** automatically.
5. Before deploying, add these environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL = your Supabase Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY = your public anon/publishable key
SUPABASE_SERVICE_ROLE_KEY = your secret service_role key
NEXT_PUBLIC_APP_NAME = Dentora
```

6. Apply them to Production, Preview and Development when Vercel offers those choices.
7. Select **Deploy**.
8. Vercel will provide a free address similar to `dentora.vercel.app`.

## 7. Configure Supabase web addresses

1. In Supabase, open **Authentication > URL Configuration**.
2. Set **Site URL** to your exact Vercel address, for example `https://dentora.vercel.app`.
3. Add the same address to allowed redirect URLs, followed by `/**` if Supabase accepts wildcards.

## 8. Sign in and create the learner

1. Open the Vercel address and sign in using your administrator account.
2. Open **Administration > Users**.
3. Enter your friend's name, email and a temporary password of at least 10 characters.
4. Give the login details to your friend privately.

## 9. Add questions

For individual questions, use **Administration > Question library > New question**.

For large batches:

1. Open **Administration > Bulk import**.
2. Download the CSV template.
3. Fill it using Excel, Google Sheets or Numbers.
4. Export/download it as CSV.
5. Upload it to Dentora.
6. Review the preview and row errors.
7. Import questions as `draft`, inspect them, and then publish them.

The `correct_answers` field uses answer letters. Use `C` for one answer or `A|D` for several answers.

## 10. Install it on a phone

- On iPhone/iPad: open the site in Safari, select **Share**, then **Add to Home Screen**.
- On Android: open the site in Chrome, open the browser menu, then select **Install app** or **Add to Home screen**.

## Safety and backups

- Keep the Supabase service-role key private.
- Do not disable Row Level Security.
- Keep the GitHub repository private.
- Export your questions periodically using Supabase's table export or the Dentora CSV workflow.
- Free Supabase projects can pause after inactivity; opening the app normally wakes the project again.

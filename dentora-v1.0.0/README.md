# Dentora

Dentora is a private dental revision question-bank web application for one administrator and one learner. It uses Next.js, Supabase and Vercel and is designed to fit comfortably within their free tiers for this small personal use case.

## Included

- Private email/password authentication
- Administrator and learner roles
- Responsive laptop, tablet and phone interface
- Installable Progressive Web App
- Practice and timed exam modes
- Subject, topic, difficulty and history filters
- Immediate explanations in practice mode
- Delayed answer review in exam mode
- Confidence ratings, flags and bookmarks
- Spaced-repetition review queue
- Results, history and subject analytics
- Manual question editor
- CSV importer for up to 1,000 questions per upload
- Question duplication, publication states and deletion
- Subject/topic management
- Private learner-account creation
- Supabase Row Level Security and server-only admin keys

## Start here

Open `SETUP.md` and follow the numbered instructions. The full database is in `supabase/schema.sql`, and the bulk-import template is in `public/question-import-template.csv`.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open `http://localhost:3000`.

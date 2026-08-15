# Kindle Candle Maker Tools — Account Setup

The site files are already wired for Supabase email/password accounts. The calculators still work without an account, but saving a candle, fragrance blend, or candle cost data requires sign-in.

## 1. Create a Supabase project

Create a free project at Supabase.

## 2. Create the saved-data table and security rules

In your Supabase dashboard, open **SQL Editor**, create a new query, paste everything from `supabase-setup.sql`, and run it.

The SQL enables Row Level Security so signed-in users can only read, create, change, and delete their own saved records.

## 3. Configure Auth URLs

In Supabase, open **Authentication → URL Configuration**.

Set **Site URL** to:

`https://kindle-candle.vercel.app`

Add this **Redirect URL**:

`https://kindle-candle.vercel.app/**`

If you later add a custom domain, add that domain here too.

## 4. Keep Email + Password sign-in enabled

In **Authentication → Sign In / Providers → Email**, keep email/password sign-ups enabled.

Email confirmation can stay enabled for production. If it is enabled, new users will see a message telling them to check their email before signing in.

## 5. Add the Project URL and Publishable Key

Open `shared/supabase-config.js`.

Replace:

`PASTE_YOUR_SUPABASE_PROJECT_URL_HERE`

and

`PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE`

with the **Project URL** and **Publishable key** from your Supabase project.

Use only the browser-safe **publishable/anon key**. Never put a `service_role` or secret key in GitHub or browser JavaScript.

## 6. Upload the site files to GitHub

Keep this exact structure in the repository:

```
index.html
shared/
  supabase-config.js
  kindle-cloud.js
fragranceLoadCalc/
  index.html
Candle Cost Calculator/
  index.html
```

`supabase-setup.sql` and this setup guide do not need to be deployed, although they can stay in the repository if you want them there.

## What changes for customers

- Calculators remain free to use without an account.
- **Save Candle**, **Save Blend**, and **Save Cost Data to Candle** require an account.
- The header gets a separate **Sign In / Account** button.
- Saved candles, fragrance blends, and cost data sync through the customer's Supabase account and can load on another device.
- Signing out clears that user's cached candle data from the browser.

## Existing saved candles

The first time an existing user signs in after this update, the site preserves the old browser-saved candles and fragrance blends and automatically moves them into the signed-in account.

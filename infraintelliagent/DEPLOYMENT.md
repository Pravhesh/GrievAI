# InfraIntelliAgent Deployment Guide

## Prerequisites

1. Supabase project created
2. Twitter Developer Account with Bearer Token
3. Twilio account for SMS notifications
4. Supabase CLI installed

## Step 1: Database Setup

1. Run the database setup from `/setup` page
2. Or manually execute SQL scripts in Supabase SQL Editor

## Step 2: Storage Configuration

Create storage bucket in Supabase:
\`\`\`sql
INSERT INTO storage.buckets (id, name, public) VALUES ('tweet-images', 'tweet-images', true);
\`\`\`

## Step 3: Environment Secrets

Set secrets using Supabase CLI:
\`\`\`bash
supabase secrets set \
  TWITTER_BEARER_TOKEN="your_twitter_token" \
  GEMINI_API_KEY="AIzaSyAzDYwMRhF9nDqSBJ7-JVtObwUbVpBGr0c" \
  TWILIO_SID="your_twilio_sid" \
  TWILIO_AUTH_TOKEN="KWMYMA6XT1WUEJFDFQR2XNYV" \
  TWILIO_PHONE="your_twilio_phone"
\`\`\`

## Step 4: Deploy Edge Functions

\`\`\`bash
supabase functions deploy fetch-tweets
supabase functions deploy submit-to-authority
\`\`\`

## Step 5: Set Up Cron Jobs

Enable cron triggers in Supabase dashboard or use pg_cron:
\`\`\`sql
SELECT cron.schedule('fetch-tweets', '*/10 * * * *', 'SELECT net.http_post(url:=''https://your-project.supabase.co/functions/v1/fetch-tweets'', headers:=''{"Authorization": "Bearer your-anon-key"}'');');
\`\`\`

## Step 6: Test the System

1. Use manual triggers in `/setup` page
2. Verify tweets are fetched and processed
3. Test moderator approval workflow
4. Confirm SMS notifications work

## Monitoring

- Check processing logs in the database
- Monitor Edge Function logs in Supabase dashboard
- Set up alerts for failed processes

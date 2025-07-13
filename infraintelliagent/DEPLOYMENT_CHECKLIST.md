# InfraIntelliAgent Deployment Checklist

## ✅ Pre-Deployment Setup

### 1. API Keys Required
- [ ] Twitter Bearer Token
- [ ] Gemini API Key: `AIzaSyAWH9zaPT9vYkh8ZBLimbGKBZFJ1BpzVUk`
- [ ] Twilio SID
- [ ] Twilio Auth Token: `KWMYMA6XT1WUEJFDFQR2XNYV`
- [ ] Twilio Phone Number

### 2. Supabase Project Setup
- [ ] Project created: `https://jjkqfvykocrdtnkyrjde.supabase.co`
- [ ] Database tables created (run SQL scripts)
- [ ] Storage bucket `tweet-images` created with public access
- [ ] RLS policies configured

## ✅ Deployment Steps

### 3. Set Environment Secrets
\`\`\`bash
supabase secrets set \
  SUPABASE_URL="https://jjkqfvykocrdtnkyrjde.supabase.co" \
  GEMINI_API_KEY="AIzaSyAWH9zaPT9vYkh8ZBLimbGKBZFJ1BpzVUk" \
  TWITTER_BEARER_TOKEN="your_twitter_token" \
  TWILIO_SID="your_twilio_sid" \
  TWILIO_AUTH_TOKEN="KWMYMA6XT1WUEJFDFQR2XNYV" \
  TWILIO_PHONE="your_twilio_phone"
\`\`\`

### 4. Deploy Edge Functions
\`\`\`bash
supabase functions deploy fetch-tweets
supabase functions deploy submit-to-authority
\`\`\`

### 5. Set Up Cron Jobs
- [ ] Enable cron in Supabase dashboard
- [ ] Configure 10-minute interval for fetch-tweets

### 6. Database Triggers
- [ ] Run trigger creation scripts
- [ ] Test authority submission trigger

## ✅ Testing & Verification

### 7. System Health Checks
- [ ] Database connection working
- [ ] Storage bucket accessible
- [ ] Edge functions deployed
- [ ] Settings configured
- [ ] Processing logs table ready

### 8. End-to-End Testing
- [ ] Manual tweet fetch works
- [ ] Location extraction via Gemini works
- [ ] Geocoding via Nominatim works
- [ ] Image upload to storage works
- [ ] SMS notifications work
- [ ] Authority submission works
- [ ] Moderator dashboard functional

### 9. Production Readiness
- [ ] Cron job running automatically
- [ ] Error logging working
- [ ] SMS notifications to real moderators
- [ ] Authority submission configured
- [ ] Monitoring and alerts set up

## 🚀 Go Live
- [ ] All tests passing
- [ ] Monitoring in place
- [ ] Documentation complete
- [ ] Team trained on moderator dashboard

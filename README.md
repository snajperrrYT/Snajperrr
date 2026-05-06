<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/2a72fa6c-ff03-48c4-a569-3648cdeda93c

GitHub Repository: https://github.com/bbbbbbbbbc/Snajperrr

## Cloud Run & Deployment

When hosting on **Google Cloud Run** or other external servers, you **MUST** configure the following environment variables in your hosting provider's dashboard:

- **GEMINI_API_KEY**: Your Google Gemini API key (required for AI analysis and auto-repair).
- **APP_URL**: The full URL of your application (e.g., `https://your-app-xxxx.a.run.app`). This is critical for Discord OAuth login to work.
- **DISCORD_TOKEN**: Your Discord Bot token.
- **DISCORD_CLIENT_ID** & **DISCORD_CLIENT_SECRET**: Required for the dashboard login.
- **JWT_SECRET**: A random string for securing user sessions.

Make sure your Discord Application's **Redirect URI** matches your `APP_URL` + `/api/auth/callback`.

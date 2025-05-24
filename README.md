# 📱 X2Scb - Twitter to Scrapbox Integration Template

> 🚀 **GitHub Template Repository** - Click "Use this template" to create your own Twitter-to-Scrapbox integration!

[![Use this template](https://img.shields.io/badge/Use%20this%20template-2ea44f?style=for-the-badge)](https://github.com/tkgshn/X2Scb/generate)

## 📖 Overview

X2Scb automatically collects your daily tweets and formats them for easy import into Scrapbox pages. This template provides a complete solution for:

- 🔄 **Automated tweet collection** via GitHub Actions
- 📋 **Scrapbox-compatible formatting** with AI-powered summaries
- 🌐 **GitHub Pages deployment** for easy data access
- 🔧 **Browser UserScript** for seamless Scrapbox integration

## ✨ Features

- **Daily Automation**: GitHub Actions workflow collects tweets automatically
- **Smart Summaries**: OpenAI-powered summaries for retweets and long content
- **Multiple Formats**: JSON and TXT output, plus HTML import files
- **Easy Integration**: UserScript for one-click import to Scrapbox
- **Template Ready**: One-click setup with automatic configuration

## 🚀 Quick Start

### 1. Create Your Repository

1. Click the **"Use this template"** button above
2. Name your new repository (e.g., `my-twitter-scrapbox`)
3. Create the repository

### 2. Automatic Setup

After creating your repository from this template:

1. **Wait for automatic setup** - A GitHub Action will run automatically to:

   - 🧹 Clean up sample data
   - 📝 Update UserScript configuration with your repository details
   - 📚 Create setup instructions (SETUP.md)
   - 🔧 Prepare your repository for use

2. **Check the SETUP.md file** - Follow the detailed setup instructions that will be created

### 3. Configure Your Environment

The setup process will guide you through:

- 🔑 **API Keys**: Twitter Bearer Token and OpenAI API Key
- 🌐 **GitHub Pages**: Enable Pages for data hosting
- 🔧 **Repository Secrets**: Configure required environment variables
- 📱 **UserScript**: Install browser extension for Scrapbox

## 📁 What You Get

```
your-repo/
├── .github/workflows/     # Pre-configured automation
│   └── daily.yml         # Daily tweet collection
├── public/               # Generated data (auto-deployed to Pages)
├── src/
│   ├── backend/          # Tweet processing and formatting
│   └── frontend/         # UserScript for Scrapbox integration
├── scripts/              # Utility scripts and testing tools
├── daily.js              # Main collection script
└── SETUP.md              # Your personalized setup guide
```

## 🛠️ How It Works

### Automated Collection

1. **GitHub Actions** runs daily at 9:00 AM JST
2. **Fetches** your previous day's tweets and retweets
3. **Processes** content with OpenAI for intelligent summaries
4. **Formats** data for Scrapbox compatibility
5. **Publishes** to GitHub Pages automatically

### Scrapbox Integration

1. **UserScript** detects when you're on a Scrapbox date page
2. **Automatically imports** yesterday's tweets
3. **Manual import** available with `?date=YYYY-MM-DD` parameter
4. **Copy-paste ready** formatting with modal preview

## 🔧 Customization

After setup, you can customize:

- **Schedule**: Modify `.github/workflows/daily.yml` cron timing
- **Content**: Adjust Twitter query parameters in `daily.js`
- **AI Prompts**: Customize OpenAI summarization prompts
- **UserScript**: Modify Scrapbox integration behavior
- **Formatting**: Adjust output formats in `src/backend/`

## 📋 Requirements

- **GitHub Account** (free tier sufficient)
- **Twitter API Access** (Bearer Token)
- **OpenAI API Key** (for summaries)
- **Scrapbox Account** (for integration)

## 🆘 Support

- 📖 **Setup Issues**: Check your generated SETUP.md file
- 🐛 **Bugs**: Open an issue in the original template repository
- �� **Features**: Fork and contribute improvements
- 📚 **Docs**: See the original repository wiki

## 📄 License

MIT License - feel free to use, modify, and distribute!

## 🙏 Credits

Created by [@tkgshn](https://github.com/tkgshn) - Template based on the original [X2Scb](https://github.com/tkgshn/X2Scb) project.

---

> **Next Steps**: After using this template, check your repository's SETUP.md file for detailed configuration instructions!

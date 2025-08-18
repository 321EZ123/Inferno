# 🔥 Inferno Search Engine

A privacy-first search engine with a futuristic dark theme that burns through the web. Built with Next.js, Tailwind CSS, and powered by SerpAPI.

## ✨ Features

- **Privacy First**: No tracking, no data collection, no cookies
- **Futuristic UI**: Dark theme with fiery animations and effects
- **Fast Search**: Powered by SerpAPI for reliable search results
- **No Captchas**: Clean search experience without interruptions
- **Responsive Design**: Works perfectly on all devices
- **Safe Search**: Built-in safe search enabled by default

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- SerpAPI account (free tier available)

### Setup

1. **Clone the repository** (or use this project)

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Get your SerpAPI key:**
   - Visit [SerpAPI](https://serpapi.com/manage-api-key)
   - Sign up for a free account (100 searches/month)
   - Copy your API key

4. **Configure environment:**
   - Rename `.env.local` or create it with:
   ```bash
   SERPAPI_KEY=your_actual_serpapi_key_here
   ```

5. **Start the development server:**
   ```bash
   bun dev
   ```

6. **Visit http://localhost:3000** and start searching!

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SERPAPI_KEY` | Your SerpAPI key | Yes |

### Search Parameters

The search engine is configured with:
- **Engine**: Google
- **Results per page**: 10
- **Safe search**: Active
- **Default location**: United States
- **Language**: English

## 🎨 Design Features

- **Animated flame icons** with pulse effects
- **Gradient backgrounds** with fiery colors
- **Backdrop blur effects** for modern aesthetics
- **Custom scrollbars** with red-orange gradients
- **Hover animations** on search results
- **Loading states** with spinning indicators

## 🔒 Privacy Features

- **No tracking scripts** or analytics
- **No data storage** on our servers
- **Minimal data transfer** - only essential search data
- **Secure API calls** through server-side proxy
- **No user identification** or session tracking

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom animations
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Search API**: SerpAPI
- **Deployment**: Netlify-ready

## 📱 Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## 🚀 Deployment

This project is configured for easy deployment on Netlify:

1. Connect your repository to Netlify
2. Set the `SERPAPI_KEY` environment variable in Netlify settings
3. Deploy!

## 🔧 Development

### Project Structure

```
src/
├── app/
│   ├── api/search/          # SerpAPI proxy endpoint
│   ├── globals.css          # Global styles and animations
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main search interface
└── lib/
    └── utils.ts            # Utility functions
```

### Adding Features

- **Custom search engines**: Modify the `engine` parameter in `/api/search/route.ts`
- **Additional filters**: Add more parameters to the SerpAPI call
- **Theme customization**: Edit colors in `globals.css` and component classes

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

- For SerpAPI issues: [SerpAPI Support](https://serpapi.com/contact)
- For project issues: Create an issue in this repository

## 🔗 Links

- [SerpAPI Documentation](https://serpapi.com/search-api)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Inferno Search** - Privacy-first web search that respects your anonymity 🔥

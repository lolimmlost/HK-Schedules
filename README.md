# Housekeeper Schedule Manager

A modern web application for managing housekeeper schedules with CSV import/export capabilities, built with React, TypeScript, Tailwind CSS, and shadcn/ui components.

## ✨ Features

- ✅ Add, edit, and delete housekeeper schedules
- ✅ Optional date assignment for schedules
- ✅ Time range specification (start/end times)
- ✅ Task descriptions for each schedule
- ✅ CSV import/export functionality
- ✅ Print-friendly schedule view
- ✅ Responsive design with shadcn/ui components
- ✅ Local storage persistence
- ✅ Network accessible for Cloudflare tunnel deployment

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Backend**: Express.js (API for CSV export)
- **Build Tool**: Vite
- **Deployment**: Cloudflare Tunnel ready

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Cloudflare CLI (`cloudflared`) for tunnel deployment

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd HK-Schedules

# Install dependencies
npm install
```

### Development Setup

The project uses a dual-server architecture for development:

**Terminal 1 - Vite Development Server (UI + Hot Reload)**
```bash
# Start React development server on port 3001
HOST=0.0.0.0 npm run dev
```
- Serves the React app with hot module replacement
- Proxies API calls to Express server
- Accessible at: http://localhost:3001

**Terminal 2 - Express API Server (CSV Export API)**
```bash
# Start API server on port 4000
npm start
```
- Handles `/export-csv` POST requests
- Redirects UI requests to Vite dev server
- Accessible at: http://localhost:4000

**Terminal 3 - Cloudflare Tunnel (Optional - for external access)**
```bash
# Forward appahouse.com to Vite dev server
cloudflared tunnel --url http://localhost:3001
```

### Production Build & Deploy

```bash
# Build the React application
npm run build

# Start production server (single server on port 4000)
npm start

# For Cloudflare tunnel in production
cloudflared tunnel --url http://localhost:4000
```

## 📋 Project Structure

```
HK-Schedules/
├── index.html              # Vite entry point
├── src/                    # React source code
│   ├── main.tsx            # React entry point
│   ├── App.tsx             # Main application component
│   ├── index.css           # Global styles with Tailwind
│   ├── components/         # React components
│   │   ├── schedule-form.tsx  # Schedule form component
│   │   └── schedule-table.tsx # Schedule table component
│   └── components/ui/      # shadcn/ui components
│       ├── button.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── textarea.tsx
│       ├── card.tsx
│       └── table.tsx
├── server.js               # Express API server
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## 🔧 Configuration Files

### Vite Configuration (`vite.config.ts`)

```ts
// Key configurations for development and production
server: {
  port: 3001,                    // Development server port
  host: true,                    // Allow external connections
  proxy: {                       // API proxy to Express server
    '/export-csv': {
      target: 'http://localhost:4000',
      changeOrigin: true,
    }
  }
}
```

### Server Configuration (`server.js`)

```js
// Dual-mode server for development and production
if (process.env.NODE_ENV !== 'production') {
  // Development: Redirect UI to Vite, handle API
  app.get('*', (req, res) => {
    res.redirect(`http://localhost:3001${req.originalUrl}`)
  })
} else {
  // Production: Serve built files from dist/
  app.use(express.static('dist'))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  })
}
```

## 🌐 Cloudflare Tunnel Setup

### Quick Tunnel (Development)

```bash
# Start Vite dev server
HOST=0.0.0.0 npm run dev

# In another terminal, create quick tunnel
cloudflared tunnel --url http://localhost:3001
```

### Named Tunnel (Production)

```bash
# 1. Create tunnel
cloudflared tunnel create housekeeper-app

# 2. Get tunnel UUID
cloudflared tunnel list

# 3. Create configuration (~/.cloudflared/config.yml)
tunnel: housekeeper-app
credentials-file: ~/.cloudflared/[UUID].json

ingress:
  - hostname: appahouse.com
    service: http://localhost:3001  # Dev or 4000 for production
  - service: http_status:404

# 4. Route DNS
cloudflared tunnel route dns housekeeper-app appahouse.com

# 5. Run tunnel
cloudflared tunnel run housekeeper-app
```

## 📱 Usage

### Adding Schedules

1. Click "Add New Schedule" button
2. Fill in housekeeper name (required)
3. Optionally set a date
4. Set start and end times (required)
5. Add task descriptions
6. Click "Add Schedule"

### Managing Schedules

- **Edit**: Click the Edit button next to any schedule
- **Delete**: Click the Delete button and confirm
- **Print**: Click "Print Schedule" for printer-friendly view
- **Export**: Click "Export CSV" to download all schedules

### Import CSV

The CSV format should be:
```
Name,Date,Start,End,Tasks
John Doe,2025-09-15,09:00,12:00,"Clean kitchen, vacuum living room"
```

## 🏗️ Scripts

| Script | Description | Port |
|--------|-------------|------|
| `npm run dev` | Development server with hot reload | 3001 |
| `npm run build` | Build production bundle | - |
| `npm run preview` | Preview production build | 4173 |
| `npm start` | Production/development API server | 4000 |

## 🔍 Troubleshooting

### Common Issues

**"Could not resolve entry module 'index.html'"**
- Ensure `index.html` is in project root (not src/)
- Remove any conflicting `src/index.html`

**"Missing dependencies" errors**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Cloudflare tunnel 404 errors**
1. Verify Vite is running: `curl http://localhost:3001`
2. Check tunnel output for connection status
3. Ensure `HOST=0.0.0.0` is set for Vite
4. Verify DNS points to Cloudflare

**Port conflicts**
- Vite: Port 3001 (configurable in vite.config.ts)
- Express: Port 4000 (configurable in server.js)
- Preview: Port 4173

### Build Issues

**TypeScript errors during build:**
- Run `npm run build` to see specific errors
- Check for unused imports or variables
- Ensure all shadcn/ui components have required dependencies

**Missing shadcn/ui components:**
```bash
npm install @radix-ui/react-label @radix-ui/react-slot class-variance-authority clsx lucide-react tailwind-merge
```

## 📄 License

This project is open source and available under the MIT License.

## 🙌 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support with setup or deployment issues, check the troubleshooting section or open an issue on the repository.

---

**Built with ❤️ using React, TypeScript, shadcn/ui, and Tailwind CSS**
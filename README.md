# Live Collaboration Whiteboard

A real-time collaborative whiteboard application built with Next.js 15, Socket.IO, and HTML5 Canvas.

## Features

### Drawing Tools
- Freehand drawing with adjustable brush sizes (1-20px)
- Color picker with preset colors and custom color support
- Eraser tool with variable sizes
- Shape tools: Rectangle and Circle
- Clear canvas functionality
- Undo/Redo support

### Collaboration Features
- Real-time drawing synchronization across users
- Live cursor position tracking with user indicators
- User presence system with emoji identifiers
- Drawing state indicators (shows who is currently drawing)
- Automatic user name and emoji assignment

### Canvas Controls
- Export canvas as PNG
- Paste image support
- Canvas state persistence (auto-save)
- Responsive canvas sizing

### User Interface
- Minimalist, modern design with Tailwind CSS
- Sidebar tool panel with:
  - Active users list
  - Tool selection
  - Color presets
  - Brush size control
  - Action buttons (Clear, Undo/Redo, Download)
- Real-time drawing indicators
- User cursor tracking with names

### Performance
- Throttled cursor position updates
- Optimized drawing events (~60fps limit)
- Efficient canvas rendering with temporary shape preview
- ResizeObserver for responsive canvas handling

### Mobile Support
- Touch-enabled drawing and erasing
- Responsive layout for mobile devices
- Collapsible toolbar for better canvas space
- Mobile-optimized tool grid layout
- Touch gesture support for drawing shapes
- Compact color palette for mobile screens
- Floating action button for toolbar access
- Optimized for both portrait and landscape modes
- Touch-friendly size controls
- Mobile-friendly user indicators

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Local Development
1. Clone the repository
```bash
git clone https://github.com/yourusername/live-collab.git
cd live-collab
```

2. Install dependencies
```bash
npm install
```

3. Start the development server (includes both Next.js and WebSocket server)
```bash
npm run dev
```

4. Open your browser and visit:
- Application: http://localhost:3000

The server.js file includes both the Next.js and WebSocket server setup, so you don't need to run them separately.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

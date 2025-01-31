# Live Collaboration Whiteboard

A real-time collaborative whiteboard application built with Next.js 15, Socket.IO, and HTML5 Canvas.

## Implementation Steps

1. **Socket.IO Setup**
   - Install Socket.IO dependencies
   - Create WebSocket server
   - Set up client-side Socket.IO connection

2. **Whiteboard Implementation**
   - Create Canvas component
   - Implement drawing functionality
   - Add color picker and brush size selector

3. **Real-time Collaboration**
   - Broadcast drawing events
   - Sync canvas state between users
   - Handle user join/leave events

4. **Features**
   - Real-time drawing synchronization
   - Multiple colors and brush sizes
   - User presence indicators
   - Clear canvas option

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to view the application.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

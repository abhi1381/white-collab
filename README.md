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

## Detailed Deployment Instructions for Vercel

To deploy your application to Vercel, follow these steps:

1. **Fork the Repository**: Fork the repository to your GitHub account.

2. **Clone the Repository**: Clone the forked repository to your local machine.

3. **Install Dependencies**: Navigate to the project directory and install the dependencies using `npm install`.

4. **Add Vercel Configuration**: Ensure that the `vercel.json` configuration file is present in the root directory of your project. This file should contain the following configuration:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "out",
  "framework": "nextjs"
}
```

5. **Deploy to Vercel**: Follow the instructions on the Vercel platform to deploy your Next.js application. You can use the Vercel CLI or the Vercel web interface to deploy your application.

## Steps to Deploy the WebSocket Server

To deploy the WebSocket server for your application, follow these steps:

1. **Set up the WebSocket server**: Ensure that the WebSocket server is implemented in `src/server/socket.ts`. This server will handle WebSocket connections separately from your main application server. 🚀

2. **Install dependencies**: Make sure you have the necessary dependencies installed. You can find the required dependencies in the `package.json` file. 📦

3. **Add a start script**: Ensure that the `package.json` file includes a script to start the WebSocket server. For example, `"socket": "npx tsx src/server/socket.ts"`. This script will be used to start the WebSocket server. 🖥️

4. **Deploy the WebSocket server**: Deploy the WebSocket server to a hosting provider that supports Node.js applications. You can use platforms like AWS, Heroku, or DigitalOcean. 🌐

5. **Configure a load balancer**: Set up a load balancer to distribute incoming WebSocket connections evenly across multiple instances of your WebSocket server. This helps in handling high traffic and provides redundancy. 🔄

6. **Update client-side connection**: Ensure that the client-side code in `src/components/Whiteboard.tsx` connects to the deployed WebSocket server. Update the connection URL to point to the deployed server. 🌍

## Update Client-Side Connection URL

To update the client-side connection URL to the deployed WebSocket server, follow these steps:

1. **Open `src/components/Whiteboard.tsx`**: Locate the file `src/components/Whiteboard.tsx` in your project.

2. **Update the WebSocket connection URL**: Find the line where the WebSocket connection is established and update the URL to point to the deployed WebSocket server. For example, if your WebSocket server is deployed at `wss://your-websocket-server.com`, update the connection URL accordingly:

```javascript
const socket = io("wss://your-websocket-server.com");
```

3. **Save and deploy**: Save the changes and deploy your application to Vercel.

By following these steps, you will have successfully deployed your Next.js application to Vercel and connected it to the deployed WebSocket server.

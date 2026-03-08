# Discord-Like Real-Time Chat Application

A modern, feature-rich real-time chat application built with Next.js 16, React 19, and Socket.io. Designed with a dark theme aesthetic inspired by Discord, featuring real-time messaging, typing indicators, read receipts, and friend management.

## Features

### Core Chat Features
- **Real-time Messaging**: Instant message delivery using Socket.io
- **Direct Messages (DMs)**: 1-on-1 conversations with friends
- **Group Chats**: Multiple users in a single conversation
- **Message Search**: Full-text search across all messages in a conversation
- **Typing Indicators**: See when others are typing
- **Read Receipts**: Know when messages have been read
- **File Sharing**: Upload and share files with preview support

### User Management
- **Authentication**: Secure login and registration system
- **Friend Management**: Add, remove, and manage friends
- **Friend Requests**: Send and accept friend requests
- **Online Status**: See who's online, away, or offline with live status updates
- **User Profiles**: Detailed user information and settings
- **Activity Status**: Automatic away status when browser is hidden

### Advanced Features
- **Emoji Picker**: 100+ emojis organized by category
- **Message Timestamps**: See when each message was sent
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Dark Theme**: Beautiful dark interface with vibrant accent colors
- **User Presence**: Real-time presence tracking and status updates
- **Protected Routes**: Secure authentication with automatic redirects

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19.2** - Latest React with new hooks and features
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS framework
- **Socket.io Client** - Real-time bidirectional communication
- **Zustand** - Lightweight state management
- **shadcn/ui** - High-quality UI components
- **Lucide Icons** - Beautiful icon library
- **date-fns** - Date formatting and manipulation

### State Management
- **Auth Store** - User authentication and profile management
- **Chat Store** - Messages, conversations, and typing state
- **Friends Store** - Friend list and requests
- **Presence Store** - Online status tracking
- **UI Store** - UI state (modals, panels, etc.)

### Design System
- **Dark Theme** - Deep dark background (#0F0F0F) with light text
- **Color Palette** - Primary purple (#8B5CF6) with vibrant accents
- **Custom Animations** - Typing indicators, presence glows, smooth transitions
- **Responsive Layout** - Mobile-first design with Tailwind breakpoints

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (or npm/yarn)

### Installation

```bash
# Clone or setup the project
cd my-app

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Credentials
The app supports mock authentication - you can use any email and password to log in:
- Email: `demo@example.com`
- Password: `password123`

## Project Structure

```
app/
├── chat/               # Main chat page
├── login/              # Login page
├── register/           # Registration page
└── layout.tsx          # Root layout with theme setup

components/
├── ChatHeader.tsx      # Conversation header with actions
├── ChatSidebar.tsx     # Sidebar with conversations and friends
├── EmojiPicker.tsx     # Emoji selection picker
├── FriendsPanel.tsx    # Friend management modal
├── MessageInput.tsx    # Message compose area
├── MessagesArea.tsx    # Message display area
├── MessageSearch.tsx   # Message search modal
├── ProtectedRoute.tsx  # Authentication wrapper
├── SocketProvider.tsx  # Socket.io initialization
└── UserProfile.tsx     # User settings modal

store/
├── authStore.ts        # Authentication state
├── chatStore.ts        # Chat and messaging state
├── friendsStore.ts     # Friends and requests state
├── presenceStore.ts    # Online status state
└── uiStore.ts          # UI modals and panels state

hooks/
├── useChat.ts          # Chat operations (send, typing, read)
└── useSocket.ts        # Socket.io connection and events

app/
├── globals.css         # Global styles and design tokens
├── layout.tsx          # Root layout
└── page.tsx            # Home page (redirects to chat/login)
```

## Key Components

### ChatSidebar
- Displays conversations and friends list
- Search functionality
- Tabs for Messages and Friends
- Quick access to settings and logout

### ChatHeader
- Shows current conversation info
- Call and video buttons (UI only)
- Message search integration
- Online status indicator

### MessagesArea
- Displays all messages in conversation
- Auto-scrolls to newest messages
- Shows sender avatar and name
- File preview support
- Read receipts with checkmarks
- Typing indicator animation

### MessageInput
- Type and send messages
- File upload support
- Emoji picker
- Typing indicator detection
- Handles message formatting

### FriendsPanel
- View all friends with online status
- Pending friend requests
- Add friends by code
- Remove friends
- Online/offline filtering

## Real-Time Features

### Socket.io Events
The application is configured to handle these Socket.io events:
- `message:new` - New message received
- `message:updated` - Message edited
- `message:deleted` - Message deleted
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `presence:update` - User status changed
- `friend:request` - Friend request received
- `friend:added` - Friend added successfully

### State Management
Zustand stores provide reactive state management without Redux complexity:
- Automatic re-renders on state changes
- Devtools support for debugging
- Lightweight and performant
- No boilerplate code

## Styling & Design

### Color System
- Background: #0F0F0F (deep dark)
- Card: #1A1A1A (slightly lighter)
- Primary: #8B5CF6 (vibrant purple)
- Accents: Blue, Pink, Orange, Teal, Rose
- Status: Online (green), Away (amber), Offline (gray)

### Typography
- Fonts: Geist (sans) + Geist Mono (mono)
- Responsive sizing with Tailwind classes
- Clear visual hierarchy

### Animations
- Pulse glow on online status
- Typing indicator dots animation
- Smooth slide and fade transitions
- Message entrance animations

## Future Enhancements

### Backend Integration
- Connect to real Socket.io server
- User authentication API
- Message persistence in database
- File upload to cloud storage
- Friend request notifications

### Additional Features
- Voice and video calls (Twilio integration)
- Message reactions
- User mentions and notifications
- Custom emojis and stickers
- Message edit history
- Conversation pins
- User roles and permissions
- Message encryption
- Dark/light theme toggle
- Message scheduling
- Read-only channels

### Performance
- Message pagination and infinite scroll
- Image lazy loading
- Code splitting by route
- Service Worker for offline support

## Environment Variables

Create a `.env.local` file (optional):

```env
# Socket.io server URL (optional, defaults to localhost:3001)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# API endpoint (optional)
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Authentication

The application includes:
- Protected routes that require login
- Automatic redirect to login when unauthenticated
- Mock authentication for demo purposes
- User session management with Zustand
- Token storage in localStorage

## Mobile Responsive

- Mobile-optimized sidebar with toggle
- Touch-friendly buttons and spacing
- Adaptive layout for all screen sizes
- Responsive typography

## Accessibility

- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly
- High contrast colors

## Contributing

Feel free to extend this application with your own features:
1. Add new components in the `components/` folder
2. Create new stores in `store/` for state management
3. Add custom hooks in `hooks/` folder
4. Update the design tokens in `app/globals.css`

## License

MIT License - Feel free to use this project for learning and inspiration.

## Support

For questions or issues, refer to the documentation or check the component comments for implementation details.

---

Built with v0 and Next.js. Inspired by Discord's elegant UI/UX.
\n<!-- Trigger Redeploy: Mon Mar  9 00:37:42 +07 2026 -->

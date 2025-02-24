<a href="https://chatpdf-theta.vercel.app//">
  <h1 align="center">Document QA bot</h1>
</a>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#installation"><strong>Installation</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Features

- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance
- [AI SDK](https://sdk.vercel.ai/docs)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence
  - [Vercel Postgres powered by Neon](https://vercel.com/storage/postgres) for saving chat history and user data
  - [Vercel Blob](https://vercel.com/storage/blob) for efficient object storage
- [NextAuth.js](https://github.com/nextauthjs/next-auth)
  - Simple and secure authentication
- Enhanced Chat Interface
  - 50-50 split screen display for simultaneous document and chat viewing
  - Real-time document analysis and chat interaction
  - Seamless PDF document integration

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chatpdf.git
cd chatpdf
```

2. Install dependencies:
```bash
pnpm install
```

## Running locally

1. Set up environment variables:
```bash
cp .env.example .env
```

2. Configure your environment variables in `.env` file

3. Start the development server:
```bash
pnpm dev
```

Your application will be running at [http://localhost:3000](http://localhost:3000)

4. For production build:
```bash
pnpm build
pnpm start
```

---

### **1. Basic Architecture**
This diagram provides an overview of the system, showing how the user interacts with the application.

```mermaid
graph TD
    A[User] -->|Uploads Document / Asks Question| B[Next.js Frontend]
    B -->|Processes UI Requests| C[Backend API Next.js]
    C -->|Calls AI SDK for Text Processing| D[Gemini AI Model]
    C -->|Fetches/Saves Data| E[Vercel Postgres & Blob Storage]
    C -->|Handles Authentication| F[NextAuth.js]
    E -->|Stores & Retrieves Documents| G[Blob Storage]


```

---

### **2. High-Level Design (HLD)**
This diagram shows key components of the system and their interactions.

```mermaid
graph TD
    subgraph Frontend
        A1[Next.js , React, shadcn/ui]
        A2[Client-side Routing]
        A3[Chat & Document Viewer]
    end

    subgraph Backend
        B1[Next.js Server Actions]
        B2[AI SDK Gemini API]
        B3[Authentication NextAuth.js]
        B4[Database Access Layer]
    end

    subgraph Storage
        C1[Vercel Postgres]
        C2[Vercel Blob]
    end

    A1 -->|User Interacts| A3
    A3 -->|Requests| B1
    B1 -->|Queries| B2
    B2 -->|Sends to| B3
    B3 -->|Authenticates| B4
    B4 -->|Fetches Data| C1
    B4 -->|Fetches Documents| C2
```

---

### **3. Low-Level Design (LLD)**
A more detailed view, breaking down request handling, storage, and authentication.

```mermaid
sequenceDiagram
    participant User
    participant Next.js Frontend
    participant Next.js Backend
    participant AI SDK (Gemini)
    participant Database (Vercel Postgres)
    participant Storage (Vercel Blob)
    participant Auth (NextAuth.js)

    User ->> Next.js Frontend: Uploads Document / Asks Question
    Next.js Frontend ->> Next.js Backend: API Request (chat / document)
    Next.js Backend ->> Auth (NextAuth.js): Validate User Session
    Auth (NextAuth.js) -->> Next.js Backend: Success / Failure
    Next.js Backend ->> Database (Vercel Postgres): Fetch User Data
    Database (Vercel Postgres) -->> Next.js Backend: User Data
    Next.js Backend ->> Storage (Vercel Blob): Retrieve Document (if needed)
    Storage (Vercel Blob) -->> Next.js Backend: Document Data
    Next.js Backend ->> AI SDK (Gemini): Process Question / Extract Info
    AI SDK (Gemini) -->> Next.js Backend: Processed Response
    Next.js Backend -->> Next.js Frontend: Response (Text / Processed Data)
    Next.js Frontend -->> User: Display Answer / Chat Response
```

---

These diagrams represent the system at different levels of abstraction, from **basic structure** to **detailed request flow**. Let me know if you need modifications or explanations! 🚀

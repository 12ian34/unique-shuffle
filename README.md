# unique shuffle

[![Netlify Status](https://api.netlify.com/api/v1/badges/5e8bd144-63c7-46ab-ab91-4e47ff15d12c/deploy-status)](https://app.netlify.com/sites/unique-shuffle/deploys)

a standard deck of 52 playing cards can be arranged in 52! (52 factorial) different ways:

52!

= 52 x 51 x 50 x ... x 3 x 2 x 1

= 8.0658 × 10^67

if every person on Earth generated a trillion shuffles per second since the beginning of the universe, we would have explored only a tiny fraction of all possible arrangements

'unique shuffle' is an online card shuffling game with achievements, pattern detection and social features

https://unique-shuffle.netlify.app

## screens

<table>
   <tr>
      <td><img src="https://github.com/user-attachments/assets/9e9f4a03-ff1a-436c-acad-80beb9f47d22" width="150"></td>
      <td><img src="https://github.com/user-attachments/assets/f1618fb7-8f10-4d1e-977e-66c39e16f10c" width="150"></td>
      <td><img src="https://github.com/user-attachments/assets/7cda2cc5-d76b-4a32-b6b3-16e0c67444dd" width="150"></td>
      <td><img src="https://github.com/user-attachments/assets/b30a3713-4c79-43a4-bba4-28f23adf8119" width="150"></td>
      <td><img src="https://github.com/user-attachments/assets/ba8bced0-d281-47e0-992d-9a0993ec0364" width="150"></td>
      <td><img src="https://github.com/user-attachments/assets/859c2527-e4b7-4c84-8f9f-d14ba80dbaf4" width="150"></td>
      <td><img src="https://github.com/user-attachments/assets/eabd271c-71b7-4291-a978-a52e07f85384" width="150"></td>
   </tr>
</table>

## features

- randomly shuffle a virtual deck
- pattern detection and highlighting
- achievements
- shuffle saving
- shuffle sharing
- global leaderboard
- add a friend

## feature requests

welcome! just [create an issue](https://github.com/12ian34/unique-shuffle/issues/new)

## for devs

### prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account for backend services
- PostHog account for analytics (optional)

### frontend

- next.js 14 with router and react 18
- react context + hooks, server actions
- tailwind CSS, shadcn/ui
- framer motion
- posthog for event tracking and analysis

### backend

- next.js API Routes, server components
- postgresql via supabase
- supabase auth
- supabase storage
- netlify for deployment and functions

### contributing

welcome!

### project structure

```
unique-shuffle/
├── public/               # Static assets and images
├── src/
│   ├── app/              # Next.js App Router pages and layouts
│   │   ├── api/          # API routes and serverless functions
│   │   ├── auth/         # Authentication-related pages
│   │   ├── dashboard/    # User dashboard components
│   │   └── shuffle/      # Shuffle generation and display
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Base UI components (shadcn)
│   │   ├── cards/        # Card rendering components
│   │   └── layout/       # Layout components
│   ├── lib/              # Core utilities and services
│   │   ├── supabase/     # Supabase client and helpers
│   │   ├── analytics/    # PostHog integration
│   │   └── utils/        # Shared utility functions
│   ├── migrations/       # Database migration scripts
│   └── types/            # TypeScript type definitions
├── .env.example          # Example environment variables
├── package.json          # Project dependencies and scripts
└── README.md             # Project documentation
```

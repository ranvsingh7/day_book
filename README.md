# Daybook Ledger

Full-stack Daybook (Ledger) web app built with Next.js App Router, TypeScript, Tailwind CSS v4, MongoDB, and Mongoose.

## Features

- Authentication with JWT session cookie
- Dashboard with:
	- Total income/expense for today and this month
	- Current balance
	- Daily closing balance
	- Recent transactions
- Add transaction entry (income/expense)
- Transaction list with:
	- Date range filter
	- Type filter
	- Category filter
	- Search by category/description
	- Edit/Delete actions
	- CSV export
- Monthly summary:
	- Total income
	- Total expense
	- Net profit/loss
	- Chart visualization
- Category management (add/delete)
- Dark mode toggle
- Loading skeletons and toast notifications
- Basic PWA support (manifest + service worker)
- Multi-user data isolation by `userId`

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- MongoDB + Mongoose
- Zod validation
- JWT (`jose`) + bcrypt (`bcryptjs`)
- Recharts
- Sonner toasts

## Project Structure

```
app/
	(auth)/
	(app)/
	api/
components/
hooks/
lib/
models/
public/
types/
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env.local
```

3. Update `.env.local` values:

```env
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-very-long-random-secret-min-32-chars
```

4. Start dev server:

```bash
npm run dev
```

5. Open:

```txt
http://localhost:3000
```

## Production Notes

- Set `MONGODB_URI` and `JWT_SECRET` in your deployment environment.
- Use a strong random `JWT_SECRET` and rotate periodically.
- Session cookie is marked `httpOnly` and `secure` in production.
- Consider rate limiting auth and mutation routes before public deployment.

## Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - lint codebase

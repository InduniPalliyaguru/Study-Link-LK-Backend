# StudyLink LK: Backend API

REST API for **StudyLink LK**, a marketplace where Sri Lankan students buy, sell and pass on used textbooks, notes and past papers.

Built for the **ITS2020 Rapid Application Development** final coursework (IJSE, Graduate Diploma in Software Engineering).

- **Frontend repository:** https://github.com/InduniPalliyaguru/Study-Link-LK-Frontend.git
- **Live frontend:** `https://studylink-web.vercel.app/login`
- **Live API:** `https://studylink-api-delta.vercel.app/`

---

## What the system does

Students list used books with photos. An admin approves each listing. Buyers search and filter, send a request, and the seller accepts. Contact details are shared **only after the seller accepts**. The sale is confirmed with a **one-time handover code** (meet-up) or a "received" button (courier).

### Main features

| Area     | Features                                                                                                                         |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Accounts | Register, login, JWT access and refresh tokens, roles (`USER`, `ADMIN`), profile, password change                                |
| Listings | Create with up to 4 photos, edit, soft delete, admin approval, search, filters, sorting, pagination, free books                  |
| Requests | Send, accept, reject, cancel, **handover code**, courier shipping with tracking, auto-complete                                   |
| Trust    | Reviews and ratings (verified purchases), reports, saved books, safe meet-up points                                              |
| Admin    | Dashboard statistics, listing moderation, user block and delete, categories, reports, analytics                                  |
| Advanced | **AI listing assistant** and **AI cover scan** (Google Gemini), **email notifications** (Nodemailer), analytics with aggregation |

---

## Tech stack

Node.js, Express 5, **TypeScript**, MongoDB Atlas with **Mongoose**, **JWT** and **bcryptjs**, Zod (validation), Multer (uploads), Supabase Storage (images), Google Gemini API, Nodemailer. Deployed on **Vercel** (serverless) with **MongoDB Atlas**.

## Project structure

```
src/
  config/        database connection
  models/        Mongoose schemas (User, Listing, Request, Review, Report, Subject, GradeLevel, SavedListing, MeetupPoint)
  validators/    Zod schemas for every input
  middleware/    authenticate, requireRole, validate, upload, rate limit, error handler
  services/      business logic (auth, listing, request, review, report, admin, ai, email, notification, storage)
  controllers/   thin HTTP layer
  routes/        URL to controller mapping
  utils/         ApiError, response helper, token helper
  scripts/       seed scripts
  app.ts         Express app
  index.ts       local server (listen)
api/index.js     Vercel serverless entry
vercel.json      rewrites, function settings, cron job
```

Request flow: **route → middleware (auth, role, validation) → controller → service → model → MongoDB**. Errors are handled in one central error middleware.

---

## Run it locally

**Requirements:** Node.js 20 or newer, a MongoDB Atlas database, a Supabase project (storage bucket), optional Gemini key and Gmail app password.

```bash
git clone https://github.com/InduniPalliyaguru/Study-Link-LK-Backend.git
cd Study-Link-LK-Backend
npm install
```

Create a `.env` file (copy `.env.example`) and fill in the values:

| Variable                                                        | Meaning                                                  |
| --------------------------------------------------------------- | -------------------------------------------------------- |
| `PORT`                                                          | Local port (default 5000)                                |
| `MONGO_URL`                                                     | MongoDB Atlas connection string (with the database name) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`                       | Two long random strings                                  |
| `ACCESS_TOKEN_EXPIRES`, `REFRESH_TOKEN_EXPIRES`                 | For example `15m` and `7d`                               |
| `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_BUCKET`               | Image storage (bucket name `listings`, public)           |
| `GEMINI_API_KEY`, `GEMINI_MODELS`                               | AI features (models are a comma separated list)          |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Email (Gmail SMTP with an app password)                  |
| `CLIENT_URL`                                                    | Frontend address, used in email links                    |
| `CRON_SECRET`                                                   | Protects the auto-complete cron endpoint                 |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`                                 | Used only by the seed script to create the first admin   |

```bash
npm run seed            # subjects, grade levels and the admin account
npm run seed:listings   # optional sample books for development
npm run dev             # http://localhost:5000
```

| Script          | What it does                       |
| --------------- | ---------------------------------- |
| `npm run dev`   | Start with auto restart (tsx)      |
| `npm run build` | Compile TypeScript to `dist/`      |
| `npm start`     | Run the compiled app               |
| `npm run seed`  | Create the base data and the admin |

---

## API summary

Base path: `/api/v1`. Every response uses `{ success, message, data, meta? }`.

| Module              | Endpoints                                                                                                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth                | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `GET /auth/me`                                                                                                                                          |
| Catalog             | `GET /subjects`, `GET /grade-levels`, `GET /meetup-points`                                                                                                                                                     |
| Listings            | `GET /listings` (search, filters, sort, pagination), `GET /listings/:id`, `GET /listings/mine`, `POST /listings`, `PUT /listings/:id`, `DELETE /listings/:id`                                                  |
| Requests            | `POST /requests`, `GET /requests/sent`, `GET /requests/received`, `PATCH /requests/:id/respond`, `/cancel`, `/ship`, `/confirm`, `/complete`, `POST /requests/:id/regenerate-code`                             |
| Reviews and profile | `POST /reviews`, `GET /users/:id/reviews`, `GET /users/:id/public`, `PUT /users/me`, `PUT /users/me/password`                                                                                                  |
| Reports and saved   | `POST /reports`, `GET /saved`, `GET /saved/ids`, `PUT /saved/:id`, `DELETE /saved/:id`                                                                                                                         |
| AI                  | `POST /ai/listing-assist`, `POST /ai/scan-cover`                                                                                                                                                               |
| Admin               | `/admin/stats`, `/admin/analytics`, `/admin/listings` (approve, reject), `/admin/users` (block, delete), `/admin/requests`, `/admin/subjects`, `/admin/grade-levels`, `/admin/meetup-points`, `/admin/reports` |

Status codes used: 200, 201, 400, 401, 403, 404, 409, 410, 422, 429, 500, 502, 503.

---

## Security

- Passwords hashed with **bcryptjs**. The handover code is hashed too, locks after 5 wrong tries and expires after 7 days.
- **JWT** access tokens (short life) and refresh tokens (separate secret). The `authenticate` middleware checks the database on every request, so blocked or deleted users are stopped even with an old token.
- **Role-based authorization** on every admin route. Owners only can edit their own listings.
- Input validated with **Zod**. Mongoose schemas add a second layer.
- Contact details and delivery address are hidden until a request is accepted. Public APIs never return email or phone.
- Secrets live only in environment variables. `.env` is never committed.
- AI prompts treat user text as data (prompt injection protection), AI output is validated, and the price suggestion is limited around real market prices.

## Testing

Manual API and end-to-end tests were run for authentication, authorization, validation, the request and handover workflow, moderation, AI and email failure handling, security and responsive design. See the project report (Section 9) for the test cases and results.

## Known limitations

- JWT is stateless: after a password change or block, an old refresh token stays valid until it expires (the block itself is enforced on every request).
- The AI rate limit is kept in memory (per serverless instance).
- Gmail SMTP allows about 500 emails per day.
- No online payments, delivery integration or real-time chat (out of scope).

## Author

**Induni Palliyaguru**: Graduate Diploma in Software Engineering, IJSE.
Module: ITS2020 Rapid Application Development.

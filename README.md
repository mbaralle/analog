# Analog

A SvelteKit photo journal with a SQLite database and GitHub OAuth for admin access.

## Development

Use Node.js 22. Copy `.env.example` to `.env`, fill in the GitHub OAuth app
credentials and authorized GitHub login, and set `DATABASE_PATH=./data.db`.
For local OAuth, register `http://localhost:5173/auth/callback`.

```sh
npm ci
npm run dev
```

```sh
npm run check
npm test
npm run build
npm run test:runtime
```

For a standalone build, supply runtime environment variables and run `npm start`.
Unlike Vite development, adapter-node does not automatically load `.env`; with
Node.js 22 you can use `node --env-file=.env build`. Set `ORIGIN` to the URL
actually serving the production build. Production cookies require HTTPS.

## CapRover

The Docker image runs as UID/GID 1000, listens on port 3000, and stores SQLite at
`/data/data.db`. Mount a persistent volume at `/data` and use one replica.
Configure `CLIENT_ID`, `CLIENT_SECRET`, `AUTHORIZED_USER`, `DATABASE_PATH` and
`ORIGIN` at runtime. Builds require neither secrets nor a database.

Follow the [deployment, rehearsal, final cutover and rollback guide](docs/caprover.md)
for `analog.ankylosaurus.mbaralle.dev` and `analog.mbaralle.dev`.

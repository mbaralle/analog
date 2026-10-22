# CapRover migration: eoraptor to ankylosaurus

Temporary URL: `https://analog.ankylosaurus.mbaralle.dev`.
Final URL: `https://analog.mbaralle.dev`.

Keep eoraptor serving production throughout the rehearsal. Finish copying the
existing backup off eoraptor and check its checksum before starting. A rehearsal
backup is not the final migration backup. Do not disable `analog.service` until
the final hostname, database, writes, and GitHub OAuth have been verified.

## 1. Build and publish the branch

Use Node.js 22 and the committed lockfile:

```sh
npm ci
npm run check
npm test
npm run test:runtime
docker build --pull -t analog:caprover .
```

The image runs Node directly as `node` (UID/GID 1000), listens on port 3000,
defaults to `/data/data.db`, and checks native SQLite loading during the build.
Only build output and production dependencies enter the runtime image. `.env`,
databases and backups are excluded from the build context. No OAuth credentials
or database are required to build. The container health check exercises SQLite
through `/health`. CI repeats the Linux image and persistence tests.

Commit and push only the migration changes to the `caprover` branch. Keep local
database files and unrelated edits out of the commit. For CLI deployment,
`caprover deploy` uploads committed Git contents: commit the changes first and
select branch `caprover`. Alternatively connect the repository in the CapRover
Deployment tab and select `caprover` there. `captain-definition` uses `Dockerfile`.

## 2. Create and configure the CapRover app

On ankylosaurus:

1. Create app `analog` with **Has Persistent Data** enabled.
2. Add a persistent directory: container path `/data`, volume label
   `analog-data`. Keep **one replica**, pinned to ankylosaurus. Do not override
   persistent-app scaling or enable start-first deployments with overlapping
   database writers. Use stop-first updates.
3. Set **Container HTTP Port** to `3000`. Do not publish a database port or map a
   host port; use CapRover's HTTP proxy.
4. Add `analog.ankylosaurus.mbaralle.dev`, point its DNS to ankylosaurus, enable
   HTTPS and force HTTPS. Check both A and AAAA records; remove stale records.
5. Set the runtime environment variables below and deploy the branch. After
   changes to variables, let CapRover restart the container.

| Variable          | Rehearsal value                            |
| ----------------- | ------------------------------------------ |
| `NODE_ENV`        | `production` (also set by the image)       |
| `HOST`            | `0.0.0.0` (also set by the image)          |
| `PORT`            | `3000` (also set by the image)             |
| `DATABASE_PATH`   | `/data/data.db`                            |
| `ORIGIN`          | `https://analog.ankylosaurus.mbaralle.dev` |
| `CLIENT_ID`       | temporary GitHub OAuth app client ID       |
| `CLIENT_SECRET`   | temporary GitHub OAuth app secret          |
| `AUTHORIZED_USER` | your GitHub login                          |

Do not set `VITE_CLIENT_ID` or `VITE_CLIENT_SECRET`. These values are read only on
the server at runtime. Use the fixed public `ORIGIN` for adapter-node behind the
proxy; keep SvelteKit's form CSRF protection enabled. Do not configure forwarded
host headers or expose the container directly to the Internet.

Create a separate GitHub OAuth application for the rehearsal:

- Homepage: `https://analog.ankylosaurus.mbaralle.dev`
- Authorization callback: `https://analog.ankylosaurus.mbaralle.dev/auth/callback`

Retain the existing production OAuth app for the final hostname. A GitHub OAuth
app has one registered callback URL; using a temporary app avoids changing the
working production callback during rehearsal.

## 3. Identify the service, image and actual volume

The remaining commands run in a **Bash shell on ankylosaurus**, with Docker
administrator access. Use `sudo docker` if your account requires it. Inspect
the actual service and volume names; CapRover naming varies by installation.

```sh
docker service ls
ANALOG_SERVICE='REPLACE_WITH_ACTUAL_ANALOG_SERVICE_NAME'
docker service inspect "$ANALOG_SERVICE" --format '{{json .Spec.TaskTemplate.ContainerSpec.Mounts}}'
docker volume ls
ANALOG_VOLUME='REPLACE_WITH_ACTUAL_VOLUME_SOURCE_MOUNTED_AT_/data'
docker volume inspect "$ANALOG_VOLUME"
ANALOG_IMAGE=$(docker service inspect "$ANALOG_SERVICE" --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}')
docker service ps "$ANALOG_SERVICE"
```

Confirm the volume belongs to Analog and targets `/data`. Older CapRover
installations may prefix names with `captain--` or `srv-captain--`. Do not derive
the physical name from the label. Run imports on the node holding this volume.
Avoid concurrent deployments or configuration saves while the app is scaled
down for maintenance.

## 4. Create a consistent backup and transfer it

On eoraptor, inspect `systemctl cat analog.service` and identify the **actual**
database path from its environment/configuration. Do not assume the process's
working directory or use a local development database. Set `SOURCE_DB` to that
absolute path. Choose a new private backup directory; run as a user allowed to
read the database and any journal/WAL files.

```sh
SOURCE_DB='/REPLACE/WITH/ACTUAL/data.db'
umask 077
mkdir -p "$HOME/analog-migration/rehearsal"
sqlite3 "$SOURCE_DB" ".backup '$HOME/analog-migration/rehearsal/data.db'"
sqlite3 "$HOME/analog-migration/rehearsal/data.db" 'PRAGMA integrity_check;'
sqlite3 "$HOME/analog-migration/rehearsal/data.db" 'SELECT COUNT(*) FROM photo; SELECT COUNT(*) FROM tag; SELECT COUNT(*) FROM photo_tag;'
sha256sum "$HOME/analog-migration/rehearsal/data.db"
```

Integrity must return `ok`. Record the three row counts. SQLite's `.backup`
captures a consistent database while production keeps running. Do not copy just
a live `data.db`: committed data may still be in `data.db-wal`.

Copy the backup to a protected directory on ankylosaurus, directly or via your
workstation. Example from ankylosaurus (replace the SSH account and remote path):

```sh
umask 077
mkdir -p "$HOME/analog-migration/rehearsal"
scp USER@eoraptor:/ABSOLUTE/PATH/analog-migration/rehearsal/data.db "$HOME/analog-migration/rehearsal/data.db"
sha256sum "$HOME/analog-migration/rehearsal/data.db"
```

Confirm the source and destination SHA-256 hashes match. Also retain a copy off
both servers before the final cutover.

## 5. Import into the stopped application volume

Scale the new app down and wait until **no Analog task is running**:

```sh
docker service scale "${ANALOG_SERVICE}=0"
docker service ps "$ANALOG_SERVICE" --filter desired-state=running
docker ps --filter "label=com.docker.swarm.service.name=$ANALOG_SERVICE"
BACKUP_DIR="$HOME/analog-migration/rehearsal"
docker run --rm --user 0:0 --entrypoint node \
  --mount "type=volume,source=$ANALOG_VOLUME,target=/data" \
  --mount "type=bind,source=$BACKUP_DIR,target=/backup,readonly" \
  "$ANALOG_IMAGE" scripts/import-database.mjs /backup/data.db
docker service scale "${ANALOG_SERVICE}=1"
docker service logs --tail 100 "$ANALOG_SERVICE"
curl --fail https://analog.ankylosaurus.mbaralle.dev/health
```

The root maintenance helper validates the source, uses SQLite's backup API,
checks integrity and all three row counts, then preserves the previous database
and its sidecars under `/data/data.db.before-import-TIMESTAMP/`. It installs the
new database with UID/GID 1000, mode 0600, and makes `/data` writable only by that
user. The application itself always runs as `node`. Never run the helper while
an application task is accessing the volume. A leftover import lock or
`import.db` means a prior import needs inspection before retrying.

If initial startup reports `/data` permission errors, run this import before
trying OAuth. Host bind mounts need the same ownership as named volumes.

## 6. Rehearse and verify

- Open the temporary HTTPS URL. Compare the gallery, post dates/captions,
  tags, images and pagination/navigation with eoraptor. Images are external
  URLs in this application; verify they remain accessible.
- Confirm `/admin` and its create/edit actions reject unauthenticated requests.
- Sign in as `AUTHORIZED_USER`, create a disposable photo, edit it, and delete
  it. If testing with another GitHub account, confirm it is rejected.
- Verify GitHub redirects to the temporary `/auth/callback`. A denied consent
  or missing/mismatched state must fail without logging the user in.
- In browser storage, `analog_session` must be host-only, Secure, HttpOnly,
  SameSite=Lax, path `/`, with a 12-hour lifetime. No GitHub access token belongs
  in a cookie. State/PKCE cookies last 10 minutes and are cleared on callback.
- Log out via the POST form; confirm the previous session cannot access admin.
  Existing legacy cookies are cleared on successful login/logout.
- Sign in again, force a CapRover redeploy, then verify the database and session
  survive. Check logs for native module, permission, OAuth and CSRF errors.
- Confirm the running container UID is 1000 and service replicas are `1/1`.

Sessions are stored as hashes in the same SQLite database. The GitHub token is
discarded after user lookup. Changing `AUTHORIZED_USER` invalidates access by a
different user. Old deployment sessions will require login again. Rehearsal
data and sessions will be replaced by the final import.

## 7. Freeze writes and import the final backup

Lower the final hostname's DNS TTL ahead of the migration and allow its old TTL
to elapse. Finish all rehearsal checks before starting the write freeze.

1. Announce the maintenance window. Freeze the **new** app too: scale it to zero
   and confirm no running tasks. Do not make more rehearsal edits.
2. On eoraptor, stop `analog.service` temporarily with
   `sudo systemctl stop analog.service`. Leave it enabled for rollback. Put the
   old reverse proxy in maintenance mode, blocking all application traffic so
   clients with cached DNS cannot write to the old database. Verify no other
   process/worker writes to this database. If public reads must stay available,
   use a reviewed maintenance/proxy policy that blocks login and every write
   route; simply promising not to use admin is insufficient.
3. With eoraptor stopped, repeat the `.backup`, integrity, row-count, checksum
   and transfer steps into a **new** directory such as
   `$HOME/analog-migration/final`. Keep rehearsal and final copies distinct.
4. On ankylosaurus, keep the new service at zero replicas. Set
   `BACKUP_DIR="$HOME/analog-migration/final"` and repeat the import command from
   section 5, omitting its scale-up command until configuration is ready.
5. Compare the helper's reported final row counts to those recorded on
   eoraptor. Retain the fresh backup off both hosts.

## 8. Switch the production hostname and OAuth app

1. Add `analog.mbaralle.dev` to the same CapRover app. Arrange a valid certificate
   for the final hostname before relying on it. CapRover's normal HTTP-01
   certificate issuance may require DNS to point to ankylosaurus; if needed,
   briefly switch DNS during maintenance, issue the certificate, and keep the
   write freeze until checks pass. An existing certificate installed through
   your normal certificate workflow is another option.
2. Set `ORIGIN=https://analog.mbaralle.dev`. Set `CLIENT_ID` and `CLIENT_SECRET`
   from the production GitHub OAuth app whose callback is
   `https://analog.mbaralle.dev/auth/callback`. Keep
   `DATABASE_PATH=/data/data.db` and `AUTHORIZED_USER` unchanged.
3. Let configuration updates settle, ensure stop-first/one replica, then scale
   the service to one. Check logs and `/health`.
4. Before opening writes, use a workstation hosts-file override or
   `curl --resolve analog.mbaralle.dev:443:ANKYLOSAURUS_IP https://analog.mbaralle.dev/health`
   to test the production hostname on the new host with normal TLS validation.
   Use a browser hosts-file override for the full GitHub redirect flow; the
   registered OAuth app now matches the production hostname.
5. Point the final DNS A record and any AAAA record to ankylosaurus (update
   CNAME/proxy/CDN settings too if used). Verify authoritative DNS, several
   resolvers, HTTPS and the served application. Keep eoraptor in maintenance
   throughout DNS propagation.
6. Verify gallery/tag/post reads, expected final counts and newest entries,
   GitHub login, authorized admin writes, logout, restart persistence, and
   clean logs at **the final hostname**. A temporary-host cookie is not valid
   on the final host. Redirect the temporary hostname at the proxy or remove
   it; application forms and OAuth now use the canonical production origin.
7. Only after acceptance, on eoraptor run:

   ```sh
   sudo systemctl disable analog.service
   systemctl is-active analog.service
   systemctl is-enabled analog.service
   ```

   Expect `inactive` and `disabled` (these status commands may return nonzero).
   Retain the old database, service configuration and final backup for rollback.
   Schedule ongoing SQLite-consistent backups of the new volume.

## Rollback

Before new production writes, keep ankylosaurus stopped, restore DNS/proxy to
eoraptor, and `sudo systemctl start analog.service` there. Restore its proxy
from maintenance only after checking it. Production OAuth credentials and the
final callback can stay as they were.

After new production writes, freeze ankylosaurus first and take a consistent
backup. Reconcile/copy those writes back before reopening eoraptor; switching
DNS alone would lose data or create two diverging SQLite databases. Never let
both production instances accept writes. Validate any SQLite format/schema
compatibility before importing the new backup into the old Node/SQLite runtime.

## Dependency maintenance

This migration updates compatible dependencies, including SvelteKit 2 and
better-sqlite3 13. It retains Svelte 4 and Vite 5. The npm audit still reports
advisories in that framework/tooling tree (including Svelte SSR issues and the
older cookie package). Full remediation requires a separate Svelte/Vite/tooling
upgrade and validation. Do not treat a successful container build as a clean
dependency security audit. Do not expose the development server in production.

## References

- [CapRover persistent apps](https://caprover.com/docs/persistent-apps.html)
- [CapRover app configuration](https://caprover.com/docs/app-configuration.html)
- [Captain definition](https://caprover.com/docs/captain-definition-file.html)
- [SvelteKit adapter-node](https://svelte.dev/docs/kit/adapter-node)
- [GitHub OAuth web flow and callback matching](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- [better-sqlite3 releases](https://github.com/WiseLibs/better-sqlite3/releases)

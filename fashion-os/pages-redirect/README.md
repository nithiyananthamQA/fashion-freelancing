# fashion-freelancing.pages.dev

This folder is the whole of the Pages project behind
`https://fashion-freelancing.pages.dev`. It contains no site — it forwards
every path to the app.

## Why it forwards instead of hosting

The app is a **Worker**. `@astrojs/cloudflare` emits `_worker.js` together with
an `ASSETS` binding, and Pages refuses `ASSETS` as a reserved name, so a Pages
build of this repo cannot run. Hosting a second copy here would also mean a
second set of bindings and a second D1 database to keep in step with the first,
which drift apart the moment anyone forgets. One deployment stays the source of
truth and this hostname points at it.

## Redeploying it

    npx wrangler pages deploy pages-redirect --project-name fashion-freelancing --branch main

Deliberately **not** connected to GitHub. It used to be, and every push produced
a failed build, because Pages was trying to build an app it cannot host.

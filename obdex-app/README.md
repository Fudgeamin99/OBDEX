# OBDEX Vehicle Check

The OBDEX server and web app. The Android and iPhone app in `../obdex-mobile` uses this server for its data.

A mobile-first web app for UK car checks: enter a registration and get the full MOT history, a mileage record with clocking detection, and an HPI-style history check (finance, stolen, write-off, plates, keepers).

It runs on demo data out of the box. Add API keys to switch to real records.

## Run it

Needs Node 18 or newer. There are no packages to install.

```bash
cd obdex-app
cp .env.example .env     # optional until you have keys
npm start                # http://localhost:3000
```

Try the sample plates `OB21 DEX` (has finance, a mileage drop and a recall) and `AB12 CDE` (clean). Any other registration gets generated demo data until the real APIs are connected.

## Real MOT data (free)

MOT history comes from the DVSA MOT History API.

1. Apply at https://documentation.history.mot.api.gov.uk/ (free, approval usually takes a few days).
2. DVSA emails you a client ID, client secret, API key and token URL.
3. Put them in `.env` as `MOT_CLIENT_ID`, `MOT_CLIENT_SECRET`, `MOT_API_KEY` and `MOT_TOKEN_URL`, then restart.

The header chip saying "Demo data" disappears once both sources are live.

## Real tax data (free)

Tax status, tax due date and the extra vehicle details on the phone app's MOT and Tax Check screen come from the DVLA Vehicle Enquiry Service. Request a free key at https://developer-portal.driver-vehicle-licensing.api.gov.uk/ and set `DVLA_API_KEY` in `.env`.

## Real HPI data (paid)

Finance, stolen and write-off records only come from paid providers (for example HPI Check, Experian AutoCheck, CarVertical, or a reseller API such as UK Vehicle Data or Vehicle Data Global). Pick one, then:

1. Set `HPI_PROVIDER=http` plus `HPI_API_URL` and `HPI_API_KEY` in `.env`.
2. Edit `toObdex()` in `lib/hpi.js` to map the provider's response onto the OBDEX fields.

For providers that need more than one call, add a new adapter to the `providers` object in `lib/hpi.js`.

The mileage check does not need a provider: it is worked out from the MOT odometer readings.

## How it fits together

| Path | What it does |
| --- | --- |
| `server.js` | Serves the app and `GET /api/vehicle/:reg` |
| `lib/mot.js` | DVSA sign-in (OAuth client credentials) and MOT lookup |
| `lib/hpi.js` | Pluggable history-check provider |
| `public/js/app.js` | The whole front end: search, report, MOT timeline, HPI checks, mileage chart |
| `public/js/mock.js` | Demo data in the same shape as the real APIs |
| `public/assets/` | Logos and icons cut from the OBDEX logo pack |
| `scripts/build-preview.js` | Bundles a single-file demo into `dist/` |

API keys stay on the server; the browser only talks to `/api`. If the API cannot be reached (for example when the front end is hosted on its own), the app falls back to demo data.

## Design

Built from the OBDEX logo pack, as the Figma file could not be opened from here. Colours: OBDEX orange `#FF4900` on near-black `#151515`, with a light theme that follows the device setting. Type is Archivo (headings use its condensed width to echo the wordmark) with JetBrains Mono for figures.

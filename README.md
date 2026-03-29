# MeshChat · Release Package

Everything you need to build, distribute, and share MeshChat.

## What's in this folder

```
meshchat-release/
├── app.json                          Expo app config (bundle IDs, permissions, plugins)
├── eas.json                          EAS build profiles (development / preview / production)
├── build.sh                          One-shot setup + build script  ← START HERE
├── landing/
│   └── index.html                    Shareable install page (drop in your URLs)
└── .github/
    └── workflows/
        └── deploy-landing.yml        Auto-deploys landing/ to GitHub Pages on push
```

---

## Quick Start

### 1. Run the build script (takes ~25 min total)

```bash
# From your MeshChat project root:
cp -r path/to/meshchat-release/. .
chmod +x build.sh
./build.sh preview
```

The script will:
- Verify Node, npm, EAS CLI
- Log you into your Expo account
- Link your EAS project
- Install all npm dependencies
- Run `expo prebuild` to generate native folders
- Copy + patch the MeshRadio native module files
- Trigger iOS + Android builds on EAS servers
- Print your build tracking URLs

**What you'll need ready:**
- An [Expo account](https://expo.dev) (free)
- Apple ID with an active [Apple Developer Program](https://developer.apple.com) membership ($99/yr) for iOS
- (Optional) Google Play Console account for Android distribution

---

### 2. Watch your builds

EAS will print a URL like:
```
https://expo.dev/accounts/yourname/projects/meshchat/builds/abc-123
```

iOS builds take **15–25 min**. Android builds take **10–15 min**.

When complete, each build page shows a **Download** link (APK) or **Submit to TestFlight** button.

---

### 3. Get your install links

**iOS:**
After the build finishes:
```bash
# Auto-submit to TestFlight:
eas submit --platform ios --profile production
```
Then find your TestFlight link in App Store Connect → TestFlight tab.
It looks like: `https://testflight.apple.com/join/XXXXXXXX`

**Android:**
The APK download URL is shown directly on the EAS build page.
It looks like: `https://expo.dev/artifacts/eas/XXXXX.apk`

For internal sharing (no Play Store needed), use EAS's internal distribution URL directly.

---

### 4. Update the landing page

Open `landing/index.html` and edit the two lines at the top:

```js
const IOS_URL      = "https://testflight.apple.com/join/XXXXXXXX";
const ANDROID_URL  = "https://expo.dev/artifacts/eas/XXXXX.apk";
const IOS_READY    = true;
const ANDROID_READY = true;
```

---

### 5. Deploy the landing page (free, 30 seconds)

**Option A — GitHub Pages (recommended):**
```bash
# Push this repo to GitHub
git add landing/ .github/
git commit -m "Add install landing page"
git push

# Then go to: GitHub repo → Settings → Pages
# Source: Deploy from a branch → gh-pages
# Your page will be live at: https://yourname.github.io/meshchat
```

The GitHub Actions workflow (`.github/workflows/deploy-landing.yml`) will
auto-redeploy whenever you update `landing/index.html`.

**Option B — Netlify (drag and drop, 10 seconds):**
1. Go to [app.netlify.com](https://app.netlify.com)
2. Drag the `landing/` folder onto the deploy zone
3. Get a URL like `https://meshchat-abc123.netlify.app`

**Option C — Vercel:**
```bash
npm i -g vercel
vercel landing/
```

---

## Build profiles explained

| Profile       | iOS output   | Android output | Use for                          |
|---------------|-------------|----------------|----------------------------------|
| `development` | .ipa (dev)  | .apk (debug)   | Internal dev testing             |
| `preview`     | .ipa        | .apk           | Sharing with testers — no stores |
| `production`  | .ipa        | .aab           | App Store + Play Store release   |

Run a specific profile:
```bash
./build.sh production    # triggers production builds
./build.sh development   # triggers dev client builds
```

Or trigger individual platforms:
```bash
eas build --platform ios     --profile preview
eas build --platform android --profile preview
```

---

## Updating the app

After code changes:
```bash
# Bump version in app.json, then:
eas build --platform all --profile preview --auto-submit
```

For OTA JS-only updates (no rebuild needed):
```bash
eas update --branch preview --message "Fix message ordering"
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `eas: command not found` | `npm install -g eas-cli` |
| iOS build fails with "No credentials" | Run `eas credentials` and follow prompts |
| Android "duplicate class" error | Check package names match in all .java files |
| BLE not working on device | Check Info.plist entries and Xcode capabilities |
| Mesh peers not appearing | Test on physical devices only — simulator has no BLE |
| Firebase not connecting | Double-check .env values and Realtime DB rules |

---

## Share the install page

Once deployed, your install page URL is the one thing you share.
On iOS it opens TestFlight; on Android it downloads the APK directly.
The page auto-detects the visitor's OS and highlights the right button.

```
Share this:  https://yourname.github.io/meshchat
```

#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  MeshChat · EAS Build & Share Script
#  Run this once from your project root to:
#    1. Install/verify all tools
#    2. Link your Expo account
#    3. Configure credentials
#    4. Trigger iOS + Android builds on EAS
#    5. Print shareable install links
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

# ── Colours ────────────────────────────────────────────────────
GRN='\033[0;32m'; YLW='\033[1;33m'; RED='\033[0;31m'
CYN='\033[0;36m'; BLD='\033[1m'; RST='\033[0m'

info()    { echo -e "${CYN}[info]${RST}  $*"; }
success() { echo -e "${GRN}[ok]${RST}    $*"; }
warn()    { echo -e "${YLW}[warn]${RST}  $*"; }
error()   { echo -e "${RED}[error]${RST} $*"; exit 1; }
step()    { echo -e "\n${BLD}${GRN}▶ $*${RST}"; }

# ── Config — edit these before running ─────────────────────────
APP_SLUG="meshchat"
IOS_BUNDLE_ID="com.yourname.meshchat"
ANDROID_PACKAGE="com.yourname.meshchat"
BUILD_PROFILE="${1:-preview}"   # preview | production | development

echo ""
echo -e "${BLD}╔══════════════════════════════════════════╗${RST}"
echo -e "${BLD}║     MeshChat · EAS Build Setup           ║${RST}"
echo -e "${BLD}╚══════════════════════════════════════════╝${RST}"
echo ""
echo -e "Build profile: ${YLW}${BUILD_PROFILE}${RST}"
echo -e "iOS bundle ID: ${YLW}${IOS_BUNDLE_ID}${RST}"
echo -e "Android pkg:   ${YLW}${ANDROID_PACKAGE}${RST}"
echo ""

# ── Step 1: Verify tools ───────────────────────────────────────
step "Checking prerequisites"

check_tool() {
  if ! command -v "$1" &>/dev/null; then
    error "$1 not found. Install it first: $2"
  fi
  success "$1 found ($(command -v "$1"))"
}

check_tool node   "https://nodejs.org"
check_tool npm    "bundled with Node"
check_tool git    "https://git-scm.com"

NODE_VER=$(node -e "process.exit(parseInt(process.version.slice(1)) < 18 ? 1 : 0)" 2>&1 || true)
if ! node -e "process.exit(parseInt(process.version.slice(1)) < 18 ? 1 : 0)" 2>/dev/null; then
  error "Node.js 18+ required. Current: $(node --version)"
fi
success "Node.js $(node --version) (≥ 18 required)"

# Install EAS CLI if missing
if ! command -v eas &>/dev/null; then
  warn "EAS CLI not found — installing globally..."
  npm install -g eas-cli
fi
success "EAS CLI $(eas --version)"

# Install Expo CLI if missing
if ! command -v expo &>/dev/null; then
  warn "Expo CLI not found — installing globally..."
  npm install -g expo-cli
fi
success "Expo CLI ready"

# ── Step 2: Install npm dependencies ──────────────────────────
step "Installing project dependencies"

if [ ! -f "package.json" ]; then
  error "package.json not found. Run this script from your project root."
fi

npm install

# Install Expo modules needed by MeshChat
npm install \
  firebase \
  expo-sqlite \
  expo-crypto \
  expo-secure-store \
  expo-build-properties \
  @react-native-community/netinfo \
  --save

success "Dependencies installed"

# ── Step 3: Expo login ─────────────────────────────────────────
step "Expo account login"

EXPO_USER=$(eas whoami 2>/dev/null || echo "")
if [ -z "$EXPO_USER" ]; then
  info "Not logged in. Opening Expo login..."
  eas login
  EXPO_USER=$(eas whoami)
fi
success "Logged in as: ${EXPO_USER}"

# ── Step 4: EAS project init ───────────────────────────────────
step "Linking EAS project"

# Check if projectId already set in app.json
PROJECT_ID=$(node -e "
  try {
    const cfg = require('./app.json');
    const id = cfg.expo?.extra?.eas?.projectId;
    if (id && id !== 'YOUR_EAS_PROJECT_ID') process.stdout.write(id);
  } catch(e) {}
" 2>/dev/null || echo "")

if [ -z "$PROJECT_ID" ]; then
  info "Initialising EAS project..."
  eas init --id "$(eas project:init --non-interactive 2>/dev/null | grep -o '[a-f0-9-]\{36\}' | head -1)" \
    || eas init
  success "EAS project linked"
else
  success "EAS project already linked (${PROJECT_ID})"
fi

# ── Step 5: iOS credentials ────────────────────────────────────
step "iOS credentials"

if [[ "$OSTYPE" == "darwin"* ]]; then
  info "macOS detected — using Expo-managed credentials (recommended)"
  info "EAS will auto-generate and manage your iOS certificates."
  info "You'll be prompted to sign in with your Apple ID on first build."
  CRED_FLAG="--non-interactive"
else
  warn "Not on macOS — iOS builds will run on EAS servers."
  warn "Expo will manage your iOS credentials automatically."
  CRED_FLAG="--non-interactive"
fi
success "iOS credentials: EAS-managed (automatic)"

# ── Step 6: Android credentials ───────────────────────────────
step "Android credentials"

info "EAS will auto-generate and manage your Android keystore."
info "The keystore is stored securely on Expo's servers."
success "Android credentials: EAS-managed (automatic)"

# ── Step 7: Set bundle IDs ─────────────────────────────────────
step "Updating bundle identifiers in app.json"

node -e "
  const fs = require('fs');
  const cfg = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  cfg.expo.ios = cfg.expo.ios || {};
  cfg.expo.android = cfg.expo.android || {};
  cfg.expo.ios.bundleIdentifier = '${IOS_BUNDLE_ID}';
  cfg.expo.android.package = '${ANDROID_PACKAGE}';
  fs.writeFileSync('app.json', JSON.stringify(cfg, null, 2));
  console.log('app.json updated');
"
success "Bundle IDs set"

# ── Step 8: Copy EAS config ────────────────────────────────────
step "Verifying eas.json"

if [ ! -f "eas.json" ]; then
  warn "eas.json not found — copying from meshchat-release/"
  cp "$(dirname "$0")/eas.json" ./eas.json
fi
success "eas.json present"

# ── Step 9: Prebuild native code ──────────────────────────────
step "Generating native projects (expo prebuild)"

npx expo prebuild --clean --platform all 2>&1 | tail -20
success "Native projects generated in ios/ and android/"

# ── Step 10: Copy MeshRadio native module ─────────────────────
step "Installing MeshRadio native module"

# iOS
if [ -d "meshradio/ios" ] && [ -d "ios" ]; then
  IOS_TARGET="ios/$(ls ios/*.xcodeproj 2>/dev/null | head -1 | xargs basename | sed 's/.xcodeproj//' || echo "MeshChat")"
  mkdir -p "$IOS_TARGET"
  cp meshradio/ios/MeshRadio.h  "${IOS_TARGET}/MeshRadio.h"  2>/dev/null && success "Copied MeshRadio.h → ${IOS_TARGET}/" || warn "MeshRadio.h copy skipped"
  cp meshradio/ios/MeshRadio.mm "${IOS_TARGET}/MeshRadio.mm" 2>/dev/null && success "Copied MeshRadio.mm → ${IOS_TARGET}/" || warn "MeshRadio.mm copy skipped"
  echo ""
  warn "ACTION REQUIRED: Open ios/*.xcworkspace in Xcode and"
  warn "manually add MeshRadio.h + MeshRadio.mm to the project target."
  warn "See INTEGRATION.md → iOS Setup → Step 4 for details."
fi

# Android
if [ -d "meshradio/android" ] && [ -d "android" ]; then
  PKG_DIR="android/app/src/main/java/$(echo "$ANDROID_PACKAGE" | tr '.' '/')/meshradio"
  mkdir -p "$PKG_DIR"
  for f in meshradio/android/src/main/java/com/meshradio/*.java; do
    fname=$(basename "$f")
    # Update package declaration
    sed "s/^package com.meshradio;/package ${ANDROID_PACKAGE}.meshradio;/" "$f" > "${PKG_DIR}/${fname}"
  done
  success "Android Java files copied to ${PKG_DIR}/"

  # Register package in MainApplication.java
  MAIN_APP=$(find android -name "MainApplication.java" | head -1)
  if [ -n "$MAIN_APP" ]; then
    if ! grep -q "MeshRadioPackage" "$MAIN_APP"; then
      # Add import
      sed -i "s/import com.facebook.react.ReactApplication;/import com.facebook.react.ReactApplication;\nimport ${ANDROID_PACKAGE}.meshradio.MeshRadioPackage;/" "$MAIN_APP"
      # Add to getPackages()
      sed -i "s/new MainReactPackage()/new MainReactPackage(), new MeshRadioPackage()/" "$MAIN_APP"
      success "Registered MeshRadioPackage in MainApplication.java"
    else
      success "MeshRadioPackage already registered"
    fi
  fi
fi

# ── Step 11: Trigger EAS builds ───────────────────────────────
step "Triggering EAS cloud builds (profile: ${BUILD_PROFILE})"

echo ""
echo -e "${YLW}This will submit builds to Expo's servers.${RST}"
echo -e "${YLW}iOS builds take 15–25 min. Android builds take 10–15 min.${RST}"
echo ""
read -r -p "Proceed with both iOS + Android builds? [y/N] " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  warn "Builds skipped. Run manually:"
  echo "  eas build --platform ios     --profile ${BUILD_PROFILE}"
  echo "  eas build --platform android --profile ${BUILD_PROFILE}"
  exit 0
fi

echo ""
info "Starting Android build..."
ANDROID_BUILD_URL=$(eas build \
  --platform android \
  --profile "${BUILD_PROFILE}" \
  --non-interactive \
  --json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0].get('buildDetailsPageUrl',''))" 2>/dev/null || echo "")

info "Starting iOS build..."
IOS_BUILD_URL=$(eas build \
  --platform ios \
  --profile "${BUILD_PROFILE}" \
  --non-interactive \
  --json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0].get('buildDetailsPageUrl',''))" 2>/dev/null || echo "")

# ── Step 12: Print results ─────────────────────────────────────
echo ""
echo -e "${BLD}${GRN}╔══════════════════════════════════════════════════╗${RST}"
echo -e "${BLD}${GRN}║        Builds submitted successfully! 🎉          ║${RST}"
echo -e "${BLD}${GRN}╚══════════════════════════════════════════════════╝${RST}"
echo ""

if [ -n "$IOS_BUILD_URL" ]; then
  echo -e "  ${CYN}iOS build:${RST}     ${IOS_BUILD_URL}"
else
  echo -e "  ${CYN}iOS build:${RST}     Check https://expo.dev/accounts/${EXPO_USER}/projects/${APP_SLUG}/builds"
fi

if [ -n "$ANDROID_BUILD_URL" ]; then
  echo -e "  ${CYN}Android build:${RST} ${ANDROID_BUILD_URL}"
else
  echo -e "  ${CYN}Android build:${RST} Check https://expo.dev/accounts/${EXPO_USER}/projects/${APP_SLUG}/builds"
fi

echo ""
echo -e "  ${YLW}When builds finish (15–25 min):${RST}"
echo -e "  1. Download the iOS .ipa URL and Android .apk URL from the links above"
echo -e "  2. Paste them into ${BLD}landing/index.html${RST} (IOS_URL and ANDROID_URL placeholders)"
echo -e "  3. Deploy landing/ to GitHub Pages, Netlify, or Vercel for a shareable page"
echo ""
echo -e "  ${CYN}iOS TestFlight (optional):${RST}"
echo -e "  eas submit --platform ios --profile production"
echo ""
echo -e "  ${CYN}Android internal track:${RST}"
echo -e "  eas submit --platform android --profile production"
echo ""
success "Done. Monitor builds at https://expo.dev"

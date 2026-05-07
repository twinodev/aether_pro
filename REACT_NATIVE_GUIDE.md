# React Native Migration Guide

This guide outlines the steps to convert **Swiss Toolbox Pro** into a native mobile application using React Native.

## 1. Project Initialization
Initialize a new React Native project (recommended: Expo for cross-platform ease).
```bash
npx create-expo-app SwissToolboxMobile
```

## 2. Core Dependencies Mapping
Swap web-only libraries for React Native equivalents:
- **Styling**: `tailwind-rn` or `nativewind` (to preserve Tailwind productivity).
- **Icons**: `lucide-react-native`.
- **Animations**: `moti` or `react-native-reanimated`.
- **Routing**: `react-navigation` (Stack or Drawer).

## 3. Tool-Specific Migrations
### QR & Barcode (Scanner)
- **Web**: HTML5 `<video>` + `jsQR`.
- **Native**: `expo-barcode-scanner` or `react-native-vision-camera`.

### File Converter (FFmpeg)
- **Web**: `@ffmpeg/ffmpeg` (Wasm).
- **Native**: `react-native-ffmpeg` (Native Binary).
- *Warning*: Native FFmpeg binaries are significantly faster and more capable than Wasm in mobile environments.

### Doc Scanner
- **Web**: Canvas-based filters.
- **Native**: `react-native-document-scanner-plugin` or `react-native-perspective-image-cropper`.

### AI Genius (Gemini API)
- The Gemini API integration remains the same (Fetch/Google SDK).

## 4. UI Architecture Changes
- **Layout**: Replace `div`, `section`, `nav` with `View`.
- **Text**: Replace `h1`, `p`, `span` with `Text`.
- **Interactions**: Replace `button` with `TouchableOpacity` or `Pressable`.
- **Scrolling**: Use `ScrollView` or `FlatList` for long lists.

## 5. Offline Capabilities
- **Web**: Service Workers + Cache API.
- **Native**: `AsyncStorage` for simple data, `SQLite` for complex data. Files can be stored in the native filesystem using `expo-file-system`.

## 6. Deployment
- **iOS**: App Store via Xcode.
- **Android**: Google Play Store via Android Studio / EAS Build.

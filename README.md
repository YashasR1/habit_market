# MARHABS 📈

> Your personal stock market for productivity.

[![Web App Deployment](https://img.shields.io/badge/Web_App-Netlify-blue?style=for-the-badge&logo=netlify)](https://your-netlify-link-here.netlify.app/)
[![React Native](https://img.shields.io/badge/React_Native-Expo-black?style=for-the-badge&logo=expo)](https://expo.dev/)

MARHABS is a beautifully crafted, open-source productivity ecosystem built on Expo and React Native. Instead of treating habits as mundane checklists, MARHABS gamifies your daily routine by transforming your habit completion rates into a live, interactive stock market candlestick chart.

Beyond core habit tracking, MARHABS introduces **The POD (Personal Operating Directory)** — a comprehensive workspace blending offline-first private markdown editing with real-time collaborative interactive canvases.

---

## 🌐 Interactive Web Simulation

Experience MARHABS instantly through our tailored web deployment on Netlify!

👉 **[Try the MARHABS Web Simulation Here](https://your-netlify-link-here.netlify.app/)** _(Link to be updated)_

The web deployment features a custom simulation mode. While native-exclusive integrations (like background push notifications and SQLite persistence) are optimized for iOS/Android, the Web App provides dummy data rendering and a fully interactive UI tour, allowing you to explore the rich architecture of the POD and the Habit Market chart seamlessly from your browser!

---

## 🚀 Key Features

### 📊 The Habit Market

- **Dynamic Candlestick Charts:** Watch your productivity "stock" rise and fall based on your daily habit completion rate.
- **Visual Streaks:** A beautiful green chart means you're dominating your routine; a red chart signals an opportunity to bounce back.
- **Weekly History:** Track your wins, total completions, and best/worst days across an intuitive dashboard.

### 👥 Collaborative Pods (ASSIGN)

- **Shared Canvases:** Create distinct projects inside nested folders that everyone in your POD can view and freely edit.
- **Interactive Checklists & Notes:** Embed fluid, interactive task lists right inside your shared canvas.
- **Rich Media Gallery:** Securely upload images, compress videos, and attach media seamlessly into the shared workspace.
- **Real-Time Push Notifications:** Whenever a collaborator updates a checklist or uploads a photo, everyone in the project gets an instant Expo Push Notification.

### 📝 Solo Tools (LIBRARY)

- **Multi-Day To-Do Editor:** Plan your days in advance with separate checklists for the future. Older days automatically auto-delete at midnight!
- **Local-First Markdown Notes:** Keep private documentation, journals, and ideas natively separated from your shared assignments via secure, offline SQLite storage.

---

## 🛠️ Tech Stack & Architecture

- **Framework:** [Expo](https://expo.dev) / [React Native](https://reactnative.dev)
- **Routing:** [Expo Router](https://docs.expo.dev/router/introduction/) (Advanced File-based routing)
- **Database / Backend:** [Firebase Firestore](https://firebase.google.com/products/firestore) (For collaborative web sockets and storage)
- **Storage:** [Firebase Cloud Storage](https://firebase.google.com/products/storage) (For rich media uploads and compression mapping)
- **UI & Animations:** Modern Vanilla Stylesheets powered by `react-native-reanimated`
- **Analytics:** Data visualization constructed with `react-native-wagmi-charts`

---

## 💻 Getting Started (Local Setup)

Want to clone MARHABS and run it locally on your iOS/Android simulator? Follow these steps:

### 1. Clone the Repository

```bash
git clone https://github.com/YashasR1/habit_market.git
cd habit_market
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Connect to Firebase

MARHABS relies on Firebase for its collaborative Pods and media uploads. Provide your own Firebase configuration:

1. Create a project at the [Firebase Console](https://console.firebase.google.com/).
2. Enable the **Firestore Database** and **Firebase Storage**.
3. Create a `.env` file in the root directory and add your unique API keys directly from the Firebase console (refer to the standard Expo `.env` requirements).

### 4. Start the Application

Run the Expo development server:

```bash
npx expo start
```

- Press `i` to launch on an **iOS Simulator**.
- Press `a` to launch on an **Android Emulator**.
- Press `w` to launch the **Web Simulation App**.
- Scan the QR code with the **Expo Go** app on your physical device.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE). You are completely free to clone it, modify it, use it for commercial projects, or build your own productivity startup on top of it!

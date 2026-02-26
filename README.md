# MARHABS 📈

> Your personal stock market for productivity.

MARHABS is an open-source, mobile-first habit tracker and collaborative workspace built with Expo and React Native. Instead of treating habits as simple checklists, MARHABS gamifies your productivity by turning your daily completions into a live stock market chart. It also features powerful "Pod" collaborative features to manage shared workspaces and projects with friends or colleagues in real-time.

---

## 🚀 Features

### 📊 The Habit Market

- **Dynamic Candlestick Charts:** Watch your productivity "stock" rise and fall based on your daily habit completion rate.
- **Visual Streaks:** A beautiful green chart means you're doing great; a red chart means it's time to bounce back!
- **Weekly History:** Track your wins, total completions, and best/worst days across the week.

### 👥 Collaborative Pods (ASSIGN)

- **Shared Canvases:** Create distinct projects inside folders that everyone in your Pod can view and freely edit.
- **Checklists & Notes:** Add interactive task lists right inside the canvas.
- **Media Gallery:** Upload images and videos directly into the shared workspace.
- **Real-Time Push Notifications:** Whenever someone updates a checklist or uploads a photo, everyone else in the project gets an instant Expo Push Notification.

### 📝 Solo Tools

- **Multi-Day To-Do Editor:** Plan out your days in advance with separate checklists for the future. Older days automatically auto-delete at midnight!
- **Library Notes:** Keep private documentation and ideas natively separated from your shared assignments.

---

## 🛠️ Tech Stack & Architecture

- **Framework:** [Expo](https://expo.dev) / [React Native](https://reactnative.dev)
- **Navigation:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Database / Backend:** [Firebase Firestore](https://firebase.google.com/products/firestore) (For collaborative workspaces)
- **Storage:** [Firebase Cloud Storage](https://firebase.google.com/products/storage) (For media uploads)
- **UI & Animations:** Vanilla React Native StyleSheets & `react-native-reanimated`
- **Charts:** `react-native-wagmi-charts`

---

## 💻 Getting Started (Local Setup)

Want to clone MARHABS and run it locally? Follow these steps:

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

MARHABS relies on Firebase for its collaborative Pods and media uploads. You will need to bring your own Firebase project.

1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database** and **Firebase Storage**.
3. Rename the `firebaseConfig.example.ts` file located in the root directory to `firebaseConfig.ts`.
4. Copy your unique API keys directly from the Firebase console and paste them into that file.

### 4. Start the App!

Run the Expo development server:

```bash
npx expo start
```

You can press `i` to run it on an iOS simulator, `a` to run it on an Android emulator, or scan the QR code with the Expo Go app on your physical device.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE). You are completely free to clone it, modify it, use it for commercial projects, or build your own startup on top of it!

# Cognito
<img width="512" height="250" alt="play store feature graphic (1)" src="https://github.com/user-attachments/assets/4266c3c3-b97d-4baa-bc89-9674cb3ae7e7" />


Cognito is a modern, mobile-first quiz app that lets you play solo or challenge friends in real-time multiplayer trivia. Built with **React Native**, **Expo**, and **Appwrite**, Cognito offers a smooth, animated user experience and robust real-time features.

---

## 🚀 Features

-   **Solo Play:** Test your knowledge with a wide range of quiz questions across multiple categories.
-   **Multiplayer Rooms:** Create or join real-time game rooms and compete with friends.
-   **User Authentication:** Secure sign up, login, and profile management.
-   **Animated UI:** Smooth transitions and engaging feedback using React Native’s Animated API.
-   **Stats Tracking:** Track your quiz performance and review your results.
-   **Responsive Design:** Looks great on all devices with NativeWind/Tailwind CSS.
-   **Category Selection:** Choose specific categories or play with a mix of questions.
-   **Account Management:** Delete your profile, manage your data, and more.

---

## 🛠️ Tech Stack & Concepts

-   **React Native & Expo:** Cross-platform mobile development.
-   **Expo Router:** File-based navigation for seamless routing.
-   **Appwrite:** Backend-as-a-Service for authentication, database, and real-time features.
-   **Zustand:** Lightweight state management.
-   **TypeScript:** Type safety and better developer experience.
-   **NativeWind/Tailwind CSS:** Utility-first styling for React Native.
-   **Animated API:** For smooth UI transitions and feedback.
-   **AsyncStorage:** Local data persistence.
-   **Real-time Multiplayer Logic:** Sockets and live updates for game rooms.
-   **Custom Hooks & Components:** For code reuse and clean architecture.

---

## 📲 Getting Started

1.  **Clone the repo:**
    ```bash
    git clone [https://github.com/your-username/Cognito-Quiz-App.git](https://github.com/your-username/Cognito-Quiz-App.git)
    cd Cognito-Quiz-App
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    Copy `.env.example` to `.env` and fill in your Appwrite endpoint and project ID.
4.  **Start the app:**
    ```bash
    npx expo start
    ```

---

### 📸 Screenshots
![WhatsApp Image 2025-08-14 at 12 58 17 PM (2)](https://github.com/user-attachments/assets/b59fb47f-5b56-41d4-8c68-348d2b8b3116)
![WhatsApp Image 2025-08-14 at 12 58 17 PM (1) (1)](https://github.com/user-attachments/assets/7deba827-c4fa-4616-9ccc-232c46967320)
![WhatsApp Image 2025-08-14 at 12 58 18 PM (3)](https://github.com/user-attachments/assets/601785fd-bc38-4d8e-b9e4-bd9aaab1db73)
![WhatsApp Image 2025-08-14 at 12 58 39 PM (1)](https://github.com/user-attachments/assets/a9028146-5e1e-4e94-820e-3439971fadf5)
![WhatsApp Image 2025-08-14 at 12 58 18 PM (1) (1)](https://github.com/user-attachments/assets/e78487f8-6a79-4170-b741-d9af34dc8729)
![WhatsApp Image 2025-08-14 at 12 58 18 PM (2) (1)](https://github.com/user-attachments/assets/1f982df1-c11b-4e6a-b536-f6f37a7a56e2)
![WhatsApp Image 2025-08-14 at 1 00 57 PM (1)](https://github.com/user-attachments/assets/3e30ee13-e1bd-4aae-b4f9-c4bf409f5246)






### ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-endpoint/v1


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
![2](https://github.com/user-attachments/assets/52f03d7b-4350-4d1e-99a3-cdff0254fb63)
![3](https://github.com/user-attachments/assets/eac02b95-46a0-4d04-8847-655b1291ed42)
![6](https://github.com/user-attachments/assets/7e6af007-830a-49fe-a40c-cca011064472)
![5](https://github.com/user-attachments/assets/5bd789fa-18b2-4532-9e9b-8949de8d3166)
![1](https://github.com/user-attachments/assets/5e210f60-c58f-4979-97a9-8e938bedbc8f)
![4](https://github.com/user-attachments/assets/54aad312-80e9-4026-9536-37bf0df94b30)






### ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-endpoint/v1


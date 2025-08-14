# Cognito
<img width="1024" height="500" alt="play store feature graphic (1)" src="https://github.com/user-attachments/assets/4266c3c3-b97d-4baa-bc89-9674cb3ae7e7" />


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

![WhatsApp Image 2025-08-14 at 12 32 53 PM (1)](https://github.com/user-attachments/assets/2784c04c-11a1-4ef1-b772-3111d101d375)
![WhatsApp Image 2025-08-14 at 12 32 53 PM (1)](https://github.com/user-attachments/assets/490da2be-b9d3-4e12-bb39-18a5b4def1df)
![WhatsApp Image 2025-08-14 at 12 35 02 PM](https://github.com/user-attachments/assets/827c2aee-5f7f-4a21-be2e-a374dc9b67d3)
![WhatsApp Image 2025-08-14 at 12 32 55 PM](https://github.com/user-attachments/assets/98b583f2-bc24-4112-a7e9-ef97e6fd6bd0)
![WhatsApp Image 2025-08-14 at 12 32 53 PM](https://github.com/user-attachments/assets/3eab66f6-498e-47db-8ec3-40a95fbe4572)
![WhatsApp Image 2025-08-14 at 12 32 54 PM](https://github.com/user-attachments/assets/d5049c12-b42e-4c90-b17b-eae0affe7fc3)
![WhatsApp Image 2025-08-14 at 12 32 54 PM (2)](https://github.com/user-attachments/assets/7a2c361b-4e54-4ec0-bcef-ab9e8a624a5c)




### ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-endpoint/v1


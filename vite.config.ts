import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 👈 এই নতুন প্লাগইনটি লাগবে

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 👈 প্লাগইনটি এখানে অ্যাক্টিভেট করে দিলাম
  ],
})
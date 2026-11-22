/**
 * Set these in mobile/.env (local) or as EAS environment variables (builds):
 *   EXPO_PUBLIC_API_URL=https://your-api.vercel.app
 *   EXPO_PUBLIC_APP_KEY=<same value as APP_API_KEY on Vercel, optional>
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000").replace(/\/$/, "");
export const APP_KEY = process.env.EXPO_PUBLIC_APP_KEY || "";

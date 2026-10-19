import type { Config } from "tailwindcss";
const config: Config = {
 content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
 theme: {
 extend: {
 colors: {
 spicy: {
 400: "#f472b6", 500: "#ec4899", 600: "#db2777",
 },
 },
 },
 },
 plugins: [],
};
export default config;

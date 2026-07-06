var _a;
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    plugins: [react()],
    define: {
        "process.env.NODE_ENV": JSON.stringify((_a = process.env.NODE_ENV) !== null && _a !== void 0 ? _a : "development"),
    },
});

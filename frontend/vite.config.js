import {defineConfig} from "vite";

const root = "src";
export default defineConfig({
    root,
    build: {
        outDir: "../dist",
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main:  root + "/index.html",
            },
            external : [
                /^node:.*/,
            ]
        }
    }
});
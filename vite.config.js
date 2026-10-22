import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// host liberado para o Codespaces abrir a pré-visualização pela porta encaminhada
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173, allowedHosts: true },
});

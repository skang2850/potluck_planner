// client/src/api.ts
const API = import.meta.env.VITE_API_URL ?? "";
export const getUsers = () => fetch(`${API}/api/users`).then((r) => r.json());

const config = {
  BASE_URL:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? "http://localhost:5000" : "https://smart-complaint-management-ddb3.onrender.com"),
};

export default config;
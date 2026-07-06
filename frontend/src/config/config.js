const isLocal =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

const config = {
  BASE_URL: isLocal
    ? "http://localhost:5000"
    : "https://smart-complaint-management-ddb3.onrender.com",
};

export default config;
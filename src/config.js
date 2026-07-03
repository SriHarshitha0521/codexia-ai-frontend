// Central place for backend URLs. Override with a .env file:
//   REACT_APP_API_BASE_URL=http://localhost:8080
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

export const ENDPOINTS = {
  explain: `${API_BASE_URL}/api/code/codelevelexplain`,
  ask: `${API_BASE_URL}/api/code/ask`,
  hover: `${API_BASE_URL}/api/hover`,
};

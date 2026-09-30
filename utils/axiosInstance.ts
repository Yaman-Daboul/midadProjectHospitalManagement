import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://hospital-backend-cdz9.onrender.com/api/v1",
  withCredentials: true,
});

// نتحقق إذا الكود يعمل داخل المتصفح قبل استخدام sessionStorage
const getAccessToken = () => {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("accessToken");
  }
  return null;
};

const setAuthorizationHeader = (token: string | null) => {
  if (token) {
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete axiosInstance.defaults.headers.common.Authorization;
};

// نضبط الهيدر أول ما يشتغل المتصفح
if (typeof window !== "undefined") {
  setAuthorizationHeader(getAccessToken());
}

// Interceptor
axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
export const clearAuthTokens = () => {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("accessToken");
  }
  delete axiosInstance.defaults.headers.common.Authorization;
};

export default axiosInstance;


// import axios from "axios";

// const axiosInstance = axios.create({
//   baseURL: "https://hospital-backend-cdz9.onrender.com/api/v1/",
//   withCredentials: true,
// });

// const getAccessToken = () => sessionStorage.getItem("accessToken");

// const setAuthorizationHeader = (token: string | null) => {
//   if (token) {
//     axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
//     return;
//   }

//   delete axiosInstance.defaults.headers.common.Authorization;
// };

// setAuthorizationHeader(getAccessToken());

// axiosInstance.interceptors.request.use((config) => {
//   const token = getAccessToken();

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

// export const setAuthTokens = (accessToken: string, refreshToken: string) => {
//   sessionStorage.setItem("accessToken", accessToken);
//   sessionStorage.setItem("refreshToken", refreshToken);
//   setAuthorizationHeader(accessToken);
// };

// export const clearAuthTokens = () => {
//   sessionStorage.removeItem("accessToken");
//   sessionStorage.removeItem("refreshToken");
//   setAuthorizationHeader(null);
// };

// export default axiosInstance;

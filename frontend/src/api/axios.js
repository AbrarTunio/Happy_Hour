import axios from "axios";
const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json',
        // Add other default headers if needed
        //
        //
        //
    },
    withCredentials: true, // Include cookies for cross-origin requests if needed
});

export default axiosClient;

import axios from 'axios';

// Set default base URL for API requests
// Update this to match the port your backend server is running on
axios.defaults.baseURL = 'http://localhost:5000';

export default axios;

import axios from 'axios'

// API base URL - uses Vite proxy in dev, direct URL in production
const API_BASE = import.meta.env.DEV ? '/api' : 'http://localhost:8001'

export const apiClient = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 600000, // 10 minutes for long generation tasks
})

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => {
        // Unwrap the standard API response format
        if (response.data?.code === 200) {
            return response.data.data
        }
        return response.data
    },
    (error) => {
        const message = error.response?.data?.error || error.message || 'API Error'
        console.error('API Error:', message)
        return Promise.reject(new Error(message))
    }
)

// Health check
export const checkHealth = () => apiClient.get('/health')

// List available models
export const listModels = () => apiClient.get('/list_models')

// Get random sample parameters
export const getRandomSample = (sampleMode = 'simple_mode') =>
    apiClient.post('/random_sample', { sample_mode: sampleMode })

// Format lyrics/caption via LLM
export const formatInput = (params) =>
    apiClient.post('/format_input', params)

// Release a generation task
export const releaseTask = (params) =>
    apiClient.post('/release_task', params)

// Query task results
export const queryResult = (taskIdList) =>
    apiClient.post('/query_result', { task_id_list: taskIdList })

// Download audio file
export const getAudioUrl = (path) => {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    return `${API_BASE}/audio/${encodeURIComponent(cleanPath)}`
}

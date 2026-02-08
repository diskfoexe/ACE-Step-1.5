import { create } from 'zustand'
import { releaseTask, queryResult, createRandomSample, formatInput, getAudioUrl } from '../lib/api'

const DEFAULT_GENERATION_PARAMS = {
    // Prompt section
    prompt: '',
    lyrics: '',
    vocalLanguage: 'unknown',
    isInstrumental: false,

    // Task type (for remix)
    taskType: 'text2music',
    referenceAudio: null,
    srcAudio: null,
    audioCodes: '',

    // Fine-tune settings
    bpm: null,
    keyScale: '',
    timeSignature: '',
    audioDuration: -1,
    batchSize: 2,
    audioFormat: 'mp3',

    // Generation options
    think: true,
    allowLmBatch: true,
    useCotCaption: true,

    // Advanced LM settings
    lmNegativePrompt: 'NO USER INPUT',
    lmTemperature: 0.85,
    lmCfgScale: 2.0,
    lmTopK: 0,
    lmTopP: 0.9,
    useCotMetas: true,
    useCotLanguage: true,

    // Service Config
    model: null, // DiT model
    lmModel: null,
    backend: 'vllm',
    offloadToCpu: false,
    offloadDitToCpu: false,
    useFlashAttention: true,

    // Hidden params
    inferenceSteps: 8,
    seed: '-1',
    randomSeed: true,
    shift: 3.0,
    inferMethod: 'ode',
    guidanceScale: 7.0,
}

export const useGenerationStore = create((set, get) => ({
    // Form parameters
    params: { ...DEFAULT_GENERATION_PARAMS },

    // Generation state
    isGenerating: false,
    currentTaskId: null,
    pollingInterval: null,

    // Results
    results: [],
    currentBatchIndex: 0,
    totalBatches: 1,
    generationStatus: '',

    // LoRA state
    loraLoaded: false,
    loraPath: '',
    loraScale: 1.0,
    useLora: false,

    // Actions
    setParam: (key, value) => set((state) => ({
        params: { ...state.params, [key]: value }
    })),

    setParams: (updates) => set((state) => ({
        params: { ...state.params, ...updates }
    })),

    resetParams: () => set({ params: { ...DEFAULT_GENERATION_PARAMS } }),

    // Async Actions
    generateMusic: async () => {
        const { params, isGenerating } = get();
        if (isGenerating) return;

        set({ isGenerating: true, generationStatus: 'Starting generation...', results: [] });

        try {
            // Prepare payload
            const payload = {
                prompt: params.prompt,
                lyrics: params.lyrics,
                vocal_language: params.vocalLanguage,
                // ... map other params as needed by backend
                bpm: params.bpm,
                key_scale: params.keyScale,
                time_signature: params.timeSignature,
                audio_duration: params.audioDuration,
                batch_size: params.batchSize,
                audio_format: params.audioFormat,

                thinking: params.think,
                allow_lm_batch: params.allowLmBatch,
                lm_temperature: params.lmTemperature,
                lm_cfg_scale: params.lmCfgScale,
                lm_top_k: params.lmTopK,
                lm_top_p: params.lmTopP,
                lm_negative_prompt: params.lmNegativePrompt,

                // Task specific
                task_type: params.taskType,

                // Service Config
                model: params.model,
                lm_model_path: params.lmModel,
                lm_backend: params.backend,
                offload_to_cpu: params.offloadToCpu,
                offload_dit_to_cpu: params.offloadDitToCpu,
                use_flash_attention: params.useFlashAttention,

            };

            const response = await releaseTask(payload);

            if (response.code !== 200) {
                throw new Error(response.error || 'Failed to start generation');
            }

            const taskId = response.data.task_id;
            set({ currentTaskId: taskId, generationStatus: 'Processing...' });

            // Start polling
            get().startPolling(taskId);

        } catch (error) {
            console.error('Generation failed:', error);
            set({ isGenerating: false, generationStatus: `Error: ${error.message}` });
        }
    },

    startPolling: (taskId) => {
        // Clear existing interval if any
        const existingInterval = get().pollingInterval;
        if (existingInterval) clearInterval(existingInterval);

        const interval = setInterval(async () => {
            try {
                const response = await queryResult(JSON.stringify([taskId]));

                // Backend returns wrapped response
                if (response.code === 200 && response.data && response.data.length > 0) {
                    const taskData = response.data[0];

                    if (taskData.status === 1) { // Succeeded
                        const resultData = JSON.parse(taskData.result);

                        // Transform results for UI
                        const formattedResults = resultData.map(item => ({
                            audioUrl: getAudioUrl(item.file), // Use helper to format URL
                            prompt: get().params.prompt,
                            metas: {
                                duration: item.duration,
                                // Add other metas if available in result
                            }
                        }));

                        set({
                            results: formattedResults,
                            isGenerating: false,
                            generationStatus: 'Completed',
                            pollingInterval: null
                        });
                        clearInterval(interval);
                    }
                }
            } catch (error) {
                console.error('Polling error:', error);
                // Don't stop polling on transient network errors, but maybe log it
            }
        }, 2000); // Poll every 2 seconds

        set({ pollingInterval: interval });
    },

    stopPolling: () => {
        const { pollingInterval } = get();
        if (pollingInterval) {
            clearInterval(pollingInterval);
            set({ pollingInterval: null });
        }
    },

    randomizePrompt: async () => {
        try {
            const response = await createRandomSample({ sample_type: 'simple_mode' });
            if (response.code === 200) {
                const data = response.data;
                set((state) => ({
                    params: {
                        ...state.params,
                        prompt: data.caption || state.params.prompt,
                        lyrics: data.lyrics || state.params.lyrics,
                        bpm: data.bpm,
                        keyScale: data.key_scale,
                        timeSignature: data.time_signature,
                        vocalLanguage: data.vocal_language || 'unknown',
                    }
                }));
            }
        } catch (error) {
            console.error('Random prompt failed:', error);
        }
    },

    // ... Keep existing setters ...
    setGenerating: (status) => set({ isGenerating: status }),

    setTaskId: (taskId) => set({ currentTaskId: taskId }),

    setResults: (results) => set({ results }),

    addResults: (newResults) => set((state) => ({
        results: [...state.results, ...newResults]
    })),

    setGenerationStatus: (status) => set({ generationStatus: status }),

    setBatchIndex: (index) => set({ currentBatchIndex: index }),

    setTotalBatches: (total) => set({ totalBatches: total }),

    // LoRA actions
    setLoraLoaded: (loaded, path = '') => set({
        loraLoaded: loaded,
        loraPath: path,
    }),

    setLoraScale: (scale) => set({ loraScale: scale }),

    setUseLora: (use) => set({ useLora: use }),

    // Clear all results
    clearResults: () => {
        get().stopPolling();
        set({
            results: [],
            currentBatchIndex: 0,
            totalBatches: 1,
            generationStatus: '',
            isGenerating: false,
        })
    },

    prepareRemix: (result) => set((state) => ({
        params: {
            ...state.params,
            taskType: 'remix', // or 'continuing' depending on logic
            referenceAudio: result.audioUrl,
            prompt: result.prompt,
            // ... copy other relevant metas
        }
    })),
}))

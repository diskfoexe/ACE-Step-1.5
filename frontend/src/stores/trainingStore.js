import { create } from 'zustand'
import {
    scanDirectory,
    autoLabelDataset,
    preprocessDataset,
    startTraining,
    stopTraining,
    getTrainingStatus,
    saveDataset,
    loadDataset,
    exportLoRA,
    updateSample
} from '../lib/api'

export const useTrainingStore = create((set, get) => ({
    // Dataset State
    datasetName: 'new_dataset',
    datasetPath: '',
    scanStatus: '',
    samples: [],

    // Dataset Settings
    customTag: '',
    tagPosition: 'append',
    allInstrumental: false,
    genreRatio: 0.5,

    // Preprocessing State
    preprocessStatus: '',
    isPreprocessing: false,

    // Training State
    isTraining: false,
    trainingStatus: '',
    trainingLogs: [],
    lossHistory: [],
    tensorDir: '',

    // Training Config
    loraRank: 32,
    loraAlpha: 32,
    learningRate: 1e-4,
    batchSize: 1,
    epochs: 10,
    saveEvery: 200,
    gradientAccumulation: 1,
    resumeCheckpoint: '',
    exportPath: './lora_output/final_lora',

    // Actions
    setDatasetPath: (path) => set({ datasetPath: path }),
    // Setters for Training Config
    setTrainingConfig: (config) => set((state) => ({ ...state, ...config })),

    setDatasetName: (name) => set({ datasetName: name }),
    setCustomTag: (tag) => set({ customTag: tag }),
    setTagPosition: (pos) => set({ tagPosition: pos }),
    setAllInstrumental: (val) => set({ allInstrumental: val }),

    scan: async () => {
        const { datasetPath, datasetName, customTag, tagPosition, allInstrumental } = get()
        set({ scanStatus: 'Scanning...', samples: [] })
        try {
            const res = await scanDirectory({
                path: datasetPath,
                name: datasetName,
                custom_tag: customTag,
                tag_position: tagPosition,
                all_instrumental: allInstrumental
            })
            if (res.code === 200) {
                set({
                    scanStatus: `Found ${res.data.count} samples`,
                    samples: res.data.samples
                })
            } else {
                set({ scanStatus: `Error: ${res.error}` })
            }
        } catch (err) {
            set({ scanStatus: `Error: ${err.message}` })
        }
    },

    autoLabel: async ({ formatLyrics, transcribeLyrics, forceOverwrite }) => {
        set({ scanStatus: 'Auto-labeling...' })
        try {
            const res = await autoLabelDataset({
                format_lyrics: formatLyrics,
                transcribe_lyrics: transcribeLyrics,
                force_overwrite: forceOverwrite
            })
            if (res.code === 200) {
                set({
                    scanStatus: 'Labeling complete',
                    samples: res.data.samples
                })
            } else {
                set({ scanStatus: `Error: ${res.error}` })
            }
        } catch (err) {
            set({ scanStatus: `Labeling failed: ${err.message}` })
        }
    },

    preprocess: async (outputDir) => {
        set({ isPreprocessing: true, preprocessStatus: 'Starting...' })
        try {
            const res = await preprocessDataset({ output_dir: outputDir })
            if (res.code === 200) {
                set({ preprocessStatus: 'Preprocessing complete', tensorDir: outputDir })
            } else {
                set({ preprocessStatus: `Error: ${res.error}` })
            }
        } catch (err) {
            set({ preprocessStatus: `Error: ${err.message}` })
        } finally {
            set({ isPreprocessing: false })
        }
    },

    startTrain: async (config) => {
        set({ isTraining: true, trainingStatus: 'Starting...', trainingLogs: [] })
        try {
            const res = await startTraining(config)
            if (res.code === 200) {
                set({ trainingStatus: 'Training started' })
                // Start polling logs
                get().pollLogs()
            } else {
                set({ trainingStatus: `Failed: ${res.error}`, isTraining: false })
            }
        } catch (err) {
            set({ trainingStatus: `Error: ${err.message}`, isTraining: false })
        }
    },

    stopTrain: async () => {
        try {
            await stopTraining()
            set({ trainingStatus: 'Stopping...', isTraining: false })
        } catch (err) {
            console.error(err)
        }
    },

    loadDataset: async (path) => {
        set({ scanStatus: 'Loading dataset...' })
        try {
            const res = await loadDataset({ path })
            if (res.code === 200) {
                set({
                    scanStatus: `Loaded ${res.data.count} samples`,
                    samples: res.data.samples,
                    datasetName: res.data.metadata.name || get().datasetName,
                    customTag: res.data.metadata.custom_tag || get().customTag
                })
            } else {
                set({ scanStatus: `Error: ${res.error}` })
            }
        } catch (err) {
            set({ scanStatus: `Error: ${err.message}` })
        }
    },

    saveDataset: async (path) => {
        set({ scanStatus: 'Saving dataset...' })
        try {
            const res = await saveDataset({ path })
            if (res.code === 200) {
                set({ scanStatus: 'Dataset saved successfully' })
            } else {
                set({ scanStatus: `Error: ${res.error}` })
            }
        } catch (err) {
            set({ scanStatus: `Error: ${err.message}` })
        }
    },

    exportLoRA: async (path) => {
        set({ trainingStatus: 'Exporting LoRA...' })
        try {
            const res = await exportLoRA({ path })
            if (res.code === 200) {
                set({ trainingStatus: 'LoRA exported successfully' })
            } else {
                set({ trainingStatus: `Export Failed: ${res.error}` })
            }
        } catch (err) {
            set({ trainingStatus: `Error: ${err.message}` })
        }
    },

    updateSample: async (idx, data) => {
        // Optimistic update
        const samples = [...get().samples]
        if (samples[idx]) {
            samples[idx] = { ...samples[idx], ...data }
            set({ samples })
        }

        try {
            await updateSample(idx, data)
        } catch (err) {
            console.error('Failed to update sample:', err)
            // Revert on failure? For now just log
        }
    },

    pollLogs: async () => {
        const interval = setInterval(async () => {
            if (!get().isTraining) {
                clearInterval(interval)
                return
            }
            try {
                // Implementation depends on how we expose logs (SSE or polling)
                // For now, placeholder
            } catch (err) {
                console.error(err)
            }
        }, 1000)
    }
}))

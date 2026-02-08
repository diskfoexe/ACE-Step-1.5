import { useEffect, useState } from 'react'
import { Settings2, Cpu, Zap } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import { SettingsLabel } from '../common'
import { useGenerationStore } from '../../stores/generationStore'
import { getModels } from '../../lib/api'

export default function ServiceConfigPanel() {
    const { params, setParam } = useGenerationStore()
    const [models, setModels] = useState([])
    const [loadingModels, setLoadingModels] = useState(false)

    useEffect(() => {
        fetchModels()
    }, [])

    const fetchModels = async () => {
        setLoadingModels(true)
        try {
            const data = await getModels()
            // Wrapped response format: { data: { models: [], ... } }
            // Or unwraped if getModels handles it. api.js usually returns response.data
            // response.data from api.js is the body. The body is _wrap_response({ models: ... })
            // So data.data.models

            if (data && data.data && data.data.models) {
                setModels(data.data.models)
                // Set default if not set
                if (!params.model && data.data.default_model) {
                    setParam('model', data.data.default_model)
                }
            } else if (data && data.models) {
                // Fallback if not wrapped
                setModels(data.models)
                if (!params.model && data.default_model) {
                    setParam('model', data.default_model)
                }
            }
        } catch (error) {
            console.error("Failed to fetch models", error)
        } finally {
            setLoadingModels(false)
        }
    }

    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="service-config">
                <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4" />
                        Service Configuration
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4 pt-2 px-1">
                        {/* DiT Model Selection */}
                        <div className="space-y-2">
                            <SettingsLabel
                                label="DiT Model (Music Generator)"
                                tooltip="Select the Diffusion Transformer model for music generation."
                            />
                            <Select
                                value={params.model || ''}
                                onValueChange={(v) => setParam('model', v)}
                                disabled={loadingModels}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Model" />
                                </SelectTrigger>
                                <SelectContent>
                                    {models.map((m) => (
                                        <SelectItem key={m.name} value={m.name}>
                                            {m.name} {m.is_default ? '(Default)' : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* LM Model Configuration */}
                        <div className="space-y-2">
                            <SettingsLabel
                                label="LM Model (Lyrics/Metadata)"
                                tooltip="Select the Language Model and backend for lyrics/metadata reasoning."
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <Select
                                    value={params.lmModel || 'acestep-5Hz-lm-0.6B'}
                                    onValueChange={(v) => setParam('lmModel', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="LM Model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="acestep-5Hz-lm-0.6B">5Hz-lm-0.6B</SelectItem>
                                        <SelectItem value="acestep-5Hz-lm-1.7B">5Hz-lm-1.7B</SelectItem>
                                        <SelectItem value="acestep-5Hz-lm-4B">5Hz-lm-4B</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={params.backend || 'vllm'}
                                    onValueChange={(v) => setParam('backend', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Backend" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="vllm">vLLM</SelectItem>
                                        <SelectItem value="pt">PyTorch</SelectItem>
                                        <SelectItem value="mlx">MLX</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Hardware Optimization */}
                        <div className="grid gap-3 p-3 border rounded-lg bg-muted/20">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <SettingsLabel
                                        label="Offload DiT"
                                        tooltip="Offload the DiT model to CPU to save GPU memory."
                                        className="text-xs mb-0"
                                    />
                                </div>
                                <Switch
                                    checked={params.offloadDitToCpu}
                                    onCheckedChange={(c) => setParam('offloadDitToCpu', c)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <SettingsLabel
                                        label="Offload All"
                                        tooltip="Offload all models to CPU after inference."
                                        className="text-xs mb-0"
                                    />
                                </div>
                                <Switch
                                    checked={params.offloadToCpu}
                                    onCheckedChange={(c) => setParam('offloadToCpu', c)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <SettingsLabel
                                        label="Flash Attn"
                                        tooltip="Use Flash Attention for faster and more memory-efficient inference."
                                        className="text-xs mb-0"
                                    />
                                </div>
                                <Switch
                                    checked={params.useFlashAttention}
                                    onCheckedChange={(c) => setParam('useFlashAttention', c)}
                                />
                            </div>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}

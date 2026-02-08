import { Play, Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
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
import ServiceConfigPanel from './ServiceConfigPanel'
import { useGenerationStore } from '../../stores/generationStore'
import ResultsPanel from './ResultsPanel'
import { SettingsLabel } from '../common'

const LANGUAGES = [
    { value: 'unknown', label: 'Auto-detect' },
    { value: 'en', label: 'English' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'Deutsch' },
    { value: 'instrumental', label: 'Instrumental' },
]

const TIME_SIGNATURES = [
    { value: 'auto', label: 'Auto' },
    { value: '2', label: '2/4' },
    { value: '3', label: '3/4' },
    { value: '4', label: '4/4' },
    { value: '6', label: '6/8' },
]

export default function GenerationTab() {
    const { params, setParam, isGenerating, generateMusic, randomizePrompt } = useGenerationStore()

    const handleRandomCaption = async () => {
        await randomizePrompt();
    }

    const handleGenerate = async () => {
        await generateMusic();
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
            {/* Left Column: Main Form */}
            <div className="min-w-0 space-y-6">

                {/* Step 1: Describe */}
                <section className="rounded-xl border bg-card text-card-foreground">
                    <div className="flex items-center gap-2 border-b bg-muted/40 px-6 py-4">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">1</span>
                        </div>
                        <h2 className="text-sm font-semibold text-foreground">Describe Your Music</h2>
                    </div>

                    <div className="px-6 pt-4 pb-2">
                        <ServiceConfigPanel />
                    </div>

                    <div className="px-6 py-4 grid gap-1.5">
                        <SettingsLabel
                            label="Task Type"
                            tooltip="Specify the generational task (e.g., Text to Music, Remixing, etc.)"
                        />
                        <Select
                            value={params.taskType}
                            onValueChange={(v) => setParam('taskType', v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Task Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="text2music">Text to Music</SelectItem>
                                <SelectItem value="remix">Remix / Continue</SelectItem>
                                <SelectItem value="repainting">Inpainting / Edit</SelectItem>
                                <SelectItem value="cover">Vocal Cover</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="p-6 space-y-4">
                        {/* Main description */}
                        <div className="flex items-end gap-3">
                            <div className="flex-1 grid gap-2">
                                <SettingsLabel
                                    htmlFor="music-description"
                                    label="Music Description"
                                    tooltip="Describe the style, mood, and instruments for the generation."
                                />
                                <Textarea
                                    id="music-description"
                                    placeholder="A soft piano melody with ambient textures and gentle rain sounds..."
                                    value={params.prompt}
                                    onChange={(e) => setParam('prompt', e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div>
                                <Button variant="secondary" size="icon" onClick={handleRandomCaption} title="Random">
                                    <Shuffle className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Language & Instrumental */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <SettingsLabel
                                    htmlFor="vocal-language"
                                    label="Vocal Language"
                                    tooltip="Primary language for generated vocals."
                                />
                                <Select
                                    value={params.vocalLanguage}
                                    onValueChange={(value) => setParam('vocalLanguage', value)}
                                >
                                    <SelectTrigger id="vocal-language" className="w-full">
                                        <SelectValue placeholder="Select language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LANGUAGES.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2 pt-6">
                                <Checkbox
                                    id="instrumental"
                                    checked={params.isInstrumental}
                                    onCheckedChange={(checked) => setParam('isInstrumental', Boolean(checked))}
                                />
                                <SettingsLabel
                                    htmlFor="instrumental"
                                    label="Instrumental (no vocals)"
                                    tooltip="Generate background music without any vocals."
                                    className="mb-0"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Step 2: Customize */}
                <section className="rounded-xl border bg-card text-card-foreground">
                    <div className="flex items-center gap-2 border-b bg-muted/40 px-6 py-4">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">2</span>
                        </div>
                        <h2 className="text-sm font-semibold text-foreground">Customize Details</h2>
                    </div>

                    <div className="p-6 space-y-4">
                        {/* Lyrics */}
                        <div className="grid gap-2">
                            <SettingsLabel
                                htmlFor="lyrics"
                                label="Lyrics (optional)"
                                tooltip="Optional lyrics to guide the vocal generation."
                            />
                            <Textarea
                                id="lyrics"
                                placeholder="[Verse 1]
Walking through the city lights
Feeling like everything's alright..."
                                value={params.lyrics}
                                onChange={(e) => setParam('lyrics', e.target.value)}
                                rows={5}
                            />
                        </div>

                        {/* Fine-Tune Settings */}
                        <Accordion type="single" collapsible>
                            <AccordionItem value="fine-tune">
                                <AccordionTrigger>Fine-Tune Settings</AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="grid gap-2">
                                            <SettingsLabel
                                                htmlFor="bpm"
                                                label="BPM"
                                                tooltip="Beats Per Minute for the generated track."
                                            />
                                            <Input
                                                id="bpm"
                                                type="number"
                                                placeholder="Auto"
                                                value={params.bpm || ''}
                                                onChange={(e) => setParam('bpm', e.target.value ? Number(e.target.value) : null)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <SettingsLabel
                                                htmlFor="key"
                                                label="Key"
                                                tooltip="Musical key and scale (e.g., C Major)."
                                            />
                                            <Input
                                                id="key"
                                                placeholder="C Major"
                                                value={params.keyScale}
                                                onChange={(e) => setParam('keyScale', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <SettingsLabel
                                                htmlFor="time-signature"
                                                label="Time Signature"
                                                tooltip="Rhythmic structure (e.g., 4/4)."
                                            />
                                            <Select
                                                value={params.timeSignature || 'auto'}
                                                onValueChange={(value) => setParam('timeSignature', value === 'auto' ? '' : value)}
                                            >
                                                <SelectTrigger id="time-signature" className="w-full">
                                                    <SelectValue placeholder="Auto" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TIME_SIGNATURES.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <SettingsLabel
                                                htmlFor="duration"
                                                label="Duration (sec)"
                                                tooltip="Length of the generated audio in seconds."
                                            />
                                            <Input
                                                id="duration"
                                                type="number"
                                                placeholder="Auto"
                                                value={params.audioDuration === -1 ? '' : params.audioDuration}
                                                onChange={(e) => setParam('audioDuration', e.target.value ? Number(e.target.value) : -1)}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div className="grid gap-2">
                                            <SettingsLabel
                                                htmlFor="batch-size"
                                                label="Batch Size"
                                                tooltip="Number of variations to generate at once."
                                            />
                                            <Input
                                                id="batch-size"
                                                type="number"
                                                value={params.batchSize}
                                                onChange={(e) => setParam('batchSize', Number(e.target.value))}
                                                min={1}
                                                max={8}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <SettingsLabel
                                                htmlFor="audio-format"
                                                label="Audio Format"
                                                tooltip="Output file format (MP3 or FLAC)."
                                            />
                                            <Select
                                                value={params.audioFormat}
                                                onValueChange={(value) => setParam('audioFormat', value)}
                                            >
                                                <SelectTrigger id="audio-format" className="w-full">
                                                    <SelectValue placeholder="Select format" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="mp3">MP3</SelectItem>
                                                    <SelectItem value="flac">FLAC</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        {/* Advanced Generation Settings */}
                        <Accordion type="single" collapsible>
                            <AccordionItem value="advanced-gen">
                                <AccordionTrigger>Advanced Generation Settings</AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="grid gap-2">
                                            <SettingsLabel
                                                label={`Inference Steps: ${params.inferenceSteps}`}
                                                tooltip="Number of diffusion steps. Higher = more detail, slower generation."
                                            />
                                            <Slider
                                                value={[params.inferenceSteps]}
                                                onValueChange={(v) => setParam('inferenceSteps', v[0])}
                                                min={1}
                                                max={50}
                                                step={1}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <SettingsLabel
                                                label={`Guidance Scale: ${params.guidanceScale}`}
                                                tooltip="How strictly the model follows your prompt."
                                            />
                                            <Slider
                                                value={[params.guidanceScale]}
                                                onValueChange={(v) => setParam('guidanceScale', v[0])}
                                                min={1}
                                                max={20}
                                                step={0.1}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <SettingsLabel
                                                label={`Shift: ${params.shift}`}
                                                tooltip="Euler sampler shift parameter for latent diffusion."
                                            />
                                            <Slider
                                                value={[params.shift]}
                                                onValueChange={(v) => setParam('shift', v[0])}
                                                min={1}
                                                max={10}
                                                step={0.1}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <SettingsLabel
                                                htmlFor="seed"
                                                label="Seed"
                                                tooltip="Fix the random seed for reproducible results."
                                            />
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    id="seed"
                                                    value={params.seed}
                                                    onChange={(e) => setParam('seed', e.target.value)}
                                                    disabled={params.randomSeed}
                                                    className="font-mono text-xs"
                                                />
                                                <Checkbox
                                                    checked={params.randomSeed}
                                                    onCheckedChange={(c) => setParam('randomSeed', !!c)}
                                                    title="Randomize"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Track Info (Hidden for now, or add if needed) */}
                                    {/* <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div className="grid gap-2">
                                            <Label>Track Name</Label>
                                            <Input placeholder="Optional track name..." />
                                        </div>
                                    </div> */}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        {/* Advanced LM Settings */}
                        <Accordion type="single" collapsible>
                            <AccordionItem value="advanced">
                                <AccordionTrigger>Advanced LM Settings</AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="grid gap-2">
                                            <SettingsLabel
                                                label="Temperature"
                                                tooltip="Randomness in the language model sampling. Higher = more creative, lower = more predictable."
                                            />
                                            <Slider
                                                value={[params.lmTemperature]}
                                                onValueChange={(value) => setParam('lmTemperature', value[0])}
                                                min={0}
                                                max={2}
                                                step={0.05}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <SettingsLabel
                                                label="CFG Scale"
                                                tooltip="Classifier-Free Guidance for the language model. Controls prompt adherence vs. variance."
                                            />
                                            <Slider
                                                value={[params.lmCfgScale]}
                                                onValueChange={(value) => setParam('lmCfgScale', value[0])}
                                                min={1}
                                                max={3}
                                                step={0.1}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <SettingsLabel
                                                label="Top P"
                                                tooltip="Nucleus sampling. Keeps tokens whose cumulative probability is less than P."
                                            />
                                            <Slider
                                                value={[params.lmTopP]}
                                                onValueChange={(value) => setParam('lmTopP', value[0])}
                                                min={0}
                                                max={1}
                                                step={0.05}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <SettingsLabel
                                                htmlFor="top-k"
                                                label="Top K"
                                                tooltip="Keep only top K most likely tokens for sampling. 0 ignores this constraint."
                                            />
                                            <Input
                                                id="top-k"
                                                type="number"
                                                value={params.lmTopK}
                                                onChange={(e) => setParam('lmTopK', Number(e.target.value))}
                                                min={0}
                                                max={100}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="cot-metas"
                                                checked={params.useCotMetas}
                                                onCheckedChange={(checked) => setParam('useCotMetas', Boolean(checked))}
                                            />
                                            <SettingsLabel
                                                htmlFor="cot-metas"
                                                label="CoT Metas"
                                                tooltip="Use Chain-of-Thought for metadata generation (BPM, Key, etc.)."
                                                className="mb-0"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="cot-language"
                                                checked={params.useCotLanguage}
                                                onCheckedChange={(checked) => setParam('useCotLanguage', Boolean(checked))}
                                            />
                                            <SettingsLabel
                                                htmlFor="cot-language"
                                                label="CoT Language"
                                                tooltip="Use Chain-of-Thought for language detection."
                                                className="mb-0"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="caption-rewrite"
                                                checked={params.useCotCaption}
                                                onCheckedChange={(checked) => setParam('useCotCaption', Boolean(checked))}
                                            />
                                            <SettingsLabel
                                                htmlFor="caption-rewrite"
                                                label="Caption Rewrite"
                                                tooltip="Allow the model to rewrite your caption for better generation quality."
                                                className="mb-0"
                                            />
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </section>
            </div>

            {/* Right Column: Generate & Results */}
            <div className="space-y-4 lg:sticky lg:top-24">
                <section className="rounded-xl border bg-card text-card-foreground">
                    <div className="flex items-center gap-2 border-b bg-muted/40 px-6 py-4">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">3</span>
                        </div>
                        <h2 className="text-sm font-semibold text-foreground">Generate</h2>
                    </div>

                    <div className="p-6 space-y-4">
                        {/* Checkboxes */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="think"
                                    checked={params.think}
                                    onCheckedChange={(checked) => setParam('think', Boolean(checked))}
                                />
                                <SettingsLabel
                                    htmlFor="think"
                                    label="Think (LM generates codes)"
                                    tooltip="Enable the language model to reason and generate codes before audio diffusion."
                                    className="mb-0"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="parallel-thinking"
                                    checked={params.allowLmBatch}
                                    onCheckedChange={(checked) => setParam('allowLmBatch', Boolean(checked))}
                                />
                                <SettingsLabel
                                    htmlFor="parallel-thinking"
                                    label="Parallel Thinking"
                                    tooltip="Allow batch processing for language model inference steps."
                                    className="mb-0"
                                />
                            </div>
                        </div>

                        {/* Generate Button */}
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <span className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                            ) : (
                                <Play className="w-5 h-5" />
                            )}
                            Generate Music
                        </Button>
                    </div>
                </section>

                {/* Results Panel */}
                <ResultsPanel />
            </div>
        </div>
    )
}


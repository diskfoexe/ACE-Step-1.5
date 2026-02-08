import { useEffect } from 'react'
import { Play, Square, Download, Activity, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { getTrainingStatus } from '../../lib/api'
import { useTrainingStore } from '../../stores/trainingStore'
import { SettingsLabel } from '../common'

function SimpleLossChart({ data }) {
    if (!data || data.length < 2) return null;

    const margin = { top: 10, right: 10, bottom: 20, left: 30 };
    const width = 240;
    const height = 140;
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const minStep = data[0].step;
    const maxStep = data[data.length - 1].step;
    const minLoss = Math.min(...data.map(d => d.loss));
    const maxLoss = Math.max(...data.map(d => d.loss));

    const getX = (step) => ((step - minStep) / (maxStep - minStep)) * chartWidth;
    const getY = (loss) => chartHeight - ((loss - minLoss) / (maxLoss - minLoss)) * chartHeight;

    const points = data.map(d => `${getX(d.step)},${getY(d.loss)}`).join(' ');

    return (
        <div className="w-full h-full flex flex-col">
            <div className="text-[10px] font-bold text-muted-foreground mb-1">Loss Trend</div>
            <svg width={width} height={height} className="overflow-visible">
                <g transform={`translate(${margin.left}, ${margin.top})`}>
                    {/* Grids */}
                    <line x1={0} y1={0} x2={0} y2={chartHeight} stroke="currentColor" strokeOpacity={0.1} />
                    <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="currentColor" strokeOpacity={0.1} />

                    {/* Data Line */}
                    <polyline
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="2"
                        points={points}
                    />

                    {/* Axes Labels */}
                    <text x={-5} y={chartHeight} fontSize="8" textAnchor="end" fill="currentColor" fillOpacity={0.5}>{minLoss.toFixed(3)}</text>
                    <text x={-5} y={0} fontSize="8" textAnchor="end" fill="currentColor" fillOpacity={0.5}>{maxLoss.toFixed(3)}</text>
                    <text x={chartWidth} y={chartHeight + 12} fontSize="8" textAnchor="end" fill="currentColor" fillOpacity={0.5}>Step {maxStep}</text>
                </g>
            </svg>
        </div>
    );
}

export default function TrainingPanel() {
    const store = useTrainingStore()
    const sectionTitleClass = "text-sm font-semibold uppercase tracking-wide text-muted-foreground"

    // Local state for polling logs
    useEffect(() => {
        let interval
        if (store.isTraining) {
            interval = setInterval(async () => {
                try {
                    const res = await getTrainingStatus()
                    if (res && res.data) {
                        useTrainingStore.setState({
                            trainingStatus: res.data.status,
                            trainingLogs: res.data.logs || [],
                            lossHistory: res.data.loss_history || []
                        })
                    }
                } catch {
                    /* ignore polling errors */
                }
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [store.isTraining])

    const handleStart = () => {
        store.startTrain({
            tensor_dir: store.tensorDir || './datasets/preprocessed_tensors',
            rank: store.loraRank,
            alpha: store.loraAlpha,
            epochs: store.epochs,
            batch_size: store.batchSize,
            learning_rate: store.learningRate,
            gradient_accumulation: store.gradientAccumulation,
            save_every: store.saveEvery,
            resume_checkpoint: store.resumeCheckpoint,
            output_dir: './lora_output'
        })
    }

    const handleStop = () => {
        store.stopTrain()
    }

    const handleExport = () => {
        store.exportLoRA(store.exportPath)
    }

    return (
        <div className="space-y-6">
            {/* Source */}
            <section className="rounded-xl border bg-card text-card-foreground">
                <div className="border-b bg-muted/40 px-6 py-4">
                    <h3 className={sectionTitleClass}>
                        Training Source
                    </h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid gap-2">
                        <SettingsLabel
                            label="Preprocessed Tensors Directory"
                            tooltip="Path to the directory containing preprocessed dataset tensors."
                        />
                        <Input
                            value={store.tensorDir}
                            onChange={(e) => useTrainingStore.setState({ tensorDir: e.target.value })}
                            placeholder="./datasets/preprocessed_tensors"
                        />
                    </div>
                </div>
            </section>

            {/* LoRA Config */}
            <section className="rounded-xl border bg-card text-card-foreground">
                <div className="border-b bg-muted/40 px-6 py-4">
                    <h3 className={sectionTitleClass}>
                        LoRA Configuration
                    </h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Rank */}
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <SettingsLabel
                                    label={`Rank: ${store.loraRank}`}
                                    tooltip="LoRA rank. Higher rank allows more complex learning but larger file size."
                                />
                            </div>
                            <Slider
                                value={[store.loraRank]}
                                min={4}
                                max={256}
                                step={4}
                                onValueChange={([v]) => useTrainingStore.setState({ loraRank: v })}
                            />
                        </div>

                        {/* Alpha */}
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <SettingsLabel
                                    label={`Alpha: ${store.loraAlpha}`}
                                    tooltip="LoRA alpha. Scaling factor for the LoRA weights."
                                />
                            </div>
                            <Slider
                                value={[store.loraAlpha]}
                                min={4}
                                max={512}
                                step={4}
                                onValueChange={([v]) => useTrainingStore.setState({ loraAlpha: v })}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <SettingsLabel
                                    label={`Epochs: ${store.epochs}`}
                                    tooltip="Number of full passes through the training dataset."
                                />
                            </div>
                            <Slider
                                value={[store.epochs]}
                                min={10}
                                max={4000}
                                step={10}
                                onValueChange={([v]) => useTrainingStore.setState({ epochs: v })}
                            />
                        </div>

                        {/* Learning Rate */}
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <SettingsLabel
                                    label={`Learning Rate: ${store.learningRate.toExponential(1)}`}
                                    tooltip="Step size for weight updates. Smaller values are more stable but slower."
                                />
                            </div>
                            <Slider
                                value={[Math.log10(store.learningRate)]}
                                min={-6}
                                max={-2}
                                step={0.1}
                                onValueChange={([v]) => useTrainingStore.setState({ learningRate: Math.pow(10, v) })}
                            />
                        </div>

                        {/* Batch Size */}
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <SettingsLabel
                                    label={`Batch Size: ${store.batchSize}`}
                                    tooltip="Number of samples processed per step. Higher consumes more memory."
                                />
                            </div>
                            <Slider
                                value={[store.batchSize]}
                                min={1}
                                max={16}
                                step={1}
                                onValueChange={([v]) => useTrainingStore.setState({ batchSize: v })}
                            />
                        </div>

                        {/* Gradient Accumulation */}
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <SettingsLabel
                                    label={`Gradient Accumulation: ${store.gradientAccumulation}`}
                                    tooltip="Steps to accumulate gradients before updating. Simulates larger batch sizes."
                                />
                            </div>
                            <Slider
                                value={[store.gradientAccumulation]}
                                min={1}
                                max={16}
                                step={1}
                                onValueChange={([v]) => useTrainingStore.setState({ gradientAccumulation: v })}
                            />
                        </div>

                        {/* Save Every */}
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <SettingsLabel
                                    label={`Save Every (Epochs): ${store.saveEvery}`}
                                    tooltip="Frequency of saving model checkpoints."
                                />
                            </div>
                            <Slider
                                value={[store.saveEvery]}
                                min={50}
                                max={1000}
                                step={50}
                                onValueChange={([v]) => useTrainingStore.setState({ saveEvery: v })}
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <SettingsLabel
                            label="Resume Checkpoint (Optional)"
                            tooltip="Load an existing LoRA checkpoint to continue training."
                        />
                        <Input
                            value={store.resumeCheckpoint}
                            onChange={(e) => useTrainingStore.setState({ resumeCheckpoint: e.target.value })}
                            placeholder="./lora_output/checkpoints/epoch_200"
                            className="mt-2"
                        />
                    </div>
                </div>
            </section>

            {/* Controls & Logs */}
            <section className="rounded-xl border bg-card text-card-foreground">
                <div className="border-b bg-muted/40 px-6 py-4">
                    <h3 className={sectionTitleClass}>
                        Control & Status
                    </h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex gap-4">
                        <Button
                            variant="default"
                            size="lg"
                            onClick={handleStart}
                            disabled={store.isTraining}
                            className="w-40"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            Start
                        </Button>
                        <Button
                            variant="destructive"
                            size="lg"
                            onClick={handleStop}
                            disabled={!store.isTraining}
                            className="w-40"
                        >
                            <Square className="w-4 h-4 mr-2" />
                            Stop
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-muted-foreground">Training Logs</Label>
                            {store.isTraining && <Activity className="w-4 h-4 text-primary animate-pulse" />}
                        </div>
                        <div className="h-64 bg-black/90 text-green-400 font-mono text-xs p-4 rounded-lg overflow-auto border border-border">
                            {store.trainingStatus && (
                                <div className="mb-2 pb-2 border-b border-green-900/50">
                                    {store.trainingStatus}
                                </div>
                            )}

                            {/* Loss Plot */}
                            {store.isTraining && store.lossHistory && store.lossHistory.length > 0 && (
                                <div className="absolute top-4 right-4 bg-background/95 p-2 rounded-lg border shadow-sm w-64 h-40 z-10">
                                    <SimpleLossChart data={store.lossHistory} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Export */}
            <section className="rounded-xl border bg-card text-card-foreground">
                <div className="border-b bg-muted/40 px-6 py-4">
                    <h3 className={sectionTitleClass}>
                        Export LoRA
                    </h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-end gap-2">
                        <div className="grid gap-2 flex-1">
                            <SettingsLabel
                                label="Export Path"
                                tooltip="Filename or path for the final LoRA adapter export."
                            />
                            <Input
                                value={store.exportPath}
                                onChange={(e) => useTrainingStore.setState({ exportPath: e.target.value })}
                            />
                        </div>
                        <Button variant="secondary" onClick={handleExport} disabled={store.isTraining}>
                            <Save className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    )
}

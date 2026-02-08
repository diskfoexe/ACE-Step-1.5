import { useState } from 'react'
import { FolderOpen, Tag, Play, Square, Download, FileAudio, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useTrainingStore } from '../../stores/trainingStore'
import { SettingsLabel } from '../common'

export default function DatasetBuilder() {
    const store = useTrainingStore()
    const sectionTitleClass = "text-sm font-semibold uppercase tracking-wide text-muted-foreground"

    // Local state for inputs
    const [pathInput, setPathInput] = useState('')
    const [nameInput, setNameInput] = useState('my_dataset')
    const [outputDirInput, setOutputDirInput] = useState('./datasets/preprocessed_tensors')

    const handleScan = () => {
        store.setDatasetPath(pathInput)
        store.setDatasetName(nameInput)
        store.scan()
    }

    const [overwriteLabels, setOverwriteLabels] = useState(false)

    const handleAutoLabel = () => {
        store.autoLabel({
            formatLyrics: false,
            transcribeLyrics: false,
            forceOverwrite: overwriteLabels
        })
    }

    const handlePreprocess = () => {
        store.preprocess(outputDirInput)
    }

    return (
        <div className="space-y-6">
            {/* Step 1: Load or Scan */}
            <section className="rounded-xl border bg-card text-card-foreground">
                <div className="border-b bg-muted/40 px-6 py-4">
                    <h3 className={sectionTitleClass}>
                        Step 1 - Load or Scan Audio
                    </h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Scan New */}
                        <div className="space-y-3">
                            <h4 className="font-medium text-foreground">Scan Directory</h4>
                            <div className="space-y-2">
                                <SettingsLabel
                                    label="Dataset Name"
                                    tooltip="Internal name for the dataset folder."
                                />
                                <Input
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    placeholder="my_dataset"
                                />
                                <SettingsLabel
                                    label="Audio Directory Path"
                                    tooltip="Local directory containing audio files (WAV/FLAC/MP3) to scan."
                                />
                                <div className="flex gap-2">
                                    <Input
                                        value={pathInput}
                                        onChange={(e) => setPathInput(e.target.value)}
                                        placeholder="/path/to/audio/folder"
                                        className="flex-1"
                                    />
                                    <Button variant="secondary" onClick={handleScan} disabled={store.scanStatus === 'Scanning...'}>
                                        <FolderOpen className="w-4 h-4 mr-1" />
                                        Scan
                                    </Button>
                                </div>
                            </div>
                            {store.scanStatus && (
                                <p className="text-sm text-muted-foreground">{store.scanStatus}</p>
                            )}
                        </div>

                        {/* Stats / Info */}
                        <div className="space-y-3">
                            <h4 className="font-medium text-foreground">Dataset Stats</h4>
                            <div className="p-4 bg-muted/20 rounded-lg border">
                                <div className="text-2xl font-bold">{store.samples.length}</div>
                                <div className="text-sm text-muted-foreground">Samples found</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Step 2: Auto-Label */}
            <section className="rounded-xl border bg-card text-card-foreground">
                <div className="border-b bg-muted/40 px-6 py-4">
                    <h3 className={sectionTitleClass}>
                        Step 2 - Auto-Label with AI
                    </h3>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Automatically generate captions, BPM, and keys using the loaded models.
                    </p>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <Button size="lg" onClick={handleAutoLabel} disabled={store.samples.length === 0}>
                                <Tag className="w-4 h-4 mr-2" />
                                Auto-Label All
                            </Button>
                            <div className="flex items-center space-x-2 ml-4">
                                <Checkbox
                                    id="overwrite_labels"
                                    checked={overwriteLabels}
                                    onCheckedChange={(c) => setOverwriteLabels(!!c)}
                                />
                                <SettingsLabel
                                    htmlFor="overwrite_labels"
                                    label="Overwrite existing"
                                    tooltip="Overwrite existing labels if they already exist for the files."
                                    className="mb-0"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Step 3: Preview */}
            <section className="rounded-xl border bg-card text-card-foreground">
                <div className="border-b bg-muted/40 px-6 py-4">
                    <h3 className={sectionTitleClass}>
                        Step 3 - Preview Samples
                    </h3>
                </div>
                <div className="p-0">
                    <div className="max-h-[400px] overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Filename</TableHead>
                                    <TableHead>Caption</TableHead>
                                    <TableHead>BPM</TableHead>
                                    <TableHead>Key</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {store.samples.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            No samples loaded
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    store.samples.slice(0, 50).map((s, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-mono text-xs">{s.filename}</TableCell>
                                            <TableCell className="text-xs truncate max-w-[200px]">{s.caption}</TableCell>
                                            <TableCell className="text-xs">{s.bpm}</TableCell>
                                            <TableCell className="text-xs">{s.key}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {store.samples.length > 50 && (
                        <div className="p-2 text-center text-xs text-muted-foreground bg-muted/20">
                            Showing first 50 of {store.samples.length} samples
                        </div>
                    )}
                </div>
            </section>

            {/* Step 4: Preprocess */}
            <section className="rounded-xl border bg-card text-card-foreground">
                <div className="border-b bg-muted/40 px-6 py-4">
                    <h3 className={sectionTitleClass}>
                        Step 4 - Preprocess to Tensors
                    </h3>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Convert audio to latent tensors for faster training.
                    </p>
                    <div className="flex items-end gap-2">
                        <div className="grid gap-2 flex-1">
                            <SettingsLabel
                                label="Output Directory"
                                tooltip="Directory where preprocessed tensors will be saved."
                            />
                            <Input
                                value={outputDirInput}
                                onChange={(e) => setOutputDirInput(e.target.value)}
                            />
                        </div>
                        <Button variant="default" onClick={handlePreprocess} disabled={store.isPreprocessing || store.samples.length === 0}>
                            {store.isPreprocessing ? 'Processing...' : 'Preprocess'}
                        </Button>
                    </div>
                    {store.preprocessStatus && (
                        <p className="text-sm text-muted-foreground">{store.preprocessStatus}</p>
                    )}
                </div>
            </section>
        </div>
    )
}

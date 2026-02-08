import { Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AudioPlayer } from '../common'
import { useGenerationStore } from '../../stores/generationStore'

export default function ResultsPanel() {
    const { results, generationStatus, isGenerating, currentBatchIndex, totalBatches, prepareRemix } = useGenerationStore()

    if (results.length === 0 && !isGenerating) {
        return (
            <section className="rounded-xl border border-dashed bg-card text-card-foreground">
                <div className="p-6">
                    <div className="flex items-start gap-3">
                        <Music className="w-8 h-8 text-muted-foreground/70" />
                        <div>
                            <p className="text-muted-foreground text-sm">Generated music will appear here</p>
                        </div>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="rounded-xl border bg-card text-card-foreground">
            <div className="flex items-center justify-between border-b bg-muted/40 px-6 py-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Results
                </h3>
                {totalBatches > 1 && (
                    <span className="text-xs text-muted-foreground">
                        Batch {currentBatchIndex + 1} of {totalBatches}
                    </span>
                )}
            </div>
            <div className="p-6 space-y-4">
                {/* Status */}
                {generationStatus && (
                    <div className="p-3 rounded-lg bg-muted/60 border border-border">
                        <p className="text-sm text-muted-foreground">{generationStatus}</p>
                    </div>
                )}

                {/* Loading state */}
                {isGenerating && results.length === 0 && (
                    <div className="py-6 flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">Generating music...</p>
                    </div>
                )}

                {/* Results grid */}
                <div className="space-y-3">
                    {results.map((result, idx) => (
                        <div key={idx} className="p-4 rounded-lg bg-muted/60 border border-border">
                            <AudioPlayer
                                src={result.audioUrl}
                                label={result.prompt || `Track ${idx + 1}`}
                            />

                            {result.metas && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {result.metas.bpm && (
                                        <span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">
                                            {result.metas.bpm} BPM
                                        </span>
                                    )}
                                    {result.metas.keyscale && (
                                        <span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">
                                            {result.metas.keyscale}
                                        </span>
                                    )}
                                    {result.metas.duration && (
                                        <span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">
                                            {result.metas.duration}s
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="mt-3 flex gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => prepareRemix(result)}
                                >
                                    Send to Remix
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    asChild
                                >
                                    <a href={result.audioUrl} download target="_blank" rel="noreferrer">
                                        Download
                                    </a>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Batch navigation */}
                {totalBatches > 1 && (
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={currentBatchIndex === 0}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={currentBatchIndex >= totalBatches - 1}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </section>
    )
}

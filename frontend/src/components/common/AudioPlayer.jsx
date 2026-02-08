import { useRef, useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Download } from 'lucide-react'

export function AudioPlayer({
    src,
    label,
    className = '',
    onDownload,
}) {
    const audioRef = useRef(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isMuted, setIsMuted] = useState(false)

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
        const handleLoadedMetadata = () => setDuration(audio.duration)
        const handleEnded = () => setIsPlaying(false)

        audio.addEventListener('timeupdate', handleTimeUpdate)
        audio.addEventListener('loadedmetadata', handleLoadedMetadata)
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate)
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
            audio.removeEventListener('ended', handleEnded)
        }
    }, [src])

    const togglePlay = () => {
        const audio = audioRef.current
        if (!audio) return

        if (isPlaying) {
            audio.pause()
        } else {
            audio.play()
        }
        setIsPlaying(!isPlaying)
    }

    const toggleMute = () => {
        const audio = audioRef.current
        if (!audio) return
        audio.muted = !isMuted
        setIsMuted(!isMuted)
    }

    const handleSeek = (e) => {
        const audio = audioRef.current
        if (!audio) return
        const rect = e.currentTarget.getBoundingClientRect()
        const percent = (e.clientX - rect.left) / rect.width
        audio.currentTime = percent * duration
    }

    const formatTime = (seconds) => {
        if (!isFinite(seconds)) return '0:00'
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0

    if (!src) {
        return (
            <div className={`p-4 rounded-lg bg-muted/60 border border-border border-dashed ${className}`}>
                <p className="text-sm text-muted-foreground">No audio loaded</p>
            </div>
        )
    }

    return (
        <div className={`p-4 rounded-lg bg-muted/60 border border-border ${className}`}>
            <audio ref={audioRef} src={src} preload="metadata" />

            {label && (
                <p className="text-sm font-medium text-foreground mb-2 truncate">{label}</p>
            )}

            <div className="flex items-center gap-3">
                {/* Play/Pause */}
                <button
                    onClick={togglePlay}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>

                {/* Progress bar */}
                <div
                    className="flex-1 h-2 bg-muted rounded-full cursor-pointer group"
                    onClick={handleSeek}
                >
                    <div
                        className="h-full bg-primary rounded-full relative group-hover:bg-primary/80 transition-colors"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-background rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>

                {/* Time */}
                <span className="text-xs text-muted-foreground font-mono min-w-[70px] text-right">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                {/* Volume toggle */}
                <button
                    onClick={toggleMute}
                    className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                {/* Download */}
                {onDownload && (
                    <button
                        onClick={onDownload}
                        className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    )
}

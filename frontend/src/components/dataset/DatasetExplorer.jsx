import { Database } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DatasetExplorer() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
            <div className="p-6 rounded-full bg-muted/30 border border-border">
                <Database className="w-12 h-12 text-muted-foreground" />
            </div>
            <div className="space-y-2 max-w-md">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">Dataset Explorer</h2>
                <p className="text-muted-foreground">
                    View and manage your audio datasets here. This feature is currently under development.
                </p>
            </div>
            <div className="pt-4">
                <Button variant="secondary" disabled className="text-muted-foreground">
                    Import Dataset (Coming Soon)
                </Button>
            </div>
        </div>
    )
}

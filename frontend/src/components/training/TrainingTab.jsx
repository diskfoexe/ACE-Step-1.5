import { useState } from 'react'
import { Button } from '@/components/ui/button'
import DatasetBuilder from './DatasetBuilder'
import TrainingPanel from './TrainingPanel'

export default function TrainingTab() {
    const [activeSubTab, setActiveSubTab] = useState('dataset')

    return (
        <div className="space-y-6">
            {/* Header */}


            <div className="flex justify-center gap-2">
                <Button
                    variant={activeSubTab === 'dataset' ? 'default' : 'secondary'}
                    onClick={() => setActiveSubTab('dataset')}
                >
                    Dataset Builder
                </Button>
                <Button
                    variant={activeSubTab === 'training' ? 'default' : 'secondary'}
                    onClick={() => setActiveSubTab('training')}
                >
                    Train LoRA
                </Button>
            </div>

            {activeSubTab === 'dataset' && <DatasetBuilder />}
            {activeSubTab === 'training' && <TrainingPanel />}
        </div>
    )
}

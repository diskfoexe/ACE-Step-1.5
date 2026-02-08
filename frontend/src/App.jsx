import { useState } from 'react'
import { Music, Database, Cpu } from 'lucide-react'
import GenerationTab from './components/generation/GenerationTab'
import TrainingTab from './components/training/TrainingTab'
import DatasetExplorer from './components/dataset/DatasetExplorer'

import { TooltipProvider } from './components/ui/tooltip'

const tabs = [
  { id: 'generation', label: 'Generation', icon: Music },
  { id: 'dataset', label: 'Dataset Explorer', icon: Database },
  { id: 'training', label: 'LoRA Training', icon: Cpu },
]

function App() {
  const [activeTab, setActiveTab] = useState('generation')

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="mx-auto w-full max-w-7xl px-6 md:px-8">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-base font-semibold leading-tight text-foreground">ACE-Step Studio</h1>
                  <p className="text-[11px] leading-tight text-muted-foreground">AI Music Generation</p>
                </div>
              </div>

              {/* Tab Navigation - Centered */}
              <nav className="flex items-center gap-1 rounded-lg bg-muted/60 p-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
                        transition-all duration-200
                        ${isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>

              {/* Status indicator */}

            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto w-full max-w-7xl px-6 md:px-8 py-8">
          {activeTab === 'generation' && <GenerationTab />}
          {activeTab === 'dataset' && <DatasetExplorer />}
          {activeTab === 'training' && <TrainingTab />}
        </main>
      </div>
    </TooltipProvider>
  )
}

export default App

'use client'

import { useState } from 'react'
import { useNexusStore } from '@/store'
import { ModelLibrary } from '@/components/models/ModelLibrary'
import { ModelBuilder } from '@/components/models/ModelBuilder'
import { LivePreview } from '@/components/models/LivePreview'
import type { EvaluationModel } from '@/types'

export default function ModelsPage() {
  const models = useNexusStore(s => s.models)
  const activeModelId = useNexusStore(s => s.activeModelId)

  // Default to the active model in builder
  const defaultModel = models.find(m => m.id === activeModelId) ?? models[0]
  const [draftModel, setDraftModel] = useState<EvaluationModel>(defaultModel)

  function handleSelectModel(model: EvaluationModel) {
    setDraftModel({ ...model })
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      {/* Model library sidebar */}
      <aside className="w-[280px] shrink-0 border-r border-white/10 bg-[#0f1114] p-4 overflow-y-auto">
        <ModelLibrary
          selectedModelId={draftModel.id}
          onSelectModel={handleSelectModel}
        />
      </aside>

      {/* Builder + preview */}
      <div className="flex-1 flex min-w-0 divide-x divide-white/10">
        {/* Model builder */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h1 className="text-base font-semibold text-white mb-4">Model Builder</h1>
          <ModelBuilder model={draftModel} onModelChange={setDraftModel} />
        </div>

        {/* Live preview */}
        <div className="w-[280px] shrink-0 p-6 overflow-y-auto bg-[#0f1114]">
          <LivePreview draftModel={draftModel} />
        </div>
      </div>
    </div>
  )
}

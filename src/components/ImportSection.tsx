import React, { useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileUp, FileSpreadsheet, Info } from 'lucide-react'

interface ImportSectionProps {
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function ImportSection({ onImport }: ImportSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0 && files[0].name.endsWith('.csv')) {
      // Create a synthetic event for the file input using browser DataTransfer API

      const dt = new window.DataTransfer()
      dt.items.add(files[0])
      if (fileInputRef.current) {
        fileInputRef.current.files = dt.files
        const event = { target: fileInputRef.current } as React.ChangeEvent<HTMLInputElement>
        onImport(event)
      }
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card className="no-print border-dashed">
      <CardContent className="p-6">
        <div
          className={`relative rounded-lg border-2 border-dashed transition-all duration-200 ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div
              className={`h-14 w-14 rounded-full flex items-center justify-center mb-4 transition-colors ${
                isDragging ? 'bg-primary/20' : 'bg-muted'
              }`}
            >
              {isDragging ? (
                <FileUp className="h-7 w-7 text-primary animate-bounce" />
              ) : (
                <Upload className="h-7 w-7 text-muted-foreground" />
              )}
            </div>

            <h3 className="text-lg font-semibold mb-1">Import Schedules</h3>
            <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
              Drag and drop your CSV file here, or click to browse
            </p>

            <Button variant="outline" onClick={handleButtonClick} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Select CSV File
            </Button>

            <input
              ref={fileInputRef}
              id="import-file"
              type="file"
              accept=".csv"
              onChange={onImport}
              className="hidden"
            />

            <div className="mt-6 flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 max-w-lg">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Supported formats:</span>
                <ul className="mt-1 space-y-0.5">
                  <li>
                    <span className="text-foreground">v1:</span> Name, Date, Start, End, Tasks
                  </li>
                  <li>
                    <span className="text-foreground">v2:</span> Housekeeper, Assignee, Date, Start,
                    Duration, Tasks
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

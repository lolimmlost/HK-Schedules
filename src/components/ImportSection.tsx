import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Upload } from 'lucide-react'

interface ImportSectionProps {
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function ImportSection({ onImport }: ImportSectionProps) {
  return (
    <Card className="no-print">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Import Schedules</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <Input
              id="import-file"
              type="file"
              accept=".csv"
              onChange={onImport}
              className="w-full"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Import v1/v2 CSV schedules (v1: Name/Date/Start/End/Tasks; v2:
            Housekeeper/Assignee/Date/Start/Duration/Tasks)
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

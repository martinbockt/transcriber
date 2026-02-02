"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh]">
        <AlertDialogHeader>
          <AlertDialogTitle>Settings</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-foreground">
              Manage your preferences and application settings
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* API Key Section - to be implemented in phase 2 */}
            <section>
              <h3 className="text-sm font-medium mb-3">API Key</h3>
              <div className="text-sm text-muted-foreground">
                API key configuration will be added here
              </div>
            </section>

            <Separator />

            {/* Preferences Section - to be implemented in phase 3 */}
            <section>
              <h3 className="text-sm font-medium mb-3">Preferences</h3>
              <div className="text-sm text-muted-foreground">
                Theme and other preferences will be added here
              </div>
            </section>

            <Separator />

            {/* Data Management Section - to be implemented in phase 4 */}
            <section>
              <h3 className="text-sm font-medium mb-3">Data Management</h3>
              <div className="text-sm text-muted-foreground">
                Storage usage and data management options will be added here
              </div>
            </section>

            <Separator />

            {/* Keyboard Shortcuts Section - to be implemented in phase 5 */}
            <section>
              <h3 className="text-sm font-medium mb-3">Keyboard Shortcuts</h3>
              <div className="text-sm text-muted-foreground">
                Keyboard shortcuts reference will be added here
              </div>
            </section>

            <Separator />

            {/* About Section - to be implemented in phase 5 */}
            <section>
              <h3 className="text-sm font-medium mb-3">About</h3>
              <div className="text-sm text-muted-foreground">
                Version info and links will be added here
              </div>
            </section>
          </div>
        </ScrollArea>
      </AlertDialogContent>
    </AlertDialog>
  );
}

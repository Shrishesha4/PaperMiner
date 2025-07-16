'use client';

import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarMenuSkeleton
} from '@/components/ui/sidebar';
import { useHistory } from '@/hooks/use-history';
import { Button } from './ui/button';
import { FileText, Trash2, Loader2, BrainCircuit } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function HistorySidebar() {
  const { history, selectAnalysis, selectedAnalysis, clearHistory, removeAnalysis, isLoading } = useHistory();

  return (
    <Sidebar>
        <SidebarHeader>
            <div className="flex items-center gap-2">
                <BrainCircuit className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold tracking-tight">PaperMiner</h1>
            </div>
            <p className="text-xs text-muted-foreground">Your recent analyses</p>
        </SidebarHeader>
      <SidebarContent className="p-2">
        {isLoading ? (
            <div className="space-y-2">
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
            </div>
        ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                <p>No analysis history found.</p>
                <p className="text-xs mt-2">Upload a CSV to get started.</p>
            </div>
        ) : (
            <SidebarMenu>
                {history.map((item) => (
                    <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                            onClick={() => selectAnalysis(item.id)}
                            isActive={selectedAnalysis?.id === item.id}
                            className="h-auto py-2"
                        >
                            <div className="flex items-start gap-3">
                                <FileText className="mt-1"/>
                                <div className="flex flex-col text-left">
                                    <span className="font-medium">{item.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(item.date).toLocaleDateString()} - {item.categorizedPapers.length} papers
                                    </span>
                                </div>
                            </div>
                        </SidebarMenuButton>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover/menu-item:opacity-100">
                                <Trash2 className="h-4 w-4 text-destructive"/>
                             </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the analysis for <span className="font-bold">{item.name}</span>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => removeAnalysis(item.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        )}
      </SidebarContent>
      <SidebarFooter>
        {history.length > 0 && (
            <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear History
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all
                    of your analysis history.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearHistory}>Delete All</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
            </AlertDialog>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

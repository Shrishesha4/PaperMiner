
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
  SidebarMenuSkeleton,
  useSidebar,
} from '@/components/ui/sidebar';
import { useHistory } from '@/hooks/use-history';
import { Button } from './ui/button';
import { FileText, Lightbulb, Trash2, FileEdit } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import Link from 'next/link';

export function HistorySidebar() {
  const { history, selectAnalysis, selectedAnalysis, clearHistory, removeAnalysis, isLoading } = useHistory();
  const { state } = useSidebar();

  const isScratchSelected = selectedAnalysis?.name === 'From Scratch';

  return (
    <Sidebar>
        <SidebarHeader>
            { state === 'expanded' && (
                <div className="flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground">Your recent analyses</p>
                </div>
            )}
        </SidebarHeader>
      <SidebarContent className="p-2">
        {isLoading ? (
            <div className="space-y-2">
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
            </div>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isScratchSelected}
                tooltip={{children: "Start From Scratch", side: 'right', align: 'center'}}
                className="h-auto py-2 justify-start"
              >
                <Link href="/title-studio">
                  <Lightbulb className="flex-shrink-0"/>
                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="font-medium truncate">Start From Scratch</span>
                    <span className="text-xs text-muted-foreground truncate">
                      Generate new title ideas
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          
            {history.map((item) => (
                <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                        onClick={() => selectAnalysis(item.id)}
                        isActive={selectedAnalysis?.id === item.id && !item.draftedPaper}
                        className="h-auto py-2 justify-start"
                        tooltip={{children: item.name, side: 'right', align: 'center'}}
                    >
                        <FileText className="flex-shrink-0"/>
                        <div className="flex flex-col text-left overflow-hidden">
                            <span className="font-medium truncate">{item.name}</span>
                            <span className="text-xs text-muted-foreground truncate">
                                {new Date(item.date).toLocaleDateString()} - {item.categorizedPapers.length} papers
                            </span>
                        </div>
                    </SidebarMenuButton>
                    
                    {item.draftedPaper && (
                      <SidebarMenuButton
                        asChild
                        size="sm"
                        className="mt-1 w-[calc(100%-1rem)] mx-auto"
                        isActive={selectedAnalysis?.id === item.id}
                      >
                        <Link href={`/paper-drafter?analysisId=${item.id}&title=${encodeURIComponent(item.draftedPaper.title)}`}>
                            <FileEdit />
                            <span>View Draft</span>
                        </Link>
                      </SidebarMenuButton>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="absolute right-1 top-2 h-7 w-7 opacity-0 group-hover/menu-item:opacity-100 group-data-[collapsible=icon]:hidden">
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
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
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

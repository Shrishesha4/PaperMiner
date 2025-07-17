
'use client';

import React, { useState } from 'react';
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
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { useHistory } from '@/hooks/use-history';
import { Button } from './ui/button';
import { FileText, Lightbulb, Trash2, FileEdit, Plus } from 'lucide-react';
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
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { useRouter } from 'next/navigation';

function DeleteAnalysisDialog({ item, onConfirm, onArchive, children }: { item: any, onConfirm: () => void, onArchive: () => void, children: React.ReactNode }) {
    const [keepDraft, setKeepDraft] = useState(true);
    const hasDraft = !!item.draftedPaper;

    const handleConfirm = () => {
        if (hasDraft && keepDraft) {
            onArchive();
        } else {
            onConfirm();
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action will permanently delete the analysis for <span className="font-bold">{item.name}</span>.
                        {hasDraft && " This analysis has a draft associated with it."}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {hasDraft && (
                    <div className="flex items-center space-x-2 my-4">
                        <Checkbox
                            id="keep-draft"
                            checked={keepDraft}
                            onCheckedChange={(checked) => setKeepDraft(!!checked)}
                        />
                        <Label htmlFor="keep-draft" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Keep the associated paper draft
                        </Label>
                    </div>
                )}
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirm}>
                        {hasDraft && keepDraft ? 'Archive and Keep Draft' : 'Delete Everything'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export function HistorySidebar() {
  const { history, selectAnalysis, selectedAnalysis, removeAnalysis, removeDraft, archiveAnalysis, isLoading } = useHistory();
  const { state, setOpenMobile } = useSidebar();
  const router = useRouter();

  const isScratchSelected = selectedAnalysis?.name === 'From Scratch' || (!selectedAnalysis && !isLoading);
  const drafts = history.filter(item => !!item.draftedPaper);
  const analysisHistory = history.filter(item => item.categorizedPapers.length > 0 || (item.name.startsWith("Scratchpad:") && !item.draftedPaper));

  const handleMobileNav = () => {
    setOpenMobile(false);
  }

  const handleNewAnalysis = () => {
    selectAnalysis(null);
    router.push('/');
    handleMobileNav();
  }

  return (
    <Sidebar>
        <SidebarHeader>
            { state === 'expanded' && (
                <div className="flex flex-col gap-1 p-2">
                    <Button onClick={handleNewAnalysis}>
                      <Plus className="mr-2 h-4 w-4" /> New Analysis
                    </Button>
                </div>
            )}
             { state === 'collapsed' && (
                <div className="flex flex-col gap-1 p-2">
                   <Button onClick={handleNewAnalysis} size="icon">
                      <Plus className="h-4 w-4" />
                       <span className="sr-only">New Analysis</span>
                    </Button>
                </div>
            )}
        </SidebarHeader>
      <SidebarContent className="p-0">
        {isLoading ? (
            <div className="space-y-2 p-2">
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
                <SidebarMenuSkeleton showIcon />
            </div>
        ) : (
          <>
            <SidebarMenu className="p-2">
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        isActive={isScratchSelected}
                        tooltip={{children: "Start From Scratch", side: 'right', align: 'center'}}
                        className="h-auto py-2 justify-start"
                        onClick={handleMobileNav}
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
            </SidebarMenu>

            {drafts.length > 0 && <Separator className="my-2" />}

            {drafts.length > 0 && (
                <SidebarGroup>
                    <SidebarGroupLabel>Saved Drafts</SidebarGroupLabel>
                    <SidebarMenu>
                        {drafts.map((item) => (
                             <SidebarMenuItem key={`draft-${item.id}`}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={selectedAnalysis?.id === item.id}
                                    className="h-auto py-2 justify-start"
                                    tooltip={{children: item.draftedPaper?.title, side: 'right', align: 'center'}}
                                    onClick={handleMobileNav}
                                >
                                     <Link href={`/paper-drafter?title=${encodeURIComponent(item.draftedPaper!.title)}&analysisId=${item.id}`}>
                                        <FileEdit className="flex-shrink-0"/>
                                        <div className="flex flex-col text-left overflow-hidden">
                                            <span className="font-medium truncate">{item.draftedPaper?.title}</span>
                                            <span className="text-xs text-muted-foreground truncate">
                                                Based on: {item.name.replace(/^Archived Draft from: /, '')}
                                            </span>
                                        </div>
                                    </Link>
                                </SidebarMenuButton>
                                <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="absolute right-1 top-2 h-7 w-7 opacity-100 md:opacity-0 group-hover/menu-item:opacity-100 group-data-[collapsible=icon]:hidden">
                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the draft for <span className="font-bold">{item.draftedPaper?.title}</span>.
                                        {item.categorizedPapers.length === 0 && ' The original analysis data has been archived.'}
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => item.categorizedPapers.length > 0 ? removeDraft(item.id) : removeAnalysis(item.id)}>Delete Draft</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                                </AlertDialog>
                             </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            )}

             {analysisHistory.length > 0 && <Separator className="my-2" />}

             {analysisHistory.length > 0 && (
                <SidebarGroup>
                    <SidebarGroupLabel>Analysis History</SidebarGroupLabel>
                    <SidebarMenu>
                        {analysisHistory.map((item) => (
                            <SidebarMenuItem key={item.id}>
                                <SidebarMenuButton
                                    onClick={() => {
                                      selectAnalysis(item.id);
                                      handleMobileNav();
                                    }}
                                    isActive={selectedAnalysis?.id === item.id}
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

                                <DeleteAnalysisDialog
                                    item={item}
                                    onConfirm={() => removeAnalysis(item.id)}
                                    onArchive={() => archiveAnalysis(item.id)}
                                >
                                    <Button variant="ghost" size="icon" className="absolute right-1 top-2 h-7 w-7 opacity-100 md:opacity-0 group-hover/menu-item:opacity-100 group-data-[collapsible=icon]:hidden">
                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                    </Button>
                                </DeleteAnalysisDialog>
                            </SidebarMenuItem>
                        ))}
                     </SidebarMenu>
                </SidebarGroup>
             )}
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        {/* Footer content can go here if needed */}
      </SidebarFooter>
    </Sidebar>
  );
}

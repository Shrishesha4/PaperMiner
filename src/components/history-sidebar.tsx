
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
  SidebarGroup,
  SidebarGroupLabel,
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
import { Separator } from './ui/separator';

export function HistorySidebar() {
  const { history, selectAnalysis, selectedAnalysis, removeAnalysis, removeDraft, isLoading } = useHistory();
  const { state, setOpenMobile } = useSidebar();

  const isScratchSelected = selectedAnalysis?.name === 'From Scratch';
  const drafts = history.filter(item => !!item.draftedPaper);

  const handleMobileNav = () => {
    setOpenMobile(false);
  }

  return (
    <Sidebar>
        <SidebarHeader>
            { state === 'expanded' && (
                <div className="flex flex-col gap-1 p-2">
                    <p className="text-xs text-muted-foreground">Your recent work</p>
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
                                     <Link href={`/paper-drafter?analysisId=${item.id}&title=${encodeURIComponent(item.draftedPaper!.title)}`}>
                                        <FileEdit className="flex-shrink-0"/>
                                        <div className="flex flex-col text-left overflow-hidden">
                                            <span className="font-medium truncate">{item.draftedPaper?.title}</span>
                                            <span className="text-xs text-muted-foreground truncate">
                                                Based on: {item.name}
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
                                        This action cannot be undone. This will permanently delete the draft for <span className="font-bold">{item.draftedPaper?.title}</span>, but the original analysis data will be kept.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => removeDraft(item.id)}>Delete Draft</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                                </AlertDialog>
                             </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            )}

             <Separator className="my-2" />

             <SidebarGroup>
                <SidebarGroupLabel>Analysis History</SidebarGroupLabel>
                <SidebarMenu>
                    {history.map((item) => (
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
                                    This action cannot be undone. This will permanently delete the analysis for <span className="font-bold">{item.name}</span> and any associated draft.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => removeAnalysis(item.id)}>Delete Analysis</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                        </SidebarMenuItem>
                    ))}
                 </SidebarMenu>
             </SidebarGroup>
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        {/* Footer content can go here if needed */}
      </SidebarFooter>
    </Sidebar>
  );
}

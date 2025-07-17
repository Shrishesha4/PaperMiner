
'use client';

import React from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useHistory } from "@/hooks/use-history";
import { KeyRound, Trash2 } from "lucide-react";
import { ApiKeyDialog } from "./api-key-dialog";
import { ThemeCustomizer } from "./theme-customizer";

export function SettingsDialogContent() {
    const { clearHistory, history } = useHistory();
    const [isKeyDialogOpen, setIsKeyDialogOpen] = React.useState(false);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Theme</CardTitle>
                    <CardDescription>
                        Customize the look and feel of the application.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ThemeCustomizer />
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>API Keys</CardTitle>
                    <CardDescription>
                        Manage your Google AI Gemini API keys. These are stored securely in your browser's local storage and are never sent to any server except Google's.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Dialog open={isKeyDialogOpen} onOpenChange={setIsKeyDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <KeyRound className="mr-2 h-4 w-4" />
                                Manage API Keys
                            </Button>
                        </DialogTrigger>
                        <ApiKeyDialog onOpenChange={setIsKeyDialogOpen} />
                    </Dialog>
                </CardContent>
            </Card>

            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle>Danger Zone</CardTitle>
                    <CardDescription>
                       These actions are irreversible. Please proceed with caution.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={history.length === 0}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Clear All History
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete all
                                of your analysis history and saved drafts from this browser.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={clearHistory}>Yes, Delete All</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    );
}

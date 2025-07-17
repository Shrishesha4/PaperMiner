
'use client';

import { ApiKeyDialog } from "@/components/api-key-dialog";
import { ThemeCustomizer } from "@/components/theme-customizer";
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
import { ArrowLeft, KeyRound, Trash2 } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function SettingsPage() {
    const { clearHistory, history } = useHistory();
    const [isKeyDialogOpen, setIsKeyDialogOpen] = React.useState(false);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <div className="space-y-1">
                    <Button asChild variant="outline" size="sm" className="mb-4">
                      <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        Back to App
                      </Link>
                    </Button>
                    <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">
                        Manage your application settings, API keys, and data.
                    </p>
                </div>
            </div>

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

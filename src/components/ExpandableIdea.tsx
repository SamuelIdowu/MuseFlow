"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ExpandableIdeaProps {
    idea: {
        id: string;
        title: string;
        createdAt: string;
        inputData?: any;
        inputType?: string;
    };
}

export function ExpandableIdea({ idea }: ExpandableIdeaProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setIsModalOpen(true)}
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="font-medium">{idea.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Generated on {format(new Date(idea.createdAt), 'MMM d, yyyy')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal for full details */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{idea.title}</DialogTitle>
                        <DialogDescription>
                            Generated on {format(new Date(idea.createdAt), 'MMM d, yyyy')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        {idea.inputType && (
                            <div>
                                <h4 className="text-sm font-medium mb-2">Input Type</h4>
                                <p className="text-sm capitalize">{idea.inputType}</p>
                            </div>
                        )}
                        {idea.inputData && (
                            <div>
                                <h4 className="text-sm font-medium mb-2">Input Data</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                                    {typeof idea.inputData === 'string'
                                        ? idea.inputData
                                        : JSON.stringify(idea.inputData, null, 2)}
                                </p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

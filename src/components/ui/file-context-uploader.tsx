'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Loader2 } from 'lucide-react';
import { extractText } from '@/app/actions/context';
import { toast } from 'react-hot-toast';

interface FileContextUploaderProps {
    onTextExtracted: (text: string) => void;
    isLoading?: boolean;
    label?: string;
    icon?: React.ReactNode;
    className?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
}

export function FileContextUploader({
    onTextExtracted,
    isLoading: externalLoading,
    label,
    icon,
    className,
    variant = 'outline',
    size = 'default'
}: FileContextUploaderProps) {
    const [internalLoading, setInternalLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isLoading = externalLoading || internalLoading;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setInternalLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const result = await extractText(formData);

            if (result.error) {
                toast.error(result.error);
            } else if (result.text) {
                onTextExtracted(result.text);
                toast.success(`Extracted content from ${file.name}`);
            } else {
                toast.error('No text found in file');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to process file');
        } finally {
            setInternalLoading(false);
            // Reset input so same file can be selected again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt,.md,.pdf,.docx"
                className="hidden"
            />
            <Button
                type="button"
                variant={variant}
                size={size}
                onClick={handleButtonClick}
                disabled={isLoading}
                className={className}
            >
                {isLoading ? (
                    <Loader2 className={`h-4 w-4 animate-spin ${label ? 'mr-2' : ''}`} />
                ) : (
                    icon || <Paperclip className={`h-4 w-4 ${label ? 'mr-2' : ''}`} />
                )}
                {label}
            </Button>
        </>
    );
}

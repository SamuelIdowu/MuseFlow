"use client";

import { useState, useTransition } from "react";
import { generateCampaignAction, saveCampaignAction } from "@/lib/campaignActions";
import { extractTextFromUrlAction, extractTextFromFileAction } from "@/lib/contextActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Copy, Twitter, Linkedin, Paperclip, Link as LinkIcon, Save } from "lucide-react";
import toast from "react-hot-toast";

interface CampaignPost {
    content: string;
    type: string;
}

interface CampaignGeneratorProps {
    onSaved?: () => void;
}

export function CampaignGenerator({ onSaved }: CampaignGeneratorProps) {
    const [topic, setTopic] = useState("");
    const [count, setCount] = useState([10]);
    const [platform, setPlatform] = useState("linkedin");
    const [tone, setTone] = useState("professional");
    const [instructions, setInstructions] = useState("");
    const [context, setContext] = useState("");
    const [urlInput, setUrlInput] = useState("");
    const [isLoadingContext, setIsLoadingContext] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [isSaving, startSaveTransition] = useTransition();
    const [results, setResults] = useState<CampaignPost[]>([]);
    const [currentTopic, setCurrentTopic] = useState("");

    const handleGenerate = () => {
        if (!topic.trim()) {
            toast.error("Please enter a topic");
            return;
        }

        startTransition(async () => {
            try {
                const data = await generateCampaignAction(topic, count[0], platform, tone, instructions, context);
                if (data && Array.isArray(data)) {
                    setResults(data);
                    setCurrentTopic(topic);
                    toast.success(`Generated ${data.length} posts!`);
                } else {
                    toast.error("Failed to generate content");
                }
            } catch (error) {
                console.error(error);
                toast.error("Something went wrong");
            }
        });
    };

    const handleSave = () => {
        if (results.length === 0) return;

        startSaveTransition(async () => {
            try {
                await saveCampaignAction(currentTopic, platform, tone, results);
                toast.success("Campaign saved!");
                setResults([]);
                setTopic("");
                setCurrentTopic("");
                onSaved?.();
            } catch (error) {
                console.error(error);
                toast.error("Failed to save campaign");
            }
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const handleUrlLoad = async () => {
        if (!urlInput.trim()) return;

        setIsLoadingContext(true);
        try {
            const text = await extractTextFromUrlAction(urlInput);
            if (text) {
                setContext(prev => (prev ? prev + "\n\n" + text : text));
                toast.success("Content loaded from URL");
                setUrlInput("");
            } else {
                toast.error("Could not extract content");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load URL");
        } finally {
            setIsLoadingContext(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoadingContext(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const text = await extractTextFromFileAction(formData);
            if (text) {
                setContext(prev => (prev ? prev + "\n\n" + text : text));
                toast.success("Content loaded from file");
            } else {
                toast.error("Could not extract content");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to parse file");
        } finally {
            setIsLoadingContext(false);
            // Reset input
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-8">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Campaign Generator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Topic / Goal</label>
                        <Input
                            placeholder="e.g. promoting my new SaaS for dog walkers..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>



                    <div className="space-y-2">
                        <label className="text-sm font-medium">Context Material (Optional)</label>
                        <div className="flex gap-2 mb-2">
                            <div className="flex-1 flex gap-2">
                                <Input
                                    placeholder="Paste a URL..."
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleUrlLoad}
                                    disabled={isLoadingContext || !urlInput}
                                    title="Load from URL"
                                >
                                    {isLoadingContext ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
                                </Button>
                            </div>
                            <div className="relative">
                                <input
                                    type="file"
                                    id="context-file-upload"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    accept=".pdf,.docx,.txt,.md"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={isLoadingContext}
                                    onClick={() => document.getElementById('context-file-upload')?.click()}
                                    title="Upload File (PDF, DOCX, TXT)"
                                >
                                    <Paperclip className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {context && (
                            <div className="text-xs text-muted-foreground flex justify-between items-center bg-muted/50 p-2 rounded">
                                <span>Loaded {context.length} chars of context</span>
                                <Button
                                    variant="ghost"
                                    className="h-auto p-1 text-xs text-destructive hover:text-destructive"
                                    onClick={() => setContext('')}
                                >
                                    Clear
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Platform</label>
                            <Select value={platform} onValueChange={setPlatform}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                                    <SelectItem value="x">Twitter / X</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Quantity: {count[0]} posts
                            </label>
                            <Slider
                                value={count}
                                onValueChange={setCount}
                                min={5}
                                max={30}
                                step={1}
                                className="py-4"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tone</label>
                            <Select value={tone} onValueChange={setTone}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="professional">Professional</SelectItem>
                                    <SelectItem value="casual">Casual</SelectItem>
                                    <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                                    <SelectItem value="informative">Informative</SelectItem>
                                    <SelectItem value="witty">Witty</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Additional Instructions (Optional)</label>
                            <Textarea
                                placeholder="e.g. Include emojis, focus on statistics, etc."
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                className="resize-none"
                                rows={3}
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        onClick={handleGenerate}
                        disabled={isPending || !topic}
                        className="w-full"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating Campaign...
                            </>
                        ) : (
                            "Generate Campaign"
                        )}
                    </Button>
                </CardFooter>
            </Card>

            {
                results.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center max-w-4xl mx-auto">
                            <h3 className="text-lg font-semibold">Generated Posts ({results.length})</h3>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                variant="default"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Campaign
                                    </>
                                )}
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {results.map((post, i) => (
                                <Card key={i} className="relative group hover:border-primary/50 transition-colors">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-mono bg-muted px-2 py-1 rounded uppercase">
                                                {post.type}
                                            </span>
                                            {platform === "linkedin" ? <Linkedin className="h-4 w-4 text-blue-600" /> : <Twitter className="h-4 w-4 text-black dark:text-white" />}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="whitespace-pre-wrap text-sm">{post.content}</p>
                                    </CardContent>
                                    <CardFooter className="pt-2 flex justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(post.content)}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                )
            }
        </div>
    );
}


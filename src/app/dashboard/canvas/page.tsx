'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Sparkles,
  RotateCcw,
  Copy,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CanvasBlock {
  id: string;
  type: string;
  content: string;
  order: number;
}

export default function CanvasPage() {
  const [blocks, setBlocks] = useState<CanvasBlock[]>([]);
  const [selectedChannel, setSelectedChannel] = useState('linkedin');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Function to fetch canvas blocks from Supabase
  const fetchCanvasBlocks = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('User not authenticated');
        return;
      }

      // First, try to get or create a canvas session
      let canvasSession;
      let { data: existingSessions, error: sessionError } = await supabase
        .from('canvas_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (sessionError) {
        console.error('Error fetching canvas sessions:', sessionError);
      }

      if (existingSessions && existingSessions.length > 0) {
        canvasSession = existingSessions[0];
      } else {
        // Create a new canvas session if none exists
        const { data: newSession, error: createError } = await supabase
          .from('canvas_sessions')
          .insert([{ 
            user_id: session.user.id, 
            name: 'New Canvas' 
          }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating canvas session:', createError);
          toast.error('Failed to create canvas session');
          return;
        }
        
        canvasSession = newSession;
      }

      // Fetch canvas blocks for this session
      const { data, error } = await supabase
        .from('canvas_blocks')
        .select('*')
        .eq('canvas_id', canvasSession.id)
        .order('order_index', { ascending: true });

      if (error) {
        throw error;
      }

      // Transform the data to match our interface
      const canvasBlocks = data.map((block: any) => ({
        id: block.id,
        type: block.type || 'paragraph',
        content: block.content,
        order: block.order_index
      }));

      setBlocks(canvasBlocks);
    } catch (error: any) {
      console.error('Error fetching canvas blocks:', error);
      toast.error(error.message || 'Failed to load canvas blocks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCanvasBlocks();
  }, [supabase]);

  const addBlock = async () => {
    const newBlock: CanvasBlock = {
      id: `block-${Date.now()}`,
      type: 'paragraph',
      content: '',
      order: blocks.length
    };
    
    // Add the block to the local state
    const updatedBlocks = [...blocks, newBlock];
    setBlocks(updatedBlocks);
    
    // Save to Supabase
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('User not authenticated');
        return;
      }

      // Get the current canvas session to use as canvas_id
      const { data: existingSessions } = await supabase
        .from('canvas_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!existingSessions || existingSessions.length === 0) {
        toast.error('No canvas session found');
        return;
      }
      
      const canvasSession = existingSessions[0];
      
      // Insert the new block into Supabase
      const { error } = await supabase
        .from('canvas_blocks')
        .insert([{
          canvas_id: canvasSession.id,
          user_id: session.user.id,
          type: newBlock.type,
          content: newBlock.content,
          order_index: newBlock.order
        }]);

      if (error) {
        throw error;
      }
      
      toast.success('Block added successfully!');
    } catch (error: any) {
      console.error('Error adding block:', error);
      toast.error('Failed to add block to database');
      // Revert the local change if database update fails
      setBlocks(blocks);
    }
  };

  const updateBlock = async (id: string, content: string) => {
    setBlocks(blocks.map(block =>
      block.id === id ? { ...block, content } : block
    ));

    // Update in Supabase
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('User not authenticated');
        return;
      }

      const { error } = await supabase
        .from('canvas_blocks')
        .update({ content })
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Error updating block:', error);
      toast.error('Failed to update block in database');
    }
  };

  const deleteBlock = async (id: string) => {
    const updatedBlocks = blocks.filter(block => block.id !== id).map((block, index) => ({
      ...block,
      order: index
    }));
    
    setBlocks(updatedBlocks);

    // Delete from Supabase
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('User not authenticated');
        return;
      }

      const { error } = await supabase
        .from('canvas_blocks')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        throw error;
      }
      
      toast.success('Block deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting block:', error);
      toast.error('Failed to delete block from database');
      // Revert the local change if database update fails
      setBlocks(blocks);
    }
  };

  const regenerateBlock = async (id: string) => {
    const block = blocks.find(b => b.id === id);
    if (!block) return;

    try {
      // Call the API to expand the content with AI
      const response = await fetch('/api/canvas/expand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          block_content: block.content,
          block_type: block.type
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to expand block');
      }

      const { expanded_content } = await response.json();

      // Update the block content
      setBlocks(blocks.map(block =>
        block.id === id ? { ...block, content: expanded_content } : block
      ));

      // Update in Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('User not authenticated');
        return;
      }

      const { error } = await supabase
        .from('canvas_blocks')
        .update({ content: expanded_content })
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        throw error;
      }

      toast.success('Block expanded successfully!');
    } catch (error: any) {
      console.error('Error expanding block:', error);
      toast.error(error.message || 'Failed to expand block');
    }
  };

  const moveBlock = async (id: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === id);
    if (index === -1) return;

    let newBlocks = [...blocks];
    if (direction === 'up' && index > 0) {
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    } else if (direction === 'down' && index < newBlocks.length - 1) {
      [newBlocks[index + 1], newBlocks[index]] = [newBlocks[index], newBlocks[index + 1]];
    } else {
      return; // No movement needed
    }

    // Update order indices
    const reorderedBlocks = newBlocks.map((block, i) => ({ ...block, order: i }));
    setBlocks(reorderedBlocks);

    // Update orders in Supabase
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('User not authenticated');
        return;
      }

      // Update all block orders in Supabase
      for (const block of reorderedBlocks) {
        const { error } = await supabase
          .from('canvas_blocks')
          .update({ order_index: block.order })
          .eq('id', block.id)
          .eq('user_id', session.user.id);

        if (error) {
          throw error;
        }
      }
    } catch (error: any) {
      console.error('Error updating block order:', error);
      toast.error('Failed to update block order in database');
      // Revert the local change if database update fails
      setBlocks(blocks);
    }
  };

  const exportContent = (format: 'copy' | 'download') => {
    const content = blocks.map(block => block.content).join('\n\n');

    if (format === 'copy') {
      navigator.clipboard.writeText(content);
      toast.success('Content copied to clipboard!');
    } else {
      // Create a downloadable file
      const element = document.createElement('a');
      const file = new Blob([content], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = 'content-export.txt';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success('Content downloaded!');
    }
  };

  const getChannelPreview = () => {
    const content = blocks.map(block => block.content).join(' ');
    switch (selectedChannel) {
      case 'linkedin':
        return `📄 LinkedIn Post:\n\n${content}\n\n#ContentCreation #AI #Marketing`;
      case 'x':
        return `🐦 X Post:\n\n${content.substring(0, 280)}...`;
      case 'blog':
        return `📝 Blog Post:\n\n# ${blocks[0]?.content || 'Title'}\n\n${content}`;
      default:
        return content;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Smart Canvas</h2>
          <p className="text-muted-foreground">
            Drag, drop, and refine your content with AI assistance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportContent('copy')}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
          <Button variant="outline" onClick={() => exportContent('download')}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button onClick={() => setIsPreviewOpen(!isPreviewOpen)}>
            <Sparkles className="mr-2 h-4 w-4" />
            Preview & Export
          </Button>
        </div>
      </div>

      {isPreviewOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Preview & Export</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Channel</label>
                  <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="x">X (Twitter)</SelectItem>
                      <SelectItem value="blog">Blog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  <Button className="w-full" onClick={() => exportContent('copy')}>
                    Copy to Clipboard
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => exportContent('download')}>
                    Download as Text
                  </Button>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Preview</h3>
                <div className="bg-muted rounded-lg p-4 min-h-[150px]">
                  <pre className="whitespace-pre-wrap break-words">
                    {getChannelPreview()}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Content Blocks</h3>
          <Button variant="outline" onClick={addBlock}>
            <Plus className="mr-2 h-4 w-4" />
            Add Block
          </Button>
        </div>

        <div className="space-y-4">
          {blocks.map((block, index) => (
            <Card key={block.id} className="group">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">
                    {block.type.charAt(0).toUpperCase() + block.type.slice(1)}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveBlock(block.id, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveBlock(block.id, 'down')}
                      disabled={index === blocks.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => regenerateBlock(block.id)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteBlock(block.id)}
                      className="text-destructive"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={block.content}
                  onChange={(e) => updateBlock(block.id, e.target.value)}
                  placeholder={`Enter your ${block.type} content here...`}
                  className="min-h-[120px]"
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => regenerateBlock(block.id)}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Regenerate with AI
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
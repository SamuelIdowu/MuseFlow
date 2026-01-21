export interface Block {
    id: string;
    type: string;
    content: string;
    order: number;
    position: {
        x: number;
        y: number;
    };
}

export interface CanvasEdge {
    id: string;
    source: string;
    target: string;
    label?: string | null;
}

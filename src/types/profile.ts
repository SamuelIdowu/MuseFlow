export interface ToneConfig {
    professionalism: number;
    creativity: number;
    casualness: number;
    directness: number;
}

export interface Profile {
    id: string;
    user_id: string;
    profile_name: string;
    niche: string | null;
    tone_config: ToneConfig | null;
    samples: string[] | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

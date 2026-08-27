import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MuseFlow — AI Studio for Writers & Creators',
    short_name: 'MuseFlow',
    description: 'AI-powered content ideation, visual node planning, and publishing studio for writers and content creators.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#ea580c',
    icons: [
      {
        src: '/logoo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logoo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

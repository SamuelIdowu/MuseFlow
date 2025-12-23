import { ImageResponse } from 'next/og';

// 1. Add this line to force the Edge runtime
export const runtime = 'edge';

export const size = {
    width: 50,
    height: 50,
};

export const contentType = 'image/png';

export default async function Icon() {
    // Ensure the path is correct relative to this file. 
    // If your file is in `src/app/icon.tsx`, use '../../public/...'
    // If your file is in `app/icon.tsx` (root), use '../public/...'
    const logoData = await fetch(
        new URL('../../public/logoo.png', import.meta.url)
    ).then((res) => res.arrayBuffer());

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'transparent',
                }}
            >
                {/* 2. Use standard ArrayBuffer to Base64 (Buffer is sometimes limited in Edge) */}
                <img
                    src={`data:image/png;base64,${Buffer.from(logoData).toString('base64')}`}
                    alt="MuseFlow"
                    width="32"
                    height="32"
                    style={{
                        objectFit: 'contain',
                    }}
                />
            </div>
        ),
        {
            ...size,
        }
    );
}
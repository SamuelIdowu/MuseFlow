import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
    width: 50,
    height: 50,
};

export const contentType = 'image/png';

// Image generation
export default async function Icon() {
    // Load the logo image
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

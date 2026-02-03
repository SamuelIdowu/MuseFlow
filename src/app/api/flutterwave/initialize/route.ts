import { NextResponse } from 'next/server';
import { FEATURES } from '@/lib/featureFlags';
// import flw from '@/lib/flutterwave';

export async function POST(req: Request) {
    // FEATURE FLAG: When payments are disabled, return success without processing
    if (!FEATURES.PAYMENTS_ENABLED) {
        return NextResponse.json({ 
            message: 'Payments are currently disabled.',
            disabled: true 
        }, { status: 200 });
    }

    try {
        const body = await req.json();
        const { plan, email, userId } = body;

        if (!plan || !email || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Optional: Server-side initialization if not using frontend SDK entirely
        // const payload = {
        //   tx_ref: Date.now().toString(),
        //   amount: '10', // dynamically determined
        //   currency: 'USD',
        //   payment_options: 'card',
        //   redirect_url: '...',
        //   customer: { email, name: userId },
        //   payment_plan: plan 
        // };
        // const response = await flw.Charge.card(payload); // Simplification, usually involves encryption or standard init

        return NextResponse.json({ message: 'Use frontend SDK for initialization' });
    } catch (error) {
        console.error('Flutterwave Init Error:', error);
        return NextResponse.json({ error: 'Initialization failed' }, { status: 500 });
    }
}

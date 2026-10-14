declare module 'flutterwave-node-v3' {
    export default class Flutterwave {
        constructor(publicKey: string, secretKey: string);

        Transaction: {
            verify(data: { id: string }): Promise<Record<string, unknown>>;
        };

        Subscription: {
            cancel(data: { id: string }): Promise<Record<string, unknown>>;
        };
    }
}

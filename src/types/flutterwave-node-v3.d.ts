declare module 'flutterwave-node-v3' {
    export default class Flutterwave {
        constructor(publicKey: string, secretKey: string);

        Transaction: {
            verify(data: { id: string }): Promise<any>;
        };

        Subscription: {
            cancel(data: { id: string }): Promise<any>;
        };
    }
}

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const clerkSecret = headersList.get('svix-id') &&
                      headersList.get('svix-timestamp') &&
                      headersList.get('svix-signature');

    // If Clerk webhook headers are present, handle webhook
    if (clerkSecret) {
      const payload = await request.json();

      // Verify webhook signature
      const svix_id = headersList.get('svix-id');
      const svix_timestamp = headersList.get('svix-timestamp');
      const svix_signature = headersList.get('svix-signature');

      if (!svix_id || !svix_timestamp || !svix_signature) {
        return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
      }

      const clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET;

      // Only verify webhook if secret is provided (allows local development without webhooks)
      if (clerkWebhookSecret) {
        try {
          const wh = new Webhook(clerkWebhookSecret);
          wh.verify(
            JSON.stringify(payload),
            {
              'svix-id': svix_id,
              'svix-timestamp': svix_timestamp,
              'svix-signature': svix_signature,
            }
          );
        } catch (err) {
          console.error('Webhook verification failed:', err);
          return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 });
        }
      } else {
        console.warn('Clerk webhook secret not provided - skipping verification (local development)');
      }

      const { type, data } = payload;

      // Handle user creation
      if (type === 'user.created') {
        const { id: clerk_id, email_addresses } = data;

        // Get primary email
        const primaryEmail = email_addresses?.find((email: { id: string; email_address: string }) => email.id === data.primary_email_address_id);
        const email = primaryEmail?.email_address || email_addresses?.[0]?.email_address;

        if (!email) {
          console.error('No email found for user creation:', clerk_id);
          return NextResponse.json({ error: 'No email provided' }, { status: 400 });
        }

        await db
          .insert(users)
          .values({
            clerkId: clerk_id,
            email,
          })
          .onConflictDoUpdate({
            target: users.clerkId,
            set: { email },
          });

        console.log('User synced successfully to Neon:', { clerk_id, email });
        return NextResponse.json({ message: 'User synced successfully' });
      }

      // Handle user deletion
      if (type === 'user.deleted') {
        const { id: clerk_id } = data;

        await db
          .delete(users)
          .where(eq(users.clerkId, clerk_id));

        console.log('User deleted successfully from Neon:', clerk_id);
        return NextResponse.json({ message: 'User deleted successfully' });
      }

      // Handle user update
      if (type === 'user.updated') {
        const { id: clerk_id, email_addresses } = data;

        const primaryEmail = email_addresses?.find((email: { id: string; email_address: string }) => email.id === data.primary_email_address_id);
        const email = primaryEmail?.email_address || email_addresses?.[0]?.email_address;

        if (email) {
          await db
            .update(users)
            .set({ email })
            .where(eq(users.clerkId, clerk_id));

          console.log('User updated successfully in Neon:', clerk_id);
        }

        return NextResponse.json({ message: 'User updated successfully' });
      }
    }

    // Fallback for regular auth requests (backward compatibility)
    const { action } = await request.json();

    if (action === 'signout') {
      // Handle signout if needed
      return NextResponse.json({ message: 'Signout handled by client' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in auth webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Auth webhook endpoint - POST only' });
}

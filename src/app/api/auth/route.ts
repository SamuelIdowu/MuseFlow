import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  // Initialize Supabase client inside the function to avoid build-time errors
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase configuration');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

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

      const clerkSecretKey = process.env.CLERK_PUBLISHABLE_KEY;
      if (!clerkSecretKey) {
        console.error('Missing Clerk publishable key');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
      }

      const wh = new Webhook(clerkSecretKey);
      wh.verify(
        JSON.stringify(payload),
        {
          'svix-id': svix_id,
          'svix-timestamp': svix_timestamp,
          'svix-signature': svix_signature,
        }
      );

      const { type, data } = payload;

      // Handle user creation
      if (type === 'user.created') {
        const { id: clerk_id, email_addresses, first_name, last_name, username } = data;

        // Get primary email
        const primaryEmail = email_addresses?.find((email: { id: string; email_address: string }) => email.id === data.primary_email_address_id);
        const email = primaryEmail?.email_address || email_addresses?.[0]?.email_address;

        if (!email) {
          console.error('No email found for user creation:', clerk_id);
          return NextResponse.json({ error: 'No email provided' }, { status: 400 });
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', clerk_id)
          .single();

        if (!existingUser) {
          // Create user in Supabase
          const { error: createError } = await supabase
            .from('users')
            .insert([
              {
                clerk_id,
                email,
              },
            ]);

          if (createError) {
            console.error('Error creating user in Supabase:', createError);
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
          }

          console.log('User created successfully:', { clerk_id, email });
        }

        return NextResponse.json({ message: 'User synced successfully' });
      }

      // Handle user deletion
      if (type === 'user.deleted') {
        const { id: clerk_id } = data;

        const { error } = await supabase
          .from('users')
          .delete()
          .eq('clerk_id', clerk_id);

        if (error) {
          console.error('Error deleting user from Supabase:', error);
          return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
        }

        console.log('User deleted successfully:', clerk_id);
        return NextResponse.json({ message: 'User deleted successfully' });
      }

      // Handle user update
      if (type === 'user.updated') {
        const { id: clerk_id, email_addresses } = data;

        const primaryEmail = email_addresses?.find((email: { id: string; email_address: string }) => email.id === data.primary_email_address_id);
        const email = primaryEmail?.email_address || email_addresses?.[0]?.email_address;

        if (email) {
          const { error } = await supabase
            .from('users')
            .update({ email })
            .eq('clerk_id', clerk_id);

          if (error) {
            console.error('Error updating user in Supabase:', error);
            return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
          }

          console.log('User updated successfully:', clerk_id);
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

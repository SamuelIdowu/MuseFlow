import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createSupabaseServiceClient, ensureSupabaseUser } from '@/lib/supabaseServerClient';

export async function PUT(request: Request) {
  try {
    // Get Clerk authentication
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      console.error('Canvas update - No Clerk user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      console.error('Canvas update - No email found for user');
      return NextResponse.json({ error: 'User has no email address' }, { status: 400 });
    }

    // Ensure user exists in Supabase and get their UUID
    const supabaseUserId = await ensureSupabaseUser(userId, email);
    if (!supabaseUserId) {
      return NextResponse.json({ error: 'Failed to ensure user exists' }, { status: 500 });
    }

    // Create Supabase service client (bypasses RLS)
    const supabase = createSupabaseServiceClient();

    // Get canvas session ID from query parameters
    const { searchParams } = new URL(request.url);
    const canvasId = searchParams.get('id');

    if (!canvasId) {
      return NextResponse.json({ error: 'Canvas ID is required' }, { status: 400 });
    }

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Canvas name is required' }, { status: 400 });
    }

    // Update the canvas session in the database
    const { data, error } = await supabase
      .from('canvas_sessions')
      .update({
        name,
        updated_at: new Date().toISOString()
      })
      .eq('id', canvasId)
      .eq('user_id', supabaseUserId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating canvas session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Get Clerk authentication
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      console.error('Canvas delete - No Clerk user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      console.error('Canvas delete - No email found for user');
      return NextResponse.json({ error: 'User has no email address' }, { status: 400 });
    }

    // Ensure user exists in Supabase and get their UUID
    const supabaseUserId = await ensureSupabaseUser(userId, email);
    if (!supabaseUserId) {
      return NextResponse.json({ error: 'Failed to ensure user exists' }, { status: 500 });
    }

    // Create Supabase service client (bypasses RLS)
    const supabase = createSupabaseServiceClient();

    // Get canvas session ID from query parameters
    const { searchParams } = new URL(request.url);
    const canvasId = searchParams.get('id');

    if (!canvasId) {
      return NextResponse.json({ error: 'Canvas ID is required' }, { status: 400 });
    }

    // Delete the canvas session from the database
    // This will also delete associated canvas blocks due to foreign key constraint
    const { error } = await supabase
      .from('canvas_sessions')
      .delete()
      .eq('id', canvasId)
      .eq('user_id', supabaseUserId);

    if (error) throw error;

    return NextResponse.json({ message: 'Canvas session deleted successfully' });
  } catch (error) {
    console.error('Error deleting canvas session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
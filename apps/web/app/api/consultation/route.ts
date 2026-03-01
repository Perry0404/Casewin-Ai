import { NextRequest, NextResponse } from 'next/server';

function generateRoomId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `cw-${timestamp}-${randomPart}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lawyer_id, booking_id } = body;

    if (!lawyer_id) {
      return NextResponse.json(
        { success: false, error: 'lawyer_id is required' },
        { status: 400 }
      );
    }

    const roomId = generateRoomId();
    const meetingUrl = `/consultation/${roomId}`;
    const jitsiRoom = `CaseWinNG_${roomId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

    return NextResponse.json({
      success: true,
      meeting: {
        room_id: roomId,
        meeting_url: meetingUrl,
        jitsi_room: jitsiRoom,
        jitsi_url: `https://meet.jit.si/${jitsiRoom}`,
        created_at: new Date().toISOString(),
        lawyer_id,
        booking_id: booking_id || null,
      }
    });
  } catch (error) {
    console.error('Error creating consultation room:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create consultation room' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('room_id');

  if (!roomId) {
    return NextResponse.json(
      { success: false, error: 'room_id is required' },
      { status: 400 }
    );
  }

  const jitsiRoom = `CaseWinNG_${roomId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return NextResponse.json({
    success: true,
    meeting: {
      room_id: roomId,
      meeting_url: `/consultation/${roomId}`,
      jitsi_room: jitsiRoom,
      jitsi_url: `https://meet.jit.si/${jitsiRoom}`,
      active: true,
    }
  });
}
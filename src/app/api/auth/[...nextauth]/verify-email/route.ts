import { NextResponse } from 'next/server';
import { verifyToken } from '@/app/actions/auth-actions';

export default async function (request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect('/auth/error?message=Missing token');
  }

  const result = await verifyToken(token);

  if (result.error) {
    return NextResponse.redirect(`/auth/error?message=${result.error}`);
  }

  return NextResponse.redirect('/auth/verified');
}

import { NextRequest, NextResponse } from 'next/server';
import { createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body as { password: string };

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
    }

    const token = await createToken();

    // Só marca o cookie como `secure` quando a conexão é realmente HTTPS.
    // Em produção atrás de um proxy, o protocolo original vem em x-forwarded-proto.
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const isHttps =
      forwardedProto === 'https' || request.nextUrl.protocol === 'https:';

    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

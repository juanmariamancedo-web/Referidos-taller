'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma'; // Ajusta a tu instancia de Prisma
import bcrypt from 'bcryptjs';

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { message: 'Por favor, completa todos los campos.' };
  }

  let user;
  try {
    user = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!user || !user.activo) {
      return { message: 'Credenciales inválidas.' };
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return { message: 'Credenciales inválidas.' };
    }

    // Setear la cookie de sesión de forma síncrona/asíncrona según tu versión
    const cookieStore = await cookies();
    cookieStore.set('session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });
  } catch (error) {
    return { message: 'Ocurrió un error en el servidor.' };
  }

  // IMPORTANTE: El redirect debe ir SIEMPRE fuera del try/catch
  redirect('/dashboard');
}
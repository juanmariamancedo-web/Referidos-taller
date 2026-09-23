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
 redirect('/');
}

export async function getUserAuth() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  // Si no hay cookie de sesión, retornamos null inmediatamente
  if (!sessionCookie?.value) {
    return ({
        success: false, 
        message: "No se ha encontrado cookie asociada"
    });
  }

  const userId = sessionCookie.value;

  try {
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        activo: true,
        // Evita seleccionar la clave hash 'passwordHash' por seguridad
      },
    });

    if (!user || !user.activo) {
      return ({
        success: false, 
        message: "No se ha encontrado usuario valido"
      });
    }

    return ({
        success: true, 
        data: user
    });
  } catch (error) {
    console.error('Error al obtener el usuario autenticado:', error);

    return ({
        success: false,
        message: 'Error al obtener el usuario autenticado:'
    });
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  redirect('/login');
}
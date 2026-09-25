'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma'; // Ajusta a tu instancia de Prisma
import bcrypt from 'bcryptjs';
import { hashToken } from '@/lib/crypto';

export type VerifyState = {
  success?: boolean
  message?: string
  errors?: Record<string, string>
} | null

export async function verifyAndActivateUser(
  prevState: VerifyState,
  formData: FormData
): Promise<VerifyState> {
  // const email = (formData.get('email') as string)?.trim().toLowerCase()
  const code = (formData.get('code') as string)?.trim()
  const nombre = (formData.get('nombre') as string)?.trim()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  // 1. Validaciones de formulario
  if (!code || !nombre || !password || !confirmPassword) {
    return {
      success: false,
      message: 'Todos los campos son obligatorios.',
    }
  }

  if (password.length < 6) {
    return {
      success: false,
      message: 'La contraseña debe tener al menos 6 caracteres.',
      errors: { password: 'Mínimo 6 caracteres' },
    }
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      message: 'Las contraseñas no coinciden.',
      errors: { confirmPassword: 'Las contraseñas no coinciden' },
    }
  }

  try {
    // 2. Calcular el hash del código para buscarlo en la BD
    const tokenHash = hashToken(code)

    const verificationRecord = await prisma.verificationCode.findFirst({
      where: {
        // email,
        token: tokenHash,
        used: false,
        expiresAt: { gt: new Date() },
      },
    })

    if (!verificationRecord) {
      return {
        success: false,
        message: 'El código de verificación es inválido, ya fue utilizado o ha expirado.',
      }
    }

    // 3. Obtener el usuario pre-registrado
    const user = await prisma.usuario.findUnique({
      where: { email: verificationRecord.email },
    })

    if (!user) {
      return {
        success: false,
        message: 'No se encontró la cuenta de usuario asociada a este correo.',
      }
    }

    // 4. Hashear la contraseña nueva
    const passwordHash = await bcrypt.hash(password, 10)

    // Determinar el rol según la lógica de tu negocio
    const newRole = user.rol === 'NO_VERIFICADO' ? 'VENDEDOR' : user.rol

    // 5. Actualización atómica
    await prisma.$transaction([
      prisma.usuario.update({
        where: { id: user.id },
        data: {
          nombre,
          passwordHash,
          rol: newRole,
        },
      }),
      prisma.verificationCode.update({
        where: { id: verificationRecord.id },
        data: { used: true },
      }),
    ])
  } catch (error: any) {
    console.error('Error en verifyAndActivateUser:', error)
    return {
      success: false,
      message: 'Ocurrió un error al activar la cuenta. Inténtalo nuevamente.',
    }
  }

  // 6. El redirect debe ejecutarse SIEMPRE fuera del try/catch
  redirect('/login?verified=true')
}

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

  const isValidPassword = user.passwordHash? await bcrypt.compare(password, user.passwordHash) : false
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
      omit: {
        passwordHash: true
      }
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
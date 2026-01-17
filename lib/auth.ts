import crypto from 'crypto';
import bcrypt from 'bcrypt';

// Password hashing functions
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password from database
 * @returns True if passwords match, false otherwise
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export interface SessionToken {
  adminId?: string; // للأدمن
  employeeId?: string; // للعامل
  username: string;
  expiresAt: number;
  userType: 'admin' | 'employee'; // نوع المستخدم
}

const SESSION_SECRET = process.env.SESSION_SECRET || 'default-secret-change-in-production';

export function createSessionToken(userId: string, username: string, userType: 'admin' | 'employee'): string {
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 ساعة

  const payload: SessionToken = {
    ...(userType === 'admin' ? { adminId: userId } : { employeeId: userId }),
    username,
    expiresAt,
    userType,
  };

  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr).toString('base64');

  // إنشاء signature
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64');

  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string): SessionToken | null {
  try {
    const [payloadB64, signature] = token.split('.');

    if (!payloadB64 || !signature) {
      return null;
    }

    // التحقق من الـ signature
    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payloadB64)
      .digest('base64');

    if (signature !== expectedSignature) {
      return null;
    }

    // فك تشفير الـ payload
    const payloadStr = Buffer.from(payloadB64, 'base64').toString('utf-8');
    const payload: SessionToken = JSON.parse(payloadStr);

    // التحقق من انتهاء الصلاحية
    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

export function getAuthHeader(request: Request): string | null {
  return request.headers.get('authorization')?.replace('Bearer ', '') || null;
}

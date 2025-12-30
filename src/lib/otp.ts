import { supabase } from './supabase';

export interface OTPData {
  id: string;
  email: string;
  otp: string;
  purpose: 'signup' | 'password_reset' | 'email_verification';
  expires_at: string;
  used: boolean;
  user_id?: string;
}

/**
 * Generate a 6-digit OTP
 */
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP via email
 * In production, this should integrate with email service (SendGrid, AWS SES, etc.)
 */
const sendOTPEmail = async (email: string, otp: string, purpose: 'signup' | 'password_reset'): Promise<void> => {
  // For now, we'll use console.log - in production, integrate with email service
  const subject = purpose === 'signup' 
    ? 'Verify your LeadPilot Account - OTP'
    : 'Reset Your LeadPilot Password - OTP';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(to right, #2563eb, #4f46e5); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">LeadPilot CRM</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">
          ${purpose === 'signup' ? 'Verify Your Email Address' : 'Reset Your Password'}
        </h2>
        <p style="color: #4b5563; font-size: 16px;">
          ${purpose === 'signup' 
            ? 'Thank you for signing up for LeadPilot CRM! Please use the OTP below to verify your email address and complete your registration.'
            : 'You requested to reset your password. Please use the OTP below to reset your password.'}
        </p>
        <div style="background: white; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
          <div style="font-size: 36px; font-weight: bold; color: #2563eb; letter-spacing: 8px; font-family: monospace;">
            ${otp}
          </div>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
          This OTP will expire in 10 minutes. If you didn't request this, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} LeadPilot CRM. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
  // For development, log the OTP
  console.log(`📧 OTP Email to ${email}: ${otp}`);
  
  // In production, use something like:
  // await sendEmailViaService(email, subject, html);
  
  // For now, show alert in browser (development only)
  if (typeof window !== 'undefined') {
    alert(`OTP sent to ${email}: ${otp}\n\n(This is for development. In production, this will be sent via email.)`);
  }
};

/**
 * Create and send OTP
 */
export const createAndSendOTP = async (
  email: string,
  purpose: 'signup' | 'password_reset' | 'email_verification',
  userId?: string
): Promise<string> => {
  // Generate OTP
  const otp = generateOTP();
  
  // Expires in 10 minutes
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  // Invalidate any existing unused OTPs for this email and purpose
  await supabase
    .from('email_otps')
    .update({ used: true })
    .eq('email', email)
    .eq('purpose', purpose)
    .eq('used', false);

  // Store OTP in database
  const { data, error } = await supabase
    .from('email_otps')
    .insert([
      {
        email,
        otp,
        purpose,
        expires_at: expiresAt.toISOString(),
        user_id: userId || null,
        used: false
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating OTP:', error);
    throw new Error('Failed to create OTP');
  }

  // Send OTP via email
  await sendOTPEmail(email, otp, purpose as 'signup' | 'password_reset');

  return data.id;
};

/**
 * Verify OTP
 */
export const verifyOTP = async (
  email: string,
  otp: string,
  purpose: 'signup' | 'password_reset' | 'email_verification'
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('email_otps')
    .select('*')
    .eq('email', email)
    .eq('otp', otp)
    .eq('purpose', purpose)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }

  if (!data) {
    return false;
  }

  // Mark OTP as used
  await supabase
    .from('email_otps')
    .update({ used: true })
    .eq('id', data.id);

  return true;
};

/**
 * Resend OTP
 */
export const resendOTP = async (
  email: string,
  purpose: 'signup' | 'password_reset' | 'email_verification',
  userId?: string
): Promise<string> => {
  return createAndSendOTP(email, purpose, userId);
};

/**
 * Check if OTP exists and is valid (without marking as used)
 */
export const checkOTPExists = async (
  email: string,
  purpose: 'signup' | 'password_reset' | 'email_verification'
): Promise<boolean> => {
  const { data } = await supabase
    .from('email_otps')
    .select('id')
    .eq('email', email)
    .eq('purpose', purpose)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .limit(1)
    .maybeSingle();

  return !!data;
};


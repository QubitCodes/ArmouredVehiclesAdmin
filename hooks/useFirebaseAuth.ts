import { useState, useRef, useEffect } from 'react';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink,
  linkWithPhoneNumber,
  updatePhoneNumber,
  PhoneAuthProvider,
  ConfirmationResult,
  UserCredential,
  User,
  onAuthStateChanged,
  PhoneAuthCredential
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface UseFirebaseAuthReturn {
  // Phone Auth
  sendPhoneOtp: (phoneNumber: string, containerId: string) => Promise<ConfirmationResult>;
  verifyPhoneOtp: (confirmationResult: ConfirmationResult, code: string) => Promise<UserCredential>;
  
  // Account Linking (Phone)
  linkPhone: (phoneNumber: string, containerId: string) => Promise<ConfirmationResult>;
  verifyPhoneLink: (confirmationResult: ConfirmationResult, code: string) => Promise<UserCredential>;

  // Phone Update (for existing users)
  verifyAndGetCredential: (confirmationResult: ConfirmationResult, code: string) => PhoneAuthCredential;
  updateUserPhone: (credential: PhoneAuthCredential) => Promise<void>;

  // Magic Link Auth
  sendMagicLink: (email: string, redirectUrl?: string) => Promise<void>;
  verifyMagicLink: (email: string, windowUrl?: string) => Promise<UserCredential>;
  isMagicLink: (windowUrl: string) => boolean;
  
  // Helpers
  reauthenticate: (phoneNumber: string, containerId: string) => Promise<ConfirmationResult>;

  // State
  user: User | null;
  loading: boolean;
  error: string | null;
  recaptchaVerifier: RecaptchaVerifier | null;
}

export function useFirebaseAuth(): UseFirebaseAuthReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
     const unsubscribe = onAuthStateChanged(auth, (u) => {
         setUser(u);
     });
     return () => unsubscribe();
  }, []);

  // Helper to get verifier
  const getVerifier = (containerId: string) => {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, containerId, {
          'size': 'invisible',
          'callback': (response: any) => {
            console.log("Recaptcha Verified");
          },
          'expired-callback': () => {
             console.log("Recaptcha Expired");
             setError("Recaptcha expired. Please try again.");
          }
        });
      }
      return recaptchaVerifierRef.current;
  };

  // 1. Send Phone OTP (Sign In)
  const sendPhoneOtp = async (phoneNumber: string, containerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const appVerifier = getVerifier(containerId);
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      return confirmationResult;
    } catch (err: any) {
      console.error("Firebase SMS Error:", err);
      setError(err.message || "Failed to send SMS");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify Phone OTP (Sign In)
  const verifyPhoneOtp = async (confirmationResult: ConfirmationResult, code: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await confirmationResult.confirm(code);
      return result;
    } catch (err: any) {
      console.error("Firebase OTP Error:", err);
      setError(err.message || "Invalid OTP");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 3. Link Phone Number (Connect to existing account)
  const linkPhone = async (phoneNumber: string, containerId: string) => {
      setLoading(true);
      setError(null);
      try {
          if (!auth.currentUser) throw new Error("No user signed in to link phone to");
          const appVerifier = getVerifier(containerId);
          const confirmationResult = await linkWithPhoneNumber(auth.currentUser, phoneNumber, appVerifier);
          return confirmationResult;
      } catch (err: any) {
          console.error("Firebase Link Phone Error:", err);
          setError(err.message || "Failed to link phone");
          throw err;
      } finally {
          setLoading(false);
      }
  };

  // 4. Verify Phone Link
  const verifyPhoneLink = async (confirmationResult: ConfirmationResult, code: string) => {
      setLoading(true);
      setError(null);
      try {
          const result = await confirmationResult.confirm(code);
          return result;
      } catch (err: any) {
          console.error("Firebase Verify Link Error:", err);
          setError(err.message || "Invalid OTP for linking");
          throw err;
      } finally {
          setLoading(false);
      }
  };

  // 5. Get Phone Auth Credential without signing in (for updating existing user's phone)
  const verifyAndGetCredential = (confirmationResult: ConfirmationResult, code: string): PhoneAuthCredential => {
      // Create credential from verification ID and OTP code
      const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, code);
      return credential;
  };

  // 6. Update current user's phone number using credential
  const updateUserPhone = async (credential: PhoneAuthCredential) => {
      setLoading(true);
      setError(null);
      try {
          if (!auth.currentUser) throw new Error("No user signed in");
          await updatePhoneNumber(auth.currentUser, credential);
      } catch (err: any) {
          console.error("Firebase Update Phone Error:", err);
          setError(err.message || "Failed to update phone number");
          throw err;
      } finally {
          setLoading(false);
      }
  };

  // 5. Send Magic Link
  const sendMagicLink = async (email: string, redirectUrl = window.location.href) => {
    setLoading(true);
    setError(null);
    try {
      // Append email to redirect URL for robust recovery across devices/tabs
      const urlObj = new URL(redirectUrl);
      urlObj.searchParams.set('email', email);
      
      const actionCodeSettings = {
        url: urlObj.toString(),
        handleCodeInApp: true,
      };
      
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      // Save email locally to verify later if opened on same device
      window.localStorage.setItem('emailForSignIn', email);
    } catch (err: any) {
      console.error("Firebase Magic Link Error:", err);
      setError(err.message || "Failed to send magic link");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 6. Verify Magic Link
  const isMagicLink = (windowUrl: string) => {
      return isSignInWithEmailLink(auth, windowUrl);
  };

  const verifyMagicLink = async (email: string, windowUrl: string = window.location.href) => {
    setLoading(true);
    setError(null);
    try {
      if (!isSignInWithEmailLink(auth, windowUrl)) {
          throw new Error("Not a valid sign-in link");
      }
      
      // If email is not provided (e.g. opened on different device), prompt or handle externally.
      // But this function expects email.
      if (!email) {
           throw new Error("Email is required to verify link");
      }

      const result = await signInWithEmailLink(auth, email, windowUrl);
      window.localStorage.removeItem('emailForSignIn');
      return result;
    } catch (err: any) {
      console.error("Firebase Magic Link Verify Error:", err);
      setError(err.message || "Failed to verify magic link");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Alias sendPhoneOtp as reauthenticate for now, assuming SMS proof is sufficient
  const reauthenticate = sendPhoneOtp;

  return {
    sendPhoneOtp,
    verifyPhoneOtp,
    linkPhone,
    verifyPhoneLink,
    verifyAndGetCredential,
    updateUserPhone,
    sendMagicLink,
    verifyMagicLink,
    isMagicLink,
    reauthenticate,
    user,
    loading,
    error,
    recaptchaVerifier: recaptchaVerifierRef.current
  };
}

import { supabase } from '../lib/supabaseClient';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Purchases from 'react-native-purchases';

export async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices();
    const signInResult = await GoogleSignin.signIn();

    // Récupérer l'idToken depuis signIn() ou getTokens()
    let idToken: string | null = null;

    // API v12+ retourne { type, data: { idToken } }
    if (signInResult && 'data' in signInResult && signInResult.data?.idToken) {
      idToken = signInResult.data.idToken;
    }
    // API plus ancienne retourne { idToken } directement
    else if (signInResult && 'idToken' in signInResult) {
      idToken = (signInResult as any).idToken;
    }

    // Fallback: getTokens()
    if (!idToken) {
      const tokens = await GoogleSignin.getTokens();
      idToken = tokens.idToken;
    }

    if (!idToken) {
      throw new Error('Pas de ID token Google');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) throw error;

    // Lier l'utilisateur RevenueCat au uid Supabase
    // pour que les webhooks identifient correctement l'utilisateur
    if (data.user?.id) {
      try {
        await Purchases.logIn(data.user.id);
      } catch (e) {
        console.warn('[RevenueCat] logIn error (non-bloquant):', e);
      }
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export async function signOut() {
  try {
    await GoogleSignin.signOut();
  } catch {
    // Ignorer si pas connecté via Google
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSupabaseAccessToken(): Promise<string> {
  const session = await getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  return session.access_token;
}

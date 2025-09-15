import { useAppDispatch, useAppSelector } from './index';
import { signIn, signUp, signOut, loadStoredAuth } from './authSlice';

export default function useAuth() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((s) => s.auth);

  const handleSignIn = (email: string, password: string) => {
    dispatch(signIn(email, password));
  };

  const handleSignUp = (userData: { email: string; password: string; firstName: string; lastName: string; }) => {
    dispatch(signUp(userData));
  };

  const handleSignOut = () => {
    dispatch(signOut());
  };

  const loadAuth = () => {
    dispatch(loadStoredAuth());
  };

  return {
    ...auth,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    loadAuth,
  };
}

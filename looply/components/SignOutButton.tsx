import { useAuth } from '@/contexts/AuthContext'
import { Text, TouchableOpacity } from 'react-native'

export const SignOutButton = () => {
  // Use Firebase Auth context
  const { logout } = useAuth()
  const handleSignOut = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }
  return (
    <TouchableOpacity onPress={handleSignOut}>
      <Text>Sign out</Text>
    </TouchableOpacity>
  )
}

import { useState } from 'react'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AuthLayout from '../layouts/AuthLayout.jsx'
import { useAuth } from '../hooks/useAuth.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login({ email, password })
      const redirectTo = location.state?.from?.pathname || '/'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Incorrect email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Log in" subtitle="Access your personal cloud storage.">
      <Stack component="form" onSubmit={handleSubmit} spacing={2.5}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          autoFocus
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
        />

        <Button type="submit" variant="contained" size="large" disabled={submitting} fullWidth>
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          Don&apos;t have an account?{' '}
          <Link component={RouterLink} to="/register">
            Create one
          </Link>
        </Typography>
      </Stack>
    </AuthLayout>
  )
}

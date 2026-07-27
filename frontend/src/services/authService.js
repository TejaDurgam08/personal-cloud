import api from './api.js'

export async function registerUser({ username, email, password }) {
  const { data } = await api.post('/register', { username, email, password })
  return data
}

export async function loginUser({ email, password }) {
  // The backend uses OAuth2PasswordRequestForm, which expects
  // application/x-www-form-urlencoded with a "username" field (we pass
  // the email into it) and a "password" field.
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)

  const { data } = await api.post('/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data // { access_token, token_type }
}

export async function fetchCurrentUser() {
  const { data } = await api.get('/me')
  return data
}

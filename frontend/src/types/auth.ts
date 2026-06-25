export interface User {
  id: string
  name: string
  email: string
  role: string
}

export interface AuthPayload {
  token: string
  user: User
}

export interface LoginInput {
  email: string
  password: string
}

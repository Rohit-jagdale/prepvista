import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user || !user.passwordHash) {
          return null
        }
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isValid) {
          return null
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email!,
          image: user.image || undefined,
        } as any
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      console.log('🔑 NextAuth JWT Callback:', {
        hasToken: !!token,
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        timestamp: new Date().toISOString()
      })
      
      if (user?.id) {
        token.id = user.id
        console.log('✅ NextAuth JWT - Added user ID to token:', user.id)
      }
      return token
    },
    async session({ session, token }: any) {
      console.log('🎫 NextAuth Session Callback:', {
        hasSession: !!session,
        hasToken: !!token,
        userId: token?.id,
        userEmail: session?.user?.email,
        timestamp: new Date().toISOString()
      })
      
      if (session.user && token?.id) {
        session.user.id = token.id
        console.log('✅ NextAuth Session - Added user ID to session:', token.id)
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
}

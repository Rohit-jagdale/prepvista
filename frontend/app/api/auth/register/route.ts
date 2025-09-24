import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const requestId = (globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2)
    const url = (request as any)?.url || 'unknown-url'
    const ip = (request as any)?.headers?.get?.('x-forwarded-for') || (request as any)?.headers?.get?.('x-real-ip') || 'unknown-ip'

    // Log minimal request metadata (avoid logging sensitive values)
    console.log('[auth/register] incoming', {
      requestId,
      url,
      ip,
      method: 'POST',
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      envFlags: {
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
        hasNextAuthUrl: Boolean(process.env.NEXTAUTH_URL),
        hasNextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET),
      },
      ts: new Date().toISOString(),
    })

    let body: any
    try {
      body = await request.json()
    } catch (jsonErr) {
      console.error('[auth/register] invalid json', { requestId, error: (jsonErr as Error)?.message })
      return NextResponse.json({ error: 'Invalid JSON body', requestId }, { status: 400 })
    }

    const { name, email, password } = body || {}

    if (!email || !password) {
      console.warn('[auth/register] validation failed', { requestId, hasEmail: Boolean(email), hasPassword: Boolean(password) })
      return NextResponse.json({ error: 'Email and password are required', requestId }, { status: 400 })
    }

    console.log('[auth/register] checking existing user', { requestId, email })
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      console.warn('[auth/register] user exists', { requestId, email })
      return NextResponse.json({ error: 'User already exists', requestId }, { status: 409 })
    }

    console.log('[auth/register] hashing password', { requestId })
    const passwordHash = await bcrypt.hash(password, 10)

    console.log('[auth/register] creating user', { requestId, email })
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
      },
      select: { id: true, email: true, name: true },
    })

    console.log('[auth/register] success', { requestId, userId: user.id, email })
    return NextResponse.json({ user, requestId }, { status: 201 })
  } catch (error) {
    // Try to extract helpful error meta without leaking secrets
    const err = error as any
    const prismaCode = err?.code
    const prismaMeta = err?.meta
    console.error('[auth/register] unhandled error', {
      message: err?.message,
      name: err?.name,
      prismaCode,
      prismaMeta,
      stack: err?.stack?.split('\n').slice(0, 5).join('\n'),
    })
    return NextResponse.json(
      { error: 'Failed to register user', requestId: undefined },
      { status: 500 }
    )
  }
}



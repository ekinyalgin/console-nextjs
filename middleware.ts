import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const ip = request.ip ?? request.headers.get('x-real-ip')
    const forwardedFor = request.headers.get('x-forwarded-for')

    const response = NextResponse.next()
    response.headers.set('x-ip', ip ?? '')
    response.headers.set('x-forwarded-for', forwardedFor ?? '')

    return response
}

export const config = {
    matcher: '/api/:path*',
}

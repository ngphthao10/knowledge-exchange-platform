import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('credentials')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ credentials: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const type = formData.get('type') as string
  const title = formData.get('title') as string

  if (!file || !type || !title) {
    return NextResponse.json({ error: 'Missing file, type, or title' }, { status: 400 })
  }

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG, WebP, and PDF allowed.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()
  const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const admin = createAdminClient()

  const { error: uploadError } = await admin.storage
    .from('credentials')
    .upload(fileName, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: `Storage: ${uploadError.message}` }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from('credentials').getPublicUrl(fileName)
  const { data: credential, error: dbError } = await admin
    .from('credentials')
    .insert({
      user_id: user.id,
      type,
      title,
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
    })
    .select()
    .single()

  if (dbError) {
    await supabase.storage.from('credentials').remove([fileName])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ credential })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()

  const admin = createAdminClient()
  const { data: cred } = await admin
    .from('credentials')
    .select('file_url, user_id')
    .eq('id', id)
    .single()

  if (!cred || cred.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Extract storage path from public URL
  const url = new URL(cred.file_url)
  const storagePath = url.pathname.split('/credentials/')[1]
  if (storagePath) {
    await admin.storage.from('credentials').remove([storagePath])
  }

  await admin.from('credentials').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}

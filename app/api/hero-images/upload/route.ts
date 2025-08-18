import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const subtitle = formData.get('subtitle') as string
    const description = formData.get('description') as string
    const displayOrder = parseInt(formData.get('display_order') as string) || 0
    const showContent = formData.get('show_content') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const fileName = `hero-${Date.now()}.${fileExt}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('hero-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('❌ Error uploading file:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('hero-images')
      .getPublicUrl(fileName)

    // Save metadata to database
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('hero_images')
      .insert([{
        file_name: fileName,
        file_url: urlData.publicUrl,
        title: title || '',
        subtitle: subtitle || '',
        description: description || '',
        display_order: displayOrder,
        show_content: showContent,
        is_active: true
      }])
      .select()
      .single()

    if (dbError) {
      console.error('❌ Error saving to database:', dbError)
      return NextResponse.json({ error: 'Failed to save metadata' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      image: dbData,
      message: 'Hero image uploaded successfully'
    })

  } catch (error) {
    console.error('❌ Error in hero image upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

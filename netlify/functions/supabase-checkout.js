const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client with better error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔧 Environment check:', {
  hasSupabaseUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  nodeEnv: process.env.NODE_ENV
})

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  throw new Error('Missing Supabase configuration')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

exports.handler = async (event, context) => {
  console.log('🚀 Function invoked with method:', event.httpMethod)
  
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('✅ Handling preflight request')
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log('❌ Method not allowed:', event.httpMethod)
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    console.log('📥 Parsing request body...')
    const body = JSON.parse(event.body)
    
    console.log('📋 Received Supabase checkout data:', {
      orderId: body.orderId,
      customerName: body.customerInfo?.fullName,
      total: body.total,
      hasReceipt: !!body.receiptFile,
      paymentOption: body.paymentOption
    })

    // Validate required fields
    if (!body.orderId || !body.customerInfo?.fullName || !body.customerInfo?.email) {
      console.error('❌ Missing required fields')
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      }
    }

    let receiptUrl = null

    // Upload receipt to Supabase Storage if provided
    if (body.receiptFile && body.receiptFileName) {
      try {
        console.log('📤 Uploading receipt to Supabase Storage...')
        
        const fileExt = body.receiptFileName.split('.').pop()?.toLowerCase()
        const fileName = `${body.orderId}_receipt.${fileExt}`
        
        // Convert base64 to buffer
        const fileBuffer = Buffer.from(body.receiptFile.split(',')[1], 'base64')
        
        // Determine content type based on file extension
        let contentType = 'image/jpeg' // default
        if (fileExt === 'png') contentType = 'image/png'
        else if (fileExt === 'jpg' || fileExt === 'jpeg') contentType = 'image/jpeg'
        else if (fileExt === 'pdf') contentType = 'application/pdf'
        else if (fileExt === 'webp') contentType = 'image/webp'
        
        console.log(`📤 Uploading file: ${fileName} with content type: ${contentType}`)
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('receipts')
          .upload(fileName, fileBuffer, {
            contentType: contentType,
            cacheControl: '3600'
          })

        if (uploadError) {
          console.error('❌ Error uploading receipt:', uploadError)
        } else {
          console.log('✅ File uploaded successfully:', fileName)
          
          // Generate public URL
          const { data: urlData } = supabaseAdmin.storage
            .from('receipts')
            .getPublicUrl(fileName)
          
          receiptUrl = urlData.publicUrl
          console.log('✅ Receipt URL generated:', receiptUrl)
        }
      } catch (uploadError) {
        console.error('❌ Error in receipt upload process:', uploadError)
      }
    }

    // Create order in database
    console.log('📝 Creating order in database...')
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_id: body.orderId,
        customer_name: body.customerInfo.fullName,
        customer_email: body.customerInfo.email,
        customer_phone: body.customerInfo.phone,
        customer_city: body.customerInfo.city,
        customer_state: body.customerInfo.state,
        customer_zip_code: body.customerInfo.zipCode,
        customer_address: body.customerInfo.fullAddress,
        total_amount: body.total,
        payment_option: body.paymentOption,
        payment_status: 'pending',
        order_status: 'processing',
        receipt_url: receiptUrl,
        receipt_file_name: body.receiptFileName || null
      })
      .select()
      .single()

    if (orderError) {
      console.error('❌ Error creating order:', orderError)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to create order: ' + orderError.message })
      }
    }

    console.log('✅ Order created successfully:', order.id)

    // Add order items
    console.log('📦 Adding order items...')
    const orderItems = body.cart.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('❌ Error adding order items:', itemsError)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to add order items: ' + itemsError.message })
      }
    }

    console.log('✅ Order items added successfully')

    console.log('🎉 Order processing completed successfully')
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        orderId: body.orderId,
        orderDbId: order.id,
        receiptUrl,
        message: 'Order submitted successfully to Supabase database'
      })
    }

  } catch (error) {
    console.error('❌ Supabase checkout API error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    }
  }
}

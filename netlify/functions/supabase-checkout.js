const { createClient } = require('@supabase/supabase-js')
const nodemailer = require('nodemailer')

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

// Email service configuration
const emailService = {
  async sendOrderEmails(orderData, orderDbId, adminEmail) {
    try {
      // Check if email credentials are available
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️ Email credentials not configured, skipping email sending')
        return {
          customerEmail: { success: false, error: 'Email not configured' },
          adminEmail: { success: false, error: 'Email not configured' }
        }
      }

      // Configure email transporter
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      })

      // Customer confirmation email
      const customerEmailResult = await this.sendCustomerEmail(transporter, orderData)
      
      // Admin notification email
      const adminEmailResult = await this.sendAdminEmail(transporter, orderData, orderDbId, adminEmail)

      return {
        customerEmail: customerEmailResult,
        adminEmail: adminEmailResult
      }
    } catch (error) {
      console.error('Email service error:', error)
      return {
        customerEmail: { success: false, error: error.message },
        adminEmail: { success: false, error: error.message }
      }
    }
  },

  async sendCustomerEmail(transporter, orderData) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: orderData.customerInfo.email,
        subject: `Order Confirmation - ${orderData.orderId}`,
        html: `
          <h2>Thank you for your order!</h2>
          <p><strong>Order ID:</strong> ${orderData.orderId}</p>
          <p><strong>Customer:</strong> ${orderData.customerInfo.fullName}</p>
          <p><strong>Total:</strong> $${orderData.total}</p>
          <p><strong>Payment Option:</strong> ${orderData.paymentOption}</p>
          <p>We will process your order and contact you soon.</p>
        `
      }

      await transporter.sendMail(mailOptions)
      return { success: true }
    } catch (error) {
      console.error('Customer email error:', error)
      return { success: false, error: error.message }
    }
  },

  async sendAdminEmail(transporter, orderData, orderDbId, adminEmail) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: adminEmail,
        subject: `New Order Received - ${orderData.orderId}`,
        html: `
          <h2>New Order Received</h2>
          <p><strong>Order ID:</strong> ${orderData.orderId}</p>
          <p><strong>Database ID:</strong> ${orderDbId}</p>
          <p><strong>Customer:</strong> ${orderData.customerInfo.fullName}</p>
          <p><strong>Email:</strong> ${orderData.customerInfo.email}</p>
          <p><strong>Phone:</strong> ${orderData.customerInfo.phone}</p>
          <p><strong>Address:</strong> ${orderData.customerInfo.fullAddress}</p>
          <p><strong>Total:</strong> $${orderData.total}</p>
          <p><strong>Payment Option:</strong> ${orderData.paymentOption}</p>
          ${orderData.receiptUrl ? `<p><strong>Receipt:</strong> <a href="${orderData.receiptUrl}">View Receipt</a></p>` : ''}
        `
      }

      await transporter.sendMail(mailOptions)
      return { success: true }
    } catch (error) {
      console.error('Admin email error:', error)
      return { success: false, error: error.message }
    }
  }
}

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

    // Send notification emails
    try {
      console.log('📧 Sending notification emails...')
      await emailService.sendOrderEmails(body, order.id, process.env.ADMIN_EMAIL)
      console.log('✅ Notification emails sent successfully')
    } catch (error) {
      console.error('❌ Error sending notification emails:', error)
      // Don't fail the order if email fails
    }

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

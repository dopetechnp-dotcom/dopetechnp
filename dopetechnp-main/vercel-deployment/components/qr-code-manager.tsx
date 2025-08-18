"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Upload, 
  Trash2, 
  Download, 
  QrCode, 
  Save, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react'
import { supabase } from "@/lib/supabase"

interface QRCodeData {
  id: string
  name: string
  image_url: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export function QRCodeManager() {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [qrCodeName, setQrCodeName] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    loadQRCodes()
  }, [])

  const loadQRCodes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading QR codes:', error)
        setError('Failed to load QR codes')
        return
      }

      setQrCodes(data || [])
    } catch (err) {
      console.error('Error loading QR codes:', err)
      setError('Failed to load QR codes')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      setSelectedFile(file)
      setError("")
    }
  }

  const uploadQRCode = async () => {
    if (!selectedFile || !qrCodeName.trim()) {
      setError('Please select a file and enter a name')
      return
    }

    try {
      setUploading(true)
      setError("")

      // Upload image to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('qr-codes')
        .upload(fileName, selectedFile)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        setError('Failed to upload image')
        return
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('qr-codes')
        .getPublicUrl(fileName)

      // Save to database
      const { error: dbError } = await supabase
        .from('qr_codes')
        .insert({
          name: qrCodeName.trim(),
          image_url: urlData.publicUrl,
          is_active: qrCodes.length === 0 // First QR code is active by default
        })

      if (dbError) {
        console.error('Database error:', dbError)
        setError('Failed to save QR code')
        return
      }

      setSuccess('QR code uploaded successfully!')
      setSelectedFile(null)
      setQrCodeName("")
      loadQRCodes()
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload QR code')
    } finally {
      setUploading(false)
    }
  }

  const deleteQRCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this QR code?')) return

    try {
      const { error } = await supabase
        .from('qr_codes')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Delete error:', error)
        setError('Failed to delete QR code')
        return
      }

      setSuccess('QR code deleted successfully!')
      loadQRCodes()
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete QR code')
    }
  }

  const toggleActive = async (id: string) => {
    try {
      // First, deactivate all QR codes
      await supabase
        .from('qr_codes')
        .update({ is_active: false })

      // Then activate the selected one
      const { error } = await supabase
        .from('qr_codes')
        .update({ is_active: true })
        .eq('id', id)

      if (error) {
        console.error('Toggle error:', error)
        setError('Failed to update QR code status')
        return
      }

      setSuccess('QR code status updated!')
      loadQRCodes()
    } catch (err) {
      console.error('Toggle error:', err)
      setError('Failed to update QR code status')
    }
  }

  const downloadQRCode = (imageUrl: string, name: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `${name}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="card-admin p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Upload New QR Code
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              QR Code Name
            </label>
            <input
              type="text"
              value={qrCodeName}
              onChange={(e) => setQrCodeName(e.target.value)}
              placeholder="e.g., Payment QR Code"
              className="input-admin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              QR Code Image
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="qr-upload"
              />
              <label htmlFor="qr-upload" className="cursor-pointer">
                <div className="text-primary mb-2">
                  <Upload className="w-8 h-8 mx-auto" />
                </div>
                <p className="text-gray-900 dark:text-white font-medium">
                  {selectedFile ? selectedFile.name : 'Click to upload QR code image'}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  PNG, JPG up to 5MB
                </p>
              </label>
            </div>
          </div>

          {selectedFile && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-300" />
              <p className="text-green-300 text-sm">✓ {selectedFile.name} selected</p>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={uploadQRCode}
            disabled={uploading || !selectedFile || !qrCodeName.trim()}
            className="btn-primary w-full"
          >
            {uploading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Upload QR Code
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-300" />
          <p className="text-red-300 text-sm">{error}</p>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4 text-green-300" />
          <p className="text-green-300 text-sm">{success}</p>
        </motion.div>
      )}

      {/* QR Codes List */}
      <div className="card-admin p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Codes ({qrCodes.length})
          </h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadQRCodes}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="loading-skeleton h-20 rounded-lg"></div>
            ))}
          </div>
        ) : qrCodes.length === 0 ? (
          <div className="text-center py-8">
            <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No QR codes uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {qrCodes.map((qrCode) => (
              <motion.div
                key={qrCode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {qrCode.name}
                      {qrCode.is_active && (
                        <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                          Active
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Uploaded {new Date(qrCode.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!qrCode.is_active && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleActive(qrCode.id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-500"
                      title="Set as active"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </motion.button>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => downloadQRCode(qrCode.image_url, qrCode.name)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => deleteQRCode(qrCode.id)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

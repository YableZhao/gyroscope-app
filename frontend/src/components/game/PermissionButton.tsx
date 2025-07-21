"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Smartphone, ShieldCheck, ShieldX, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PermissionState } from '@/types'

interface PermissionButtonProps {
  permission: PermissionState
  isLoading: boolean
  onRequestPermission: () => void
  className?: string
}

export function PermissionButton({ 
  permission, 
  isLoading, 
  onRequestPermission,
  className = ''
}: PermissionButtonProps) {
  const getButtonConfig = () => {
    switch (permission) {
      case 'granted':
        return {
          text: 'Device Motion Enabled',
          icon: <ShieldCheck className="w-4 h-4" />,
          variant: 'default' as const,
          bgColor: 'bg-green-600 hover:bg-green-700',
          description: 'Your device motion is being tracked'
        }
      case 'denied':
        return {
          text: 'Permission Denied',
          icon: <ShieldX className="w-4 h-4" />,
          variant: 'destructive' as const,
          bgColor: 'bg-red-600 hover:bg-red-700',
          description: 'Device motion access was denied'
        }
      default:
        return {
          text: 'Enable Device Motion',
          icon: <Smartphone className="w-4 h-4" />,
          variant: 'outline' as const,
          bgColor: 'bg-blue-600 hover:bg-blue-700',
          description: 'Grant permission to access device orientation'
        }
    }
  }

  const config = getButtonConfig()

  return (
    <motion.div 
      className={`flex flex-col items-center space-y-2 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Button
        onClick={onRequestPermission}
        disabled={isLoading}
        variant={config.variant}
        size="lg"
        className={`min-w-[200px] ${permission === 'granted' ? config.bgColor : ''}`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <span className="mr-2">{config.icon}</span>
        )}
        {isLoading ? 'Requesting...' : config.text}
      </Button>
      
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        {config.description}
      </p>
      
      {permission === 'denied' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2 max-w-xs text-center"
        >
          Please enable device motion in your browser settings and refresh the page
        </motion.div>
      )}
      
      {permission === 'default' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded p-2 max-w-xs text-center"
        >
          This game uses your device&apos;s motion sensors for interactive gameplay
        </motion.div>
      )}
    </motion.div>
  )
}
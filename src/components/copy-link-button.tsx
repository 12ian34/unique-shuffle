'use client'

import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { ToastButton } from '@/components/ui/toast-button'

export function CopyLinkButton({ url }: { url: string }) {
  const { toast } = useToast()

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url).then(
      () => {
        toast({
          title: 'Copied to clipboard',
          description: 'Share URL has been copied to your clipboard',
          duration: 2000,
          variant: 'info',
        })
      },
      (err) => {
        console.error('Could not copy text: ', err)
        toast({
          title: 'Failed to copy',
          description: (
            <div className='flex flex-col gap-2'>
              <p>Please try again or copy the URL manually</p>
              <ToastButton
                href='#'
                variant='destructive'
                onClick={(e) => {
                  e.preventDefault()
                  copyToClipboard()
                }}
              >
                Try Again
              </ToastButton>
            </div>
          ),
          variant: 'destructive',
        })
      }
    )
  }

  return (
    <Button variant='outline' size='sm' onClick={copyToClipboard} className='ml-2'>
      <Copy className='h-4 w-4 mr-1' />
      Copy Link
    </Button>
  )
}

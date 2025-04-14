'use client'

import { Button } from '@/components/ui/button'
import { ToastButton } from '@/components/ui/toast-button'
import { toast } from '@/components/ui/use-toast'

export function ToastExamples() {
  const showDefaultToast = () => {
    toast({
      title: 'Default Toast',
      description: 'This is the default toast with gradient styling',
    })
  }

  const showDefaultWithButton = () => {
    toast({
      title: 'Default with Button',
      description: (
        <div className='flex flex-col gap-2'>
          <p>This toast includes a stylish button</p>
          <ToastButton href='/example'>Action Button</ToastButton>
        </div>
      ),
    })
  }

  const showDestructiveToast = () => {
    toast({
      title: 'Error Toast',
      description: 'Something went wrong with your request',
      variant: 'destructive',
    })
  }

  const showDestructiveWithButton = () => {
    toast({
      title: 'Error with Button',
      description: (
        <div className='flex flex-col gap-2'>
          <p>There was an error with your request</p>
          <ToastButton href='/help' variant='destructive'>
            Get Help
          </ToastButton>
        </div>
      ),
      variant: 'destructive',
    })
  }

  const showSuccessToast = () => {
    toast({
      title: 'Success Toast',
      description: 'Your changes have been saved successfully',
      variant: 'success',
    })
  }

  const showSuccessWithButton = () => {
    toast({
      title: 'Success with Button',
      description: (
        <div className='flex flex-col gap-2'>
          <p>Your changes have been saved successfully</p>
          <ToastButton href='/view' variant='success'>
            View Changes
          </ToastButton>
        </div>
      ),
      variant: 'success',
    })
  }

  const showWarningToast = () => {
    toast({
      title: 'Warning Toast',
      description: 'Your session will expire in 5 minutes',
      variant: 'warning',
    })
  }

  const showWarningWithButton = () => {
    toast({
      title: 'Warning with Button',
      description: (
        <div className='flex flex-col gap-2'>
          <p>Your session will expire in 5 minutes</p>
          <ToastButton href='/extend' variant='warning'>
            Extend Session
          </ToastButton>
        </div>
      ),
      variant: 'warning',
    })
  }

  const showInfoToast = () => {
    toast({
      title: 'Info Toast',
      description: 'You have new notifications to review',
      variant: 'info',
    })
  }

  const showInfoWithButton = () => {
    toast({
      title: 'Info with Button',
      description: (
        <div className='flex flex-col gap-2'>
          <p>You have new notifications to review</p>
          <ToastButton href='/notifications' variant='info'>
            View Notifications
          </ToastButton>
        </div>
      ),
      variant: 'info',
    })
  }

  const showAuthToast = () => {
    toast({
      title: 'Sign in Required',
      description: (
        <div className='flex flex-col gap-2'>
          <p>Sign in to save your progress and unlock achievements!</p>
          <ToastButton href='/auth?tab=signup'>Create an account</ToastButton>
        </div>
      ),
      duration: 5000,
    })
  }

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <h3 className='text-lg font-medium'>Default Toasts</h3>
          <div className='flex flex-col gap-2'>
            <Button onClick={showDefaultToast} variant='outline'>
              Show Default Toast
            </Button>
            <Button onClick={showDefaultWithButton} variant='outline'>
              Default with Button
            </Button>
          </div>
        </div>

        <div className='space-y-2'>
          <h3 className='text-lg font-medium'>Destructive Toasts</h3>
          <div className='flex flex-col gap-2'>
            <Button onClick={showDestructiveToast} variant='outline'>
              Show Error Toast
            </Button>
            <Button onClick={showDestructiveWithButton} variant='outline'>
              Error with Button
            </Button>
          </div>
        </div>

        <div className='space-y-2'>
          <h3 className='text-lg font-medium'>Success Toasts</h3>
          <div className='flex flex-col gap-2'>
            <Button onClick={showSuccessToast} variant='outline'>
              Show Success Toast
            </Button>
            <Button onClick={showSuccessWithButton} variant='outline'>
              Success with Button
            </Button>
          </div>
        </div>

        <div className='space-y-2'>
          <h3 className='text-lg font-medium'>Warning Toasts</h3>
          <div className='flex flex-col gap-2'>
            <Button onClick={showWarningToast} variant='outline'>
              Show Warning Toast
            </Button>
            <Button onClick={showWarningWithButton} variant='outline'>
              Warning with Button
            </Button>
          </div>
        </div>

        <div className='space-y-2'>
          <h3 className='text-lg font-medium'>Info Toasts</h3>
          <div className='flex flex-col gap-2'>
            <Button onClick={showInfoToast} variant='outline'>
              Show Info Toast
            </Button>
            <Button onClick={showInfoWithButton} variant='outline'>
              Info with Button
            </Button>
          </div>
        </div>

        <div className='space-y-2'>
          <h3 className='text-lg font-medium'>Auth Toast</h3>
          <div className='flex flex-col gap-2'>
            <Button onClick={showAuthToast} variant='outline'>
              Show Auth Toast
            </Button>
          </div>
        </div>
      </div>

      <div className='mt-8 p-4 bg-muted rounded-lg'>
        <h3 className='text-lg font-medium mb-2'>Usage Examples</h3>
        <pre className='text-xs overflow-auto p-2 bg-background/60 rounded-md'>
          {`// Basic toast
toast({
  title: 'Toast Title',
  description: 'Toast description text',
  variant: 'default' // or 'success', 'destructive', 'warning', 'info'
})

// Toast with button
toast({
  title: 'Toast with Button',
  description: (
    <div className='flex flex-col gap-2'>
      <p>Toast description text</p>
      <ToastButton href='/path' variant='success'>
        Button Text
      </ToastButton>
    </div>
  ),
  variant: 'success'
})`}
        </pre>
      </div>
    </div>
  )
}

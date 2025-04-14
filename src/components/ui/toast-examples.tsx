'use client'

import { Button } from '@/components/ui/button'
import { ToastButton } from '@/components/ui/toast-button'
import { toast } from '@/components/ui/use-toast'

export function ToastExamples() {
  const showDefaultToast = () => {
    toast({
      title: 'default toast',
      description: 'this is the default toast with gradient styling',
    })
  }

  const showDefaultWithButton = () => {
    toast({
      title: 'default with button',
      description: (
        <div className='flex flex-col gap-2'>
          <p>this toast includes a stylish button</p>
          <ToastButton href='/example'>action button</ToastButton>
        </div>
      ),
    })
  }

  const showDestructiveToast = () => {
    toast({
      title: 'error toast',
      description: 'something went wrong with your request',
      variant: 'destructive',
    })
  }

  const showDestructiveWithButton = () => {
    toast({
      title: 'error with button',
      description: (
        <div className='flex flex-col gap-2'>
          <p>there was an error with your request</p>
          <ToastButton href='/help' variant='destructive'>
            get help
          </ToastButton>
        </div>
      ),
      variant: 'destructive',
    })
  }

  const showSuccessToast = () => {
    toast({
      title: 'success toast',
      description: 'your changes have been saved successfully',
      variant: 'success',
    })
  }

  const showSuccessWithButton = () => {
    toast({
      title: 'success with button',
      description: (
        <div className='flex flex-col gap-2'>
          <p>your changes have been saved successfully</p>
          <ToastButton href='/view' variant='success'>
            view changes
          </ToastButton>
        </div>
      ),
      variant: 'success',
    })
  }

  const showWarningToast = () => {
    toast({
      title: 'warning toast',
      description: 'your session will expire in 5 minutes',
      variant: 'warning',
    })
  }

  const showWarningWithButton = () => {
    toast({
      title: 'warning with button',
      description: (
        <div className='flex flex-col gap-2'>
          <p>your session will expire in 5 minutes</p>
          <ToastButton href='/extend' variant='warning'>
            extend session
          </ToastButton>
        </div>
      ),
      variant: 'warning',
    })
  }

  const showInfoToast = () => {
    toast({
      title: 'info toast',
      description: 'you have new notifications to review',
      variant: 'info',
    })
  }

  const showInfoWithButton = () => {
    toast({
      title: 'info with button',
      description: (
        <div className='flex flex-col gap-2'>
          <p>you have new notifications to review</p>
          <ToastButton href='/notifications' variant='info'>
            view notifications
          </ToastButton>
        </div>
      ),
      variant: 'info',
    })
  }

  const showAuthToast = () => {
    toast({
      title: 'sign in required',
      description: (
        <div className='flex flex-col gap-2'>
          <p>sign in to save your progress and unlock achievements!</p>
          <ToastButton href='/auth?tab=signup'>create an account</ToastButton>
        </div>
      ),
      duration: 5000,
    })
  }

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <h3 className='text-lg font-medium'>default toasts</h3>
          <div className='flex flex-col gap-2'>
            <Button onClick={showDefaultToast} variant='outline'>
              show default toast
            </Button>
            <Button onClick={showDefaultWithButton} variant='outline'>
              default with button
            </Button>
          </div>
        </div>

        <div className='space-y-2'>
          <h3 className='text-lg font-medium'>destructive toasts</h3>
          <div className='flex flex-col gap-2'>
            <Button onClick={showDestructiveToast} variant='outline'>
              show error toast
            </Button>
            <Button onClick={showDestructiveWithButton} variant='outline'>
              error with button
            </Button>
          </div>
        </div>

        <div className='space-y-2'>
          <h3 className='text-lg font-medium'>success toasts</h3>
          <div className='flex flex-col gap-2'>
            <Button onClick={showSuccessToast} variant='outline'>
              show success toast
            </Button>
            <Button onClick={showSuccessWithButton} variant='outline'>
              success with button
            </Button>
          </div>
        </div>

        <div className='space-y-2'>
          <h3 className='text-lg font-medium'>warning toasts</h3>
          <div className='flex flex-col gap-2'>
            <Button onClick={showWarningToast} variant='outline'>
              show warning toast
            </Button>
            <Button onClick={showWarningWithButton} variant='outline'>
              warning with button
            </Button>
          </div>
        </div>

        <div className='space-y-2'>
          <h3 className='text-lg font-medium'>info toasts</h3>
          <div className='flex flex-col gap-2'>
            <Button onClick={showInfoToast} variant='outline'>
              show info toast
            </Button>
            <Button onClick={showInfoWithButton} variant='outline'>
              info with button
            </Button>
          </div>
        </div>

        <div className='space-y-2'>
          <h3 className='text-lg font-medium'>auth toast</h3>
          <div className='flex flex-col gap-2'>
            <Button onClick={showAuthToast} variant='outline'>
              show auth toast
            </Button>
          </div>
        </div>
      </div>

      <div className='mt-8 p-4 bg-muted rounded-lg'>
        <h3 className='text-lg font-medium mb-2'>usage examples</h3>
        <pre className='text-xs overflow-auto p-2 bg-background/60 rounded-md'>
          {`// Basic toast
toast({
  title: 'toast title',
  description: 'toast description text',
  variant: 'default' // or 'success', 'destructive', 'warning', 'info'
})

// Toast with button
toast({
  title: 'toast with button',
  description: (
    <div className='flex flex-col gap-2'>
      <p>toast description text</p>
      <ToastButton href='/path' variant='success'>
        button text
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

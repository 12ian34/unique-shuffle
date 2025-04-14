import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AboutPage() {
  return (
    <div className='space-y-8'>
      <div className='text-center max-w-2xl mx-auto'>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>About Unique Shuffle</h1>
        <p className='mt-4 text-muted-foreground'>
          Learn more about our card shuffling application
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What is Unique Shuffle?</CardTitle>
          <CardDescription>The story behind our application</CardDescription>
        </CardHeader>
        <CardContent className='prose prose-sm max-w-none break-all'>
          <p>
            Unique Shuffle is a web application that allows users to shuffle playing cards, save
            their shuffles, and earn achievements based on patterns and usage.
          </p>

          <p>
            Did you know that a standard deck of 52 playing cards can be arranged in approximately
            80,658,175,170,943,878,571,660,636,856,403,766,975,289,505,440,883,277,824,000,000,000,000
            different ways? This number is so large that any random shuffle you create is almost
            certainly unique in human history.
          </p>

          <p>
            Our application provides a simple, engaging way for users to interact with card
            shuffling and discover interesting patterns. Whether you&apos;re fascinated by
            probabilities, collecting achievements, or just enjoy the satisfaction of a good
            shuffle, Unique Shuffle has something for you.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>What you can do with Unique Shuffle</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className='space-y-2 list-disc pl-5'>
            <li>Create random shuffles of a standard deck of 52 playing cards</li>
            <li>View pattern analysis for each shuffle</li>
            <li>Save favorite shuffles to your account</li>
            <li>Earn achievements for specific shuffle patterns</li>
            <li>Share your shuffles with friends via a unique URL</li>
            <li>View your statistics and track your progress</li>
            <li>Compare your stats with others on the leaderboard</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Technical Information</CardTitle>
          <CardDescription>How Unique Shuffle works</CardDescription>
        </CardHeader>
        <CardContent>
          <p className='mb-4'>
            Unique Shuffle is built with modern web technologies to provide a fast, responsive, and
            engaging user experience:
          </p>

          <ul className='space-y-2 list-disc pl-5'>
            <li>Next.js for the frontend and API routes</li>
            <li>React for UI components</li>
            <li>Tailwind CSS for styling</li>
            <li>Supabase for authentication and database</li>
            <li>TypeScript for type safety</li>
          </ul>

          <div className='mt-6 pt-6 border-t'>
            <p className='text-sm text-muted-foreground'>
              View the project on{' '}
              <a
                href='https://github.com/12ian34/unique-shuffle'
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary hover:underline'
              >
                GitHub
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

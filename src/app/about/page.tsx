import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AboutPage() {
  return (
    <div className='space-y-8'>
      <Card>
        <CardHeader>
          <CardTitle>what?</CardTitle>
        </CardHeader>
        <CardContent className='prose prose-sm max-w-none break-all'>
          <p>
            a standard 52 card deck can be arranged in exactly
            80,658,175,170,943,878,571,660,636,856,403,766,975,289,505,440,883,277,824,000,000,000,000
            different ways. this number is so large that any random shuffle you create is almost
            certainly unique in the history of the universe
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className='space-y-2 list-disc pl-5'>
            <li>create random shuffles of a standard deck of 52 playing cards</li>
            <li>pattern analysis for each shuffle</li>
            <li>save shuffles</li>
            <li>share shuffles</li>
            <li>earn achievements</li>
            <li>track progress</li>
            <li>global leaderboard</li>
            <li>friends</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>devs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>
            see the source code on{' '}
            <a
              href='https://github.com/12ian34/unique-shuffle'
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary hover:underline'
            >
              GitHub
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

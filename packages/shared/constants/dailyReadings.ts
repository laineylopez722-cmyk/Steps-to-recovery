/**
 * Daily Readings (JFT-style)
 * 30-60 sample readings for the daily reading feature
 * Date format: MM-DD
 */

import type { DailyReading } from '../types';

export const DAILY_READINGS: Record<string, DailyReading> = {
  // January
  '01-01': {
    id: '01-01',
    date: '01-01',
    title: 'A New Beginning',
    content: `Today marks a fresh start. In recovery, we learn that each day is an opportunity to begin again. The past doesn't define us—our actions today do.

We've been given the gift of a new day, free from the bondage of active addiction. This is not something to take for granted. Many of us never thought we'd see this day, yet here we are.

As we step into this new day, we carry with us the lessons of yesterday but leave behind its burdens. We focus on what we can do today to strengthen our recovery and help others on their journey.`,
    reflectionPrompt:
      'What does a fresh start mean to you today? How can you make the most of this new beginning?',
    source: 'jft',
  },
  '01-02': {
    id: '01-02',
    date: '01-02',
    title: 'One Day at a Time',
    content: `The slogan "one day at a time" is more than just words—it's a way of life. When we were using, we couldn't imagine getting through a single day without our drug of choice. Now we know that all we have to do is stay clean for today.

Tomorrow will take care of itself. Yesterday is gone. All we have is this present moment, this one day. By breaking our recovery down into manageable pieces, we find that the impossible becomes possible.

When life feels overwhelming, we return to this simple truth: just for today, we can do what would be impossible for a lifetime.`,
    reflectionPrompt:
      'How does focusing on just today help you in your recovery? What challenges become easier when you think one day at a time?',
    source: 'jft',
  },
  '01-03': {
    id: '01-03',
    date: '01-03',
    title: 'Surrender',
    content: `Surrender is not defeat—it's victory. For so long, we fought against the truth of our addiction. We tried to control our using, bargained with ourselves, and made countless promises we couldn't keep.

True surrender came when we finally admitted we were powerless over our addiction. This admission wasn't weakness; it was the first act of strength in our recovery. By letting go of the illusion of control, we opened ourselves to a new way of living.

Today, we continue to practice surrender. We let go of outcomes, trust in a power greater than ourselves, and accept life on life's terms.`,
    reflectionPrompt:
      "What does surrender mean to you? Is there something you're still trying to control that you need to let go of?",
    source: 'jft',
  },
  '01-04': {
    id: '01-04',
    date: '01-04',
    title: 'The Gift of Desperation',
    content: `Many of us came to recovery out of sheer desperation. We had tried everything else and failed. Our addiction had stripped us of everything we valued—relationships, jobs, self-respect, hope.

But desperation can be a gift. It was the pain of our bottom that made us willing to try something different. Without that desperation, we might never have become open to recovery.

Today, we can be grateful for the desperation that brought us here. It was the doorway to a new life. Though we wouldn't wish our pain on anyone, we recognize that it served a purpose in leading us to recovery.`,
    reflectionPrompt:
      'How did your desperation lead you to recovery? Can you see the gift in your pain today?',
    source: 'jft',
  },
  '01-05': {
    id: '01-05',
    date: '01-05',
    title: 'Willingness',
    content: `Willingness is the key that unlocks the door to recovery. We don't have to be perfect, we don't have to have all the answers—we just have to be willing.

Willing to try a new way. Willing to ask for help. Willing to believe that recovery is possible. Willing to take suggestions from those who have walked this path before us.

Our willingness doesn't have to be complete. Even a small amount of willingness, what some call "the willingness to be willing," is enough to begin. As we take action, our willingness grows.`,
    reflectionPrompt:
      'In what areas of your recovery do you need more willingness? What small step can you take today?',
    source: 'jft',
  },
  '01-06': {
    id: '01-06',
    date: '01-06',
    title: 'Honesty',
    content: `Our disease thrives in dishonesty. We lied to others, but most damaging were the lies we told ourselves. We convinced ourselves we didn't have a problem, that we could stop anytime, that things weren't that bad.

Recovery demands rigorous honesty. We must be honest about our addiction, honest in our inventory, honest with our sponsor, and honest in our daily lives. Honesty is the foundation upon which we build our new life.

Today, we practice honesty in all our affairs. We've learned that even small lies can lead us back to the big lie—that we can use successfully.`,
    reflectionPrompt:
      "Where in your life do you need to practice more honesty? Is there something you've been avoiding facing truthfully?",
    source: 'jft',
  },
  '01-07': {
    id: '01-07',
    date: '01-07',
    title: 'Finding a Sponsor',
    content: `A sponsor is someone who has walked the path of recovery before us and is willing to guide us along the way. They share their experience, strength, and hope. They help us work the steps and navigate the challenges of living clean.

Finding a sponsor can feel intimidating, but it's one of the most important actions we can take in early recovery. We look for someone who has what we want—not material things, but serenity, peace, and a solid program.

We don't need to find the perfect sponsor. We just need someone who is willing to help us and who takes their own recovery seriously.`,
    reflectionPrompt:
      "Do you have a sponsor? If not, what's holding you back from finding one? If you do, how has that relationship helped your recovery?",
    source: 'jft',
  },

  // February
  '02-01': {
    id: '02-01',
    date: '02-01',
    title: 'Gratitude',
    content: `Gratitude transforms our perspective. In active addiction, we focused on what we lacked, what wasn't fair, what others had that we didn't. This thinking fueled our resentments and justified our using.

In recovery, we learn to focus on what we have rather than what we don't. Even on difficult days, we can find something to be grateful for—our sobriety, a roof over our heads, another chance at life.

Practicing gratitude doesn't mean ignoring our problems. It means recognizing that even in the midst of challenges, there is good in our lives. Gratitude opens the door to hope.`,
    reflectionPrompt:
      "List three things you're grateful for today. How does focusing on gratitude change your outlook?",
    source: 'jft',
  },
  '02-02': {
    id: '02-02',
    date: '02-02',
    title: 'The Power of Meetings',
    content: `Meetings are where we find our people—others who understand the disease of addiction because they live with it too. In meetings, we don't have to explain or justify ourselves. We belong.

Regular meeting attendance keeps us connected to recovery. It reminds us where we came from, keeps us humble, and shows us where we can go. Even when we don't feel like going, especially when we don't feel like going, meetings are important.

We get out of meetings what we put into them. When we show up, listen, share honestly, and connect with others, meetings become a lifeline for our recovery.`,
    reflectionPrompt:
      'How have meetings helped your recovery? Is there a meeting you could add to your routine?',
    source: 'jft',
  },
  '02-03': {
    id: '02-03',
    date: '02-03',
    title: 'Service',
    content: `Service keeps us connected and gives our lives purpose. When we were using, we were consumed with self—self-centered, self-destructive, self-obsessed. Service allows us to get out of ourselves.

Service doesn't have to be complicated. It can be as simple as setting up chairs, making coffee, greeting newcomers, or being available when someone needs to talk. What matters is that we're giving back.

As we serve others, we receive far more than we give. Service reminds us that we're part of something bigger than ourselves and that our recovery matters to others.`,
    reflectionPrompt:
      'How are you being of service in your recovery? What new way could you serve your fellowship?',
    source: 'jft',
  },
  '02-14': {
    id: '02-14',
    date: '02-14',
    title: 'Learning to Love',
    content: `Our addiction damaged our ability to love and be loved. We hurt those closest to us, pushed people away, and isolated in our disease. Trust was broken, sometimes beyond repair.

Recovery gives us the chance to learn what healthy love looks like. It starts with self-love—treating ourselves with kindness and compassion instead of self-destruction. As we grow in self-love, we become capable of loving others in healthier ways.

Rebuilding relationships takes time. Some relationships may never be restored. But we can learn from the past and build new, healthier connections based on honesty, trust, and mutual respect.`,
    reflectionPrompt:
      'How has your ability to give and receive love changed in recovery? What does healthy love look like to you?',
    source: 'jft',
  },

  // March
  '03-01': {
    id: '03-01',
    date: '03-01',
    title: 'Progress, Not Perfection',
    content: `Perfectionism is a trap. In our addiction, we may have used our impossibly high standards as an excuse—if we couldn't do something perfectly, why bother? This all-or-nothing thinking kept us stuck.

Recovery teaches us that progress is what matters. We won't do everything right. We'll make mistakes, have setbacks, and fall short of our ideals. That's okay. What matters is that we keep moving forward.

Every small step in the right direction is a victory. Every day clean is an achievement. We measure ourselves by how far we've come, not by some impossible standard of perfection.`,
    reflectionPrompt:
      'Where in your life are you being too hard on yourself? How can you celebrate your progress today?',
    source: 'jft',
  },
  '03-02': {
    id: '03-02',
    date: '03-02',
    title: 'Acceptance',
    content: `Acceptance is the answer to many of our problems. When we fight against reality, we suffer. When we accept things as they are, we find peace.

Acceptance doesn't mean we like everything or that we stop working for change. It means we acknowledge what is, rather than wishing things were different. From this place of acceptance, we can take appropriate action.

Today, we practice accepting life on life's terms. We accept that we're addicts, that recovery takes work, and that we cannot control everything. In acceptance, we find freedom.`,
    reflectionPrompt:
      'What situation in your life are you resisting accepting? How might acceptance bring you peace?',
    source: 'jft',
  },
  '03-15': {
    id: '03-15',
    date: '03-15',
    title: 'Dealing with Cravings',
    content: `Cravings are a normal part of recovery, especially in early days. When a craving hits, it can feel overwhelming, like we'll never be able to resist. But cravings pass.

We've learned strategies for dealing with cravings: calling our sponsor or another recovering addict, going to a meeting, playing the tape forward, remembering our last days of using. The key is to take action rather than sitting alone with the craving.

Every craving we survive without using makes us stronger. Each time we get through a craving, we prove to ourselves that we can do this. The cravings will lessen over time.`,
    reflectionPrompt:
      "What strategies help you when you experience cravings? Who can you call when you're struggling?",
    source: 'jft',
  },

  // April
  '04-01': {
    id: '04-01',
    date: '04-01',
    title: 'Letting Go of the Past',
    content: `Our past haunts many of us. The things we did in our addiction, the people we hurt, the opportunities we lost—these memories can weigh heavy on our hearts. Guilt and shame threaten to overwhelm us.

But recovery offers us freedom from the past. Through the steps, we face what we've done, make amends where possible, and learn to forgive ourselves. We cannot change the past, but we can change how it affects us today.

Letting go doesn't mean forgetting. It means the past no longer controls us. We carry the lessons forward without carrying the pain.`,
    reflectionPrompt:
      'What from your past do you need to let go of? How can working the steps help you find freedom?',
    source: 'jft',
  },
  '04-15': {
    id: '04-15',
    date: '04-15',
    title: 'Finding a Higher Power',
    content: `Many of us struggled with the concept of a Higher Power. Some had negative experiences with religion. Others simply didn't believe. But recovery doesn't require us to adopt anyone else's beliefs.

A Higher Power can be anything greater than ourselves—the group, nature, the universe, love, the principles of the program. What matters is that we recognize we're not the center of the universe and that we need help.

Finding a Higher Power is a personal journey. We're free to explore what works for us. Many of us find that our understanding deepens over time as we practice the principles of recovery.`,
    reflectionPrompt:
      'What is your understanding of a Higher Power today? How has it evolved since you began recovery?',
    source: 'jft',
  },

  // May
  '05-01': {
    id: '05-01',
    date: '05-01',
    title: 'The Importance of Self-Care',
    content: `In our addiction, we neglected ourselves terribly. We didn't eat properly, sleep enough, or take care of our physical and mental health. Recovery asks us to change this.

Self-care is not selfish—it's necessary. We can't give what we don't have. When we take care of ourselves, we're better able to work our program and help others. HALT reminds us to check if we're Hungry, Angry, Lonely, or Tired.

Today, we commit to treating ourselves with the same care we would give to someone we love. We eat nourishing food, get enough rest, exercise, and tend to our emotional needs.`,
    reflectionPrompt:
      'How are you taking care of yourself today? What area of self-care needs more attention?',
    source: 'jft',
  },
  '05-15': {
    id: '05-15',
    date: '05-15',
    title: 'Building a Support Network',
    content: `Recovery is not a solo journey. We need others—sponsors, fellow recovering addicts, supportive friends and family. Isolation is dangerous for us. In isolation, our disease grows stronger.

Building a support network takes effort. We exchange phone numbers at meetings and actually use them. We spend time with others in recovery. We let people get to know us and allow ourselves to be vulnerable.

Our support network is our safety net. When life gets hard, when cravings hit, when we're struggling, we don't have to face it alone. We have people who understand and who want to help.`,
    reflectionPrompt:
      'Who is in your support network? How can you strengthen these connections today?',
    source: 'jft',
  },

  // June
  '06-01': {
    id: '06-01',
    date: '06-01',
    title: 'Living in the Present',
    content: `Our minds tend to drift to the past or race toward the future. We replay old regrets or worry about what might happen. Meanwhile, we miss the only moment we actually have—now.

Recovery teaches us to live in the present. When we're fully present, we can respond to life as it happens rather than reacting to fears and memories. We find that the present moment is usually manageable.

Today, we practice presence. We notice when our minds wander and gently bring them back. We engage fully with whatever we're doing. We find peace in the now.`,
    reflectionPrompt:
      'Where does your mind tend to wander? How can you practice being more present today?',
    source: 'jft',
  },
  '06-15': {
    id: '06-15',
    date: '06-15',
    title: 'Handling Difficult Emotions',
    content: `In active addiction, we used drugs to escape our feelings. Now, in recovery, we have to learn to feel them without reaching for substances. This can be uncomfortable, even overwhelming at times.

We're learning that feelings aren't facts, and they won't kill us. Sadness passes. Anger fades. Even intense emotions are temporary. Our job is to feel them, express them appropriately, and let them go.

We have tools now for handling difficult emotions: talking to someone, writing, meetings, prayer or meditation, physical activity. We don't have to numb out anymore. We can feel and still be okay.`,
    reflectionPrompt:
      'What difficult emotion are you experiencing today? How can you process it in a healthy way?',
    source: 'jft',
  },

  // July
  '07-01': {
    id: '07-01',
    date: '07-01',
    title: 'Freedom from Addiction',
    content: `Freedom—real freedom—was something we lost long ago. We thought we were choosing to use, but our addiction had taken away our power of choice. We were slaves to our disease.

Recovery has given us our freedom back. Today, we can choose how to live. We can choose to go to meetings, work our program, and stay clean. We have options we never had before.

This freedom is precious and worth protecting. We guard it by continuing to work our program, staying connected to our support network, and never forgetting what it was like before recovery.`,
    reflectionPrompt:
      'What does freedom mean to you in recovery? How are you protecting your freedom today?',
    source: 'jft',
  },
  '07-04': {
    id: '07-04',
    date: '07-04',
    title: 'Independence and Interdependence',
    content: `In our addiction, we often had a warped sense of independence—believing we didn't need anyone, pushing people away, trying to do everything alone. Or we were completely dependent on others, unable to function without someone to lean on.

Recovery teaches us healthy interdependence. We're independent enough to take responsibility for our own recovery, yet we recognize we need others. We give and receive support. We maintain our identity while being part of a community.

True strength isn't doing everything alone. It's knowing when to ask for help and being willing to help others in return.`,
    reflectionPrompt:
      'Do you tend toward too much independence or too much dependence? How can you practice healthy interdependence?',
    source: 'jft',
  },

  // August
  '08-01': {
    id: '08-01',
    date: '08-01',
    title: 'Staying Humble',
    content: `Humility is essential to our recovery. It was our pride and ego that convinced us we could control our using, that we were different, that we didn't need help. Humility opens us to learning and growth.

Staying humble doesn't mean thinking poorly of ourselves. It means having an accurate view of who we are—acknowledging both our strengths and our limitations. It means remaining teachable.

When we've been clean for a while, we may be tempted to think we have it figured out. But our disease is patient. Staying humble keeps us vigilant and willing to continue working our program.`,
    reflectionPrompt:
      'In what ways do you practice humility in your recovery? Where might pride be creeping in?',
    source: 'jft',
  },
  '08-15': {
    id: '08-15',
    date: '08-15',
    title: 'Rebuilding Trust',
    content: `Our addiction destroyed trust—trust others had in us, and trust we had in ourselves. Rebuilding that trust is a long process, one that happens slowly, through consistent action over time.

We cannot demand that others trust us. We can only show them, day after day, that we're different now. We keep our commitments. We tell the truth. We show up. Over time, trust can be rebuilt.

Most importantly, we learn to trust ourselves again. By staying clean and keeping our promises, we prove to ourselves that we can be relied upon. This self-trust is foundational to our recovery.`,
    reflectionPrompt:
      'How are you rebuilding trust with others and with yourself? What action can you take today to demonstrate trustworthiness?',
    source: 'jft',
  },

  // September
  '09-01': {
    id: '09-01',
    date: '09-01',
    title: 'Back to Basics',
    content: `When life gets complicated or recovery feels hard, we go back to basics. The fundamentals that worked in our early days still work now: meetings, working with a sponsor, helping others, and working the steps.

Sometimes we try to overcomplicate recovery. We think we need something more advanced, more sophisticated. But the basics are the basics for a reason—they work. When in doubt, we keep it simple.

Today, we recommit to the fundamental practices of our program. We don't neglect the foundations that keep us clean. We remember that a strong recovery is built on simple, consistent actions.`,
    reflectionPrompt:
      'Are you practicing the basics of your program? What fundamental practice have you been neglecting?',
    source: 'jft',
  },
  '09-15': {
    id: '09-15',
    date: '09-15',
    title: 'Helping the Newcomer',
    content: `Helping newcomers is essential to our recovery. When we share our experience with someone new, we're reminded of where we came from. We reinforce our own recovery by giving away what was freely given to us.

We don't have to have all the answers to help a newcomer. We just need to share our experience, listen, and offer hope. Sometimes the most powerful thing we can do is simply be there, letting them know they're not alone.

Newcomers bring new energy to our meetings and remind us of the miracle of recovery. Every newcomer is a gift to the fellowship.`,
    reflectionPrompt:
      'How have you helped a newcomer recently? What would you want to tell someone in their first days of recovery?',
    source: 'jft',
  },

  // October
  '10-01': {
    id: '10-01',
    date: '10-01',
    title: 'Taking Inventory',
    content: `Regular self-examination keeps us honest and helps us grow. The tenth step tells us to continue to take personal inventory and promptly admit when we're wrong. This isn't about beating ourselves up—it's about staying clean and growing.

Daily inventory helps us catch problems before they grow. We review our day: Where were we selfish? Dishonest? Afraid? Do we owe anyone an amends? What did we do well? This honest assessment keeps us on track.

When we find something that needs attention, we don't delay. We address it promptly. By keeping our side of the street clean, we maintain our peace of mind and our recovery.`,
    reflectionPrompt:
      'Take a brief inventory of your day so far. What needs attention? What are you proud of?',
    source: 'jft',
  },
  '10-15': {
    id: '10-15',
    date: '10-15',
    title: 'Facing Fears',
    content: `Fear was a constant companion in our addiction. Fear of running out, fear of being discovered, fear of who we'd become. In recovery, we still face fears—but now we have tools to deal with them.

The steps help us face our fears directly. We examine them in our inventory, share them with our sponsor, and ask our Higher Power for help. We learn that most of what we fear never comes to pass, and what does come, we can handle.

Courage isn't the absence of fear—it's taking action despite the fear. Today, we move forward even when we're afraid, trusting that we won't have to face anything alone.`,
    reflectionPrompt: "What fear is holding you back? What would you do if you weren't afraid?",
    source: 'jft',
  },

  // November
  '11-01': {
    id: '11-01',
    date: '11-01',
    title: 'Counting Our Blessings',
    content: `November begins a season of gratitude. As we look back on our journey, we can see countless blessings we might have missed before. Our eyes are open now.

We're alive. We're clean. We have a chance to live differently. These alone are enormous blessings. But there's more—fellowship, hope, tools for living, people who care about us. The list goes on.

Today, we take time to count our blessings. Not to ignore our problems, but to remember that even in difficult times, we have much to be grateful for. Gratitude changes our perspective and lifts our spirits.`,
    reflectionPrompt: 'Make a gratitude list. What five things are you most grateful for today?',
    source: 'jft',
  },
  '11-15': {
    id: '11-15',
    date: '11-15',
    title: 'Giving Thanks',
    content: `Gratitude expressed becomes even more powerful. When we share our thanks with others—thanking our sponsor, our home group, the people who support us—we strengthen those relationships and our own recovery.

We can also give thanks through action. We show our gratitude for recovery by working our program, helping others, and being of service. Our lives in recovery are a living thank-you to everyone who came before us.

Today, we don't just feel grateful—we express it. We reach out to someone who has helped us and let them know they made a difference.`,
    reflectionPrompt: 'Who can you thank today? How can you show your gratitude through action?',
    source: 'jft',
  },
  '11-25': {
    id: '11-25',
    date: '11-25',
    title: 'The Promises of Recovery',
    content: `The program promises us a new way of life. We will know a new freedom and happiness. We will not regret the past nor wish to shut the door on it. We will comprehend serenity and know peace.

These promises are not just words—they come true in the lives of those who work the program. We see it in the recovering addicts around us. We feel it in our own lives as we continue on this journey.

The promises don't come all at once. They unfold gradually as we work the steps and live the principles. Some days we experience them fully; other days we're still waiting. But they will materialize if we work for them.`,
    reflectionPrompt:
      'Which promise of recovery has come true in your life? Which one are you still waiting for?',
    source: 'jft',
  },

  // December
  '12-01': {
    id: '12-01',
    date: '12-01',
    title: 'Preparing for the Holidays',
    content: `The holiday season can be challenging for those in recovery. Family gatherings may be stressful, substances may be present, and emotions can run high. We need to be prepared.

Preparation means having a plan. We know which meetings we'll attend. We have numbers to call if we're struggling. We know our limits and have exit strategies if situations become unsafe. We put our recovery first.

The holidays can also be a time of joy and connection in recovery. Many of us celebrate with our fellowship family. We create new traditions that support our recovery. The key is being prepared and staying close to our program.`,
    reflectionPrompt:
      "What's your plan for staying safe during the holiday season? What support do you need to put in place?",
    source: 'jft',
  },
  '12-15': {
    id: '12-15',
    date: '12-15',
    title: 'Year in Review',
    content: `As the year draws to a close, we reflect on our journey. We've faced challenges, celebrated victories, and grown in ways we might not have expected. Recovery is a process, and we're making progress.

Looking back helps us see how far we've come. On the hard days, it might not feel like we're making progress. But when we review the year, we can see the changes. We're not where we were this time last year.

We acknowledge what went well and what we want to work on. We set intentions for the coming year. We recognize that every day clean is an achievement worth celebrating.`,
    reflectionPrompt:
      'What are you most proud of from this year? What do you want to focus on in the coming year?',
    source: 'jft',
  },
  '12-25': {
    id: '12-25',
    date: '12-25',
    title: 'The Gift of Recovery',
    content: `Recovery is a gift—perhaps the greatest gift we've ever received. It's a gift that keeps on giving, one that opens doors to other gifts: serenity, connection, purpose, hope.

This gift wasn't earned—we couldn't have earned it. It was given freely by those who came before us, who shared their experience, strength, and hope. Now we have the privilege of passing it on.

Today, we celebrate the gift of recovery. We honor it by continuing to work our program and by sharing it with others. The gift grows as we give it away.`,
    reflectionPrompt:
      'What does the gift of recovery mean to you? How can you share this gift with others?',
    source: 'jft',
  },
  '12-31': {
    id: '12-31',
    date: '12-31',
    title: 'Carrying the Message Forward',
    content: `As one year ends and another begins, we look forward with hope. We've been given a precious gift—a day, a week, a month, a year, however long we've had clean. We don't take it for granted.

Our job now is to carry the message forward. To be there for the addict who still suffers. To share our experience with those who need to hear it. To live as an example of what recovery makes possible.

The new year is full of possibility. We don't know what it will bring, but we know we don't have to face it alone. Together, with our program and our fellowship, we can handle whatever comes. Just for today, we're free.`,
    reflectionPrompt:
      'What message of hope do you want to carry into the new year? How will you share your recovery with others?',
    source: 'jft',
  },
};

/**
 * Get today's reading based on current date
 */
export function getTodayReading(): DailyReading | null {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateKey = `${month}-${day}`;

  return DAILY_READINGS[dateKey] || getDefaultReading(dateKey);
}

/**
 * Get reading for a specific date
 */
export function getReadingByDate(date: Date): DailyReading | null {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateKey = `${month}-${day}`;

  return DAILY_READINGS[dateKey] || getDefaultReading(dateKey);
}

/**
 * Get a default reading for dates without specific content
 */
function getDefaultReading(dateKey: string): DailyReading {
  // Rotate through a set of generic readings based on day of month
  const dayNum = parseInt(dateKey.split('-')[1], 10);
  const defaultReadings = [
    {
      title: 'Just for Today',
      content: `Just for today, I will try to live through this day only, and not tackle my whole life problems at once. I can do something for today that would appall me if I felt I had to keep it up for a lifetime.

Just for today, I will be happy. Most folks are as happy as they make up their minds to be.

Just for today, I will adjust myself to what is, and not try to adjust everything to my own desires. I will take my luck as it comes, and fit myself to it.

Just for today, I will strengthen my mind. I will study. I will learn something useful. I will read something that requires effort, thought, and concentration.`,
      reflectionPrompt: 'What can you focus on just for today? How can you live in this moment?',
    },
    {
      title: 'Keep Coming Back',
      content: `The doors of recovery are always open. No matter how many times we've tried and failed, no matter how far we've fallen, we can always come back.

There's no shame in struggling. Recovery is hard. What matters is that we keep trying, keep coming back, keep showing up. The miracle of recovery is available to anyone who wants it badly enough.

Today, we keep coming back. We don't give up on ourselves or on recovery. We trust that if we stay the course, the promises will come true in our lives.`,
      reflectionPrompt:
        'What keeps you coming back? How has persistence paid off in your recovery?',
    },
    {
      title: 'Easy Does It',
      content: `In our addiction, we often lived in extremes. All or nothing. Fast and reckless. Recovery asks us to slow down, to take it easy, to be gentle with ourselves and others.

Easy does it reminds us not to take on too much too fast. We don't have to solve all our problems today. We don't have to be perfect right now. We take small steps, one at a time.

Today, we practice moderation and patience. We let go of urgency and trust in the process. Recovery happens over time, not overnight.`,
      reflectionPrompt:
        'Where in your life do you need to take it easier? How can you be more gentle with yourself today?',
    },
    {
      title: 'First Things First',
      content: `Our priorities in addiction were completely distorted. Using came first, before family, work, health, everything. Recovery asks us to rearrange our priorities.

First things first means putting our recovery at the top of the list. Everything else depends on staying clean. If we lose our recovery, we lose everything else too.

Today, we keep our priorities in order. We don't let other demands crowd out the things that matter most. We remember that without recovery, nothing else works.`,
      reflectionPrompt: 'Are your priorities in order? What might be crowding out your recovery?',
    },
    {
      title: 'Let Go and Let God',
      content: `Control was our specialty. We tried to control our using, control others, control outcomes. This illusion of control kept us sick. Recovery asks us to let go.

Letting go means releasing our grip on things we can't control anyway. We do our part—work our program, take the next right action—and leave the results to our Higher Power.

Today, we practice letting go. We release our white-knuckle grip on life and trust that things will work out as they're supposed to. We find freedom in surrender.`,
      reflectionPrompt:
        'What are you trying to control that you need to let go of? How can you practice surrender today?',
    },
  ];

  const index = (dayNum - 1) % defaultReadings.length;
  const reading = defaultReadings[index];

  return {
    id: dateKey,
    date: dateKey,
    title: reading.title,
    content: reading.content,
    reflectionPrompt: reading.reflectionPrompt,
    source: 'jft',
  };
}

/**
 * Get all available reading dates
 */
export function getAvailableReadingDates(): string[] {
  return Object.keys(DAILY_READINGS).sort();
}

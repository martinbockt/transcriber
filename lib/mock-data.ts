import type { VoiceItem } from '@/types/voice-item';

export const MOCK_HISTORY: VoiceItem[] = [
  {
    id: '1',
    createdAt: new Date('2024-01-15T10:30:00').toISOString(),
    originalTranscript: 'I need to call John about the quarterly report by Friday, review the budget spreadsheet, and schedule a meeting with the marketing team to discuss the new campaign launch.',
    title: 'Q1 Tasks and Meetings',
    tags: ['Work', 'Urgent', 'Q1'],
    summary: 'Multiple work-related tasks including contacting John about quarterly reports, budget review, and scheduling a marketing meeting for the new campaign.',
    keyFacts: ['Contact: John', 'Deadline: Friday', 'Department: Marketing'],
    intent: 'TODO',
    data: {
      todos: [
        { task: 'Call John about the quarterly report', done: false, due: '2024-01-19' },
        { task: 'Review the budget spreadsheet', done: false },
        { task: 'Schedule meeting with marketing team for new campaign', done: false },
      ],
    },
  },
  {
    id: '2',
    createdAt: new Date('2024-01-14T15:45:00').toISOString(),
    originalTranscript: 'What are the best practices for implementing OAuth 2.0 authentication in a Next.js application? I need to understand the security implications and the recommended libraries.',
    title: 'OAuth 2.0 in Next.js',
    tags: ['Development', 'Security', 'Next.js'],
    summary: 'Research request about implementing OAuth 2.0 authentication in Next.js, focusing on security best practices and library recommendations.',
    keyFacts: ['Framework: Next.js', 'Auth method: OAuth 2.0'],
    intent: 'RESEARCH',
    data: {
      researchAnswer: `OAuth 2.0 implementation in Next.js best practices:

1. **Use NextAuth.js**: The most popular and secure solution for Next.js authentication. It provides built-in OAuth providers and handles token management automatically.

2. **Security Considerations**:
   - Always use HTTPS in production
   - Store tokens securely (httpOnly cookies, not localStorage)
   - Implement CSRF protection
   - Use state parameters to prevent CSRF attacks
   - Validate tokens on the server side

3. **Recommended Setup**:
   - Install next-auth: \`npm install next-auth\`
   - Configure providers in \`[...nextauth].ts\`
   - Use session callbacks for custom user data
   - Implement JWT strategy for stateless authentication

4. **Additional Libraries**:
   - @auth/core for framework-agnostic auth
   - jose for JWT handling
   - iron-session for encrypted sessions

5. **Token Management**:
   - Refresh tokens should be stored securely
   - Implement token rotation
   - Set appropriate expiration times
   - Use middleware for route protection`,
    },
  },
  {
    id: '3',
    createdAt: new Date('2024-01-13T09:15:00').toISOString(),
    originalTranscript: 'I need to write a professional email to Sarah explaining why the project delivery will be delayed by two weeks due to unexpected technical challenges with the API integration.',
    title: 'Project Delay Email to Sarah',
    tags: ['Communication', 'Email', 'Project'],
    summary: 'Draft request for a professional email explaining a two-week project delay caused by API integration technical issues.',
    keyFacts: ['Recipient: Sarah', 'Delay: 2 weeks', 'Reason: API integration challenges'],
    intent: 'DRAFT',
    data: {
      draftContent: `Subject: Project Delivery Timeline Update

Dear Sarah,

I hope this email finds you well. I'm writing to inform you of an important update regarding our project timeline.

Due to unexpected technical challenges we've encountered during the API integration phase, we will need to extend our delivery timeline by two weeks. Our team has been working diligently to resolve these issues, and we've identified the root causes that were not apparent during our initial planning phase.

The additional time will allow us to:
- Properly address the integration complexities
- Conduct thorough testing to ensure quality
- Implement the solution correctly without cutting corners

I understand this may impact your planning, and I sincerely apologize for any inconvenience this may cause. I'm committed to keeping you updated on our progress and would be happy to discuss this in more detail at your convenience.

The revised delivery date is now [original date + 2 weeks]. Please let me know if you have any questions or concerns.

Thank you for your understanding and continued support.

Best regards,
[Your name]`,
    },
  },
  {
    id: '4',
    createdAt: new Date('2024-01-12T14:20:00').toISOString(),
    originalTranscript: 'Remember that the new coffee machine in the break room needs descaling every three months. The water filter should also be replaced quarterly. The manual is in the top drawer next to the machine.',
    title: 'Coffee Machine Maintenance',
    tags: ['Office', 'Maintenance', 'Reminder'],
    summary: 'Maintenance instructions for the office coffee machine including descaling frequency and water filter replacement schedule.',
    keyFacts: ['Descaling: Every 3 months', 'Filter replacement: Quarterly', 'Manual location: Top drawer'],
    intent: 'NOTE',
    data: {},
  },
];

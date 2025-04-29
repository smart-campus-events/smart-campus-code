// src/app/api/recommendations/ai-suggested/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import type { Event as PrismaEvent, User as PrismaUser, Category, EventCategory } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import nextAuthOptionsConfig from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
// Make sure ContentStatus is imported if needed, or use the string literals directly

// --- Gemini API Integration ---

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) console.error('GEMINI_API_KEY environment variable not set.');
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const model = genAI?.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

interface AiRankingResponse {
  rankedEventIds: string[];
  branchOutEventIds: string[];
}
// --------------------------------------------

// --- Simple In-Memory Cache ---
interface CacheEntry { data: AiRankingResponse; timestamp: number; }
const recommendationCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
// -----------------------------

type SessionWithId = Session & { user: Session['user'] & { id: string } };
type UserWithInterests = PrismaUser & { interests: ({ category: Category }
& { categoryId: string; assignedAt: Date; userId: string; })[]; };
// Event details needed, removed categoryTags as it's not needed
type EventWithDetails = PrismaEvent & {
  categories: (EventCategory & { category: Category })[];
  organizerClub: { name: string } | null;
};

function safeJsonParse<T>(jsonString: string | null | undefined): T | null {
  if (!jsonString) return null;
  try {
    const cleanedString = jsonString.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleanedString) as T;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    console.error('Cleaned string attempted:', jsonString);
    return null;
  }
}

// Simplified category name getter - relies on relation being populated
function getEventCategoryNames(event: EventWithDetails): string {
  if (event.categories && event.categories.length > 0) {
    return event.categories.map(c => c.category.name).join(', ');
  }
  return 'None'; // Should only happen if event has no linked categories
}

async function getAiRankings(userData: UserWithInterests | null, allEvents: EventWithDetails[]):
Promise<AiRankingResponse> {
  const fallbackResponse: AiRankingResponse = { rankedEventIds: [], branchOutEventIds: [] };
  const allIds = allEvents.map(e => e.id);
  fallbackResponse.rankedEventIds = allIds.slice(0, 5);
  fallbackResponse.branchOutEventIds = allIds.slice(5, 8);

  if (!model) { console.error('Gemini model not initialized.'); return fallbackResponse; }
  if (!userData || allEvents.length === 0) {
    console.log('No user data or events for AI.');
    return { rankedEventIds: [], branchOutEventIds: [] };
  }

  const userProfileSummary = `User ID: ${userData.id}\nMajor: ${userData.major
  || 'N/A'}\nInterests: ${userData.interests?.map(i => i.category.name).join(', ')
  || 'None'}\nAbout Me: ${userData.about_me || 'N/A'}`; // Add more fields as needed

  // Use the simplified category getter
  const eventSummaries = allEvents.map(event => `ID: ${event.id}\nTitle: 
    ${event.title}\nDesc: ${event.description?.substring(0, 100).replace(/\s+/g, ' ')
    || ''}...\nCats: ${getEventCategoryNames(event)}\nDate: 
    ${event.startDateTime.toISOString()}\nLoc: ${event.location
    || (event.locationVirtualUrl ? 'Online' : 'TBD')}`).join('\n---\n');

  // Prompt remains largely the same
  const prompt = `You are a recommendation engine for Manoa Compass (UH Manoa app).
   Suggest relevant events based on the user profile and available events.
    User Profile:\n${userProfileSummary}\n\nAvailable Events:\n${eventSummaries}\n\nInstructions:\n
    1. Analyze profile (major, interests, about me) vs events (title, desc, categories).\n
    2. Rank top 10 most relevant events.\n3. Identify 5 "branch out" events.\n
    4. Use ONLY IDs from 'Available Events'.\n
    5. Return ONLY strict JSON (NO MARKDOWN):\n
    {\n  "rankedEventIds": ["id1", ...],\n  "branchOutEventIds": ["idA", ...]\n}`;

  console.log('--- Sending Prompt to AI ---');
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });
    const text = result.response.text();
    console.log('--- Raw AI Response Text (JSON Mime Type Requested) ---');
    console.log(text);

    const parsedResponse = safeJsonParse<AiRankingResponse>(text);
    if (!parsedResponse || !Array.isArray(parsedResponse.rankedEventIds)
      || !Array.isArray(parsedResponse.branchOutEventIds)) {
      console.error('AI response JSON parsing failed or format incorrect. Returning fallback.');
      return fallbackResponse;
    }

    const validEventIds = new Set(allEvents.map(e => e.id));
    parsedResponse.rankedEventIds = parsedResponse.rankedEventIds.filter(id => validEventIds.has(id));
    parsedResponse.branchOutEventIds = parsedResponse.branchOutEventIds.filter(id => validEventIds.has(id));

    console.log('--- Parsed & Validated AI Response ---', parsedResponse);
    return parsedResponse;
  } catch (error: any) {
    console.error('Error calling Gemini API or processing response:', error);
    if (error.message && (error.message.includes('429')
      || error.message.toLowerCase().includes('rate limit'))) {
      console.warn('Rate limit likely exceeded.');
    }
    console.log('Returning fallback due to API/processing error.');
    return fallbackResponse;
  }
}

// --- Helper Function: Fetch event details ---
async function fetchEventDetails(ids: string[]): Promise<EventWithDetails[]> {
  if (!ids || ids.length === 0) return [];
  console.log(`Fetching details for ${ids.length} event IDs including PENDING:`, ids);
  return prisma.event.findMany({
    where: {
      id: { in: ids },
      // ** Allow both APPROVED and PENDING statuses **
      status: { in: ['APPROVED', 'PENDING'] },
      startDateTime: { gte: new Date() }, // Still check for future date
    },
    include: {
      categories: { include: { category: true } },
      organizerClub: { select: { name: true } },
    },
  });
}

// --- Helper Function: Order, Filter, and Apply Fallback ---
// (No changes needed in this helper itself, it works on the fetched data)
function applyOrderingAndFallback(
  topRecs: EventWithDetails[],
  branchOutRecs: EventWithDetails[],
  aiResponse: AiRankingResponse,
  potentialEvents: EventWithDetails[],
): { orderedTop: EventWithDetails[], orderedBranchOut: EventWithDetails[] } { // Return new arrays
  console.log(`Initial counts before sort/fallback: Top=${topRecs.length}, BranchOut=${branchOutRecs.length}`);
  const orderMap = (ids: string[]) => new Map(ids.map((id, index) => [id, index]));

  let orderedTop: EventWithDetails[] = [];
  let orderedBranchOut: EventWithDetails[] = [];

  // Order and filter Top Recommendations
  if (aiResponse.rankedEventIds.length > 0) {
    const topOrderMap = orderMap(aiResponse.rankedEventIds);
    orderedTop = topRecs.filter(event => topOrderMap.has(event.id)); // Ensure fetched event was in AI list
    orderedTop.sort((a, b) => (topOrderMap.get(a.id) ?? Infinity) - (topOrderMap.get(b.id) ?? Infinity));
  }

  // Order and filter Branch Out Suggestions
  if (aiResponse.branchOutEventIds.length > 0) {
    const branchOutOrderMap = orderMap(aiResponse.branchOutEventIds);
    orderedBranchOut = branchOutRecs
      .filter(event => branchOutOrderMap.has(event.id)); // Ensure fetched event was in AI list
    orderedBranchOut.sort((a, b) => (branchOutOrderMap.get(a.id) ?? Infinity)
    - (branchOutOrderMap.get(b.id) ?? Infinity));
  }
  console.log(`Counts after fetch & sort: Top=${orderedTop.length}, BranchOut=${orderedBranchOut.length}`);

  // Fallback/Augmentation (Applies to the *ordered* lists)
  const minTop = 3;
  const minBranch = 2;
  const addFallbacks = (targetList: EventWithDetails[], minCount: number) => {
    if (targetList.length < minCount) {
      console.log(`Augmenting list (currently ${targetList.length}, needs ${minCount})...`);
      // Ensure existingIds includes IDs from *both* current target lists after sorting/filtering
      const existingIds = new Set([...orderedTop.map(e => e.id), ...orderedBranchOut.map(e => e.id)]);
      const availableFallbacks = potentialEvents.filter(e => !existingIds.has(e.id));
      console.log(`Available distinct fallbacks: ${availableFallbacks.length}`);
      const needed = minCount - targetList.length;
      const fallbackEvents = availableFallbacks.slice(0, needed);
      if (fallbackEvents.length > 0) {
        console.log(`Adding ${fallbackEvents.length} fallback events.`);
        targetList.push(...fallbackEvents);
      }
    }
  };

  addFallbacks(orderedTop, minTop);
  addFallbacks(orderedBranchOut, minBranch);

  console.log(`Final counts after fallback: Top=${orderedTop.length}, BranchOut=${orderedBranchOut.length}`);
  return { orderedTop, orderedBranchOut }; // Return the modified lists
}

// --- Helper Function: Process AI Response to Final Output ---
async function processAndFormatResponse(
  aiResponse: AiRankingResponse,
  potentialEvents: EventWithDetails[],
): Promise<{ topRecommendations: EventWithDetails[], branchOutSuggestions: EventWithDetails[] }> {
  const topRecsFetched = await fetchEventDetails(aiResponse.rankedEventIds);
  const branchOutRecsFetched = await fetchEventDetails(aiResponse.branchOutEventIds);

  // Apply sorting, filtering, and fallback logic
  const { orderedTop, orderedBranchOut } = applyOrderingAndFallback(
    topRecsFetched,
    branchOutRecsFetched,
    aiResponse,
    potentialEvents,
  );

  return { topRecommendations: orderedTop, branchOutSuggestions: orderedBranchOut };
}

// GET /api/recommendations/ai-suggested (Main function)
// eslint-disable-next-line import/prefer-default-export
export async function GET() {
  const session = (await getServerSession(nextAuthOptionsConfig)) as SessionWithId;
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  // --- Cache Check ---
  const cachedEntry = recommendationCache.get(userId);
  if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_TTL_MS)) {
    console.log(`Cache HIT for user ${userId}`);
    const aiResponse = cachedEntry.data;
    // We still need the *current* potential events pool for the fallback logic inside processAndFormatResponse
    const potentialEvents: EventWithDetails[] = await prisma.event.findMany({
      where: {
        status: { in: ['APPROVED', 'PENDING'] }, // Include PENDING
        startDateTime: { gte: new Date() },
      },
      include: { categories: { include: { category: true } }, organizerClub: { select: { name: true } } },
      orderBy: { startDateTime: 'asc' },
      take: 75,
    });
    const cachedResult = await processAndFormatResponse(aiResponse, potentialEvents); // Pass current pool
    return NextResponse.json(cachedResult);
  }
  console.log(`Cache MISS for user ${userId}`);
  // --- End Cache Check ---

  try {
    // 1. Fetch User Data
    const user: UserWithInterests | null = await prisma.user.findUnique({
      where: { id: userId },
      include: { interests: { include: { category: true } } },
    });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    console.log(`User ${userId} interests: ${user.interests?.map(i => i.category.name).join(', ')}`);

    // 2. Fetch Pool of Potential Events (Including PENDING)
    const potentialEvents: EventWithDetails[] = await prisma.event.findMany({
      where: {
        // ** Allow both APPROVED and PENDING statuses **
        status: { in: ['APPROVED', 'PENDING'] },
        startDateTime: { gte: new Date() },
      },
      include: {
        categories: { include: { category: true } }, // Relation is used
        organizerClub: { select: { name: true } },
        // categoryTags: true, // No longer needed if relation is confirmed working
      },
      orderBy: { startDateTime: 'asc' },
      take: 75,
    });
    console.log(`Fetched ${potentialEvents.length} potential events (incl. PENDING) initially.`);
    if (potentialEvents.length === 0) return NextResponse.json({ topRecommendations: [], branchOutSuggestions: [] });

    // 3. Get AI Rankings
    const aiResponse = await getAiRankings(user, potentialEvents);
    console.log('AI Response received in GET:', aiResponse);

    // --- Cache Store ---
    if (aiResponse && (aiResponse.rankedEventIds?.length > 0 || aiResponse.branchOutEventIds?.length > 0)) {
      recommendationCache.set(userId, { data: aiResponse, timestamp: Date.now() });
      console.log(`Cache SET for user ${userId}`);
    }
    if (recommendationCache.size > 1000) {
      const firstKey = recommendationCache.keys().next().value;
      if (firstKey) {
        recommendationCache.delete(firstKey);
      }
    }
    // --- End Cache Store ---

    // 4, 5, 6: Process, Format, Fetch Details, Apply Fallback
    const finalResult = await processAndFormatResponse(aiResponse, potentialEvents);
    return NextResponse.json(finalResult);
  } catch (error) {
    console.error('Error in GET /api/recommendations/ai-suggested:', error);
    return NextResponse.json({ message: 'Failed to fetch recommendations due to an internal error.' }, { status: 500 });
  }
}

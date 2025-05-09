// src/app/api/recommendations/ai-suggested/route.ts
/* eslint-disable max-len */
/* eslint-disable import/prefer-default-export */

import nextAuthOptionsConfig from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  Category, // Import Club type
  ClubCategory, EventCategory,
  Club as PrismaClub, Event as PrismaEvent,
  User as PrismaUser,
} from '@prisma/client';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

console.log('[DEBUG] ai-suggested/route.ts: Module load START');

console.log('[DEBUG] ai-suggested/route.ts: Imports loaded');

// --- Gemini API Integration ---
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) console.error('GEMINI_API_KEY environment variable not set.');
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const model = genAI?.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

console.log('[DEBUG] ai-suggested/route.ts: Gemini integration setup');

// --- Updated AI Response Interface ---
interface AiRankingResponse {
  rankedEventIds: string[];
  branchOutEventIds: string[];
  rankedClubIds: string[]; // Added for clubs
  branchOutClubIds: string[]; // Added for clubs
}
// --------------------------------------------

// --- Cache ---
interface CacheEntry { data: AiRankingResponse; timestamp: number; }
const recommendationCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
// -----------------------------

// --- Types ---
type SessionWithId = Session & { user: Session['user'] & { id: string } };
type UserWithInterests = PrismaUser & { interests: ({ category: Category }
& { categoryId: string; assignedAt: Date; userId: string; })[]; };

// Event type (no changes needed)
type EventWithDetails = PrismaEvent & {
  categories: (EventCategory & { category: Category })[];
  organizerClub: { name: string } | null; // Use 'organizerClub' based on Event schema
};

// Club type (using relevant fields)
type ClubWithDetails = PrismaClub & {
  categories: (ClubCategory & { category: Category })[];
};
// -------------

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

// Category name getters
function getEventCategoryNames(event: EventWithDetails): string {
  if (event.categories && event.categories.length > 0) {
    return event.categories.map(c => c.category.name).join(', ');
  }
  return 'None';
}

function getClubCategoryNames(club: ClubWithDetails): string {
  if (club.categories && club.categories.length > 0) {
    return club.categories.map(c => c.category.name).join(', ');
  }
  // Use categoryDescription as fallback if no categories relation?
  // return club.categoryDescription || 'None';
  return 'None'; // Assuming categories relation is primary
}

// --- Updated getAiRankings Function ---
async function getAiRankings(
  userData: UserWithInterests | null,
  allEvents: EventWithDetails[],
  allClubs: ClubWithDetails[], // Add clubs parameter
): Promise<AiRankingResponse> {
  const fallbackResponse: AiRankingResponse = {
    rankedEventIds: [], branchOutEventIds: [], rankedClubIds: [], branchOutClubIds: [],
  };
  const allEventIds = allEvents.map(e => e.id);
  const allClubIds = allClubs.map(c => c.id); // Get club IDs

  // Simple fallback: first few events/clubs if no AI response
  fallbackResponse.rankedEventIds = allEventIds.slice(0, 9);
  fallbackResponse.branchOutEventIds = allEventIds.slice(9, 12);
  fallbackResponse.rankedClubIds = allClubIds.slice(0, 9); // Fallback for clubs
  fallbackResponse.branchOutClubIds = allClubIds.slice(9, 12); // Fallback for clubs

  if (!model) { console.error('Gemini model not initialized.'); return fallbackResponse; }
  // Need user data, and *either* events *or* clubs to proceed
  if (!userData || (allEvents.length === 0 && allClubs.length === 0)) {
    console.log('No user data or no items (events/clubs) for AI.');
    return { rankedEventIds: [], branchOutEventIds: [], rankedClubIds: [], branchOutClubIds: [] };
  }

  const userProfileSummary = `User ID: ${userData.id}\nMajor: ${userData.major
        || 'N/A'}\nInterests: ${userData.interests?.map(i => i.category.name).join(', ')
        || 'None'}\nAbout Me: ${userData.about_me || 'N/A'}`;

  const eventSummaries = allEvents.map(event => `Type: Event\nID: ${event.id}\nTitle: 
    ${event.title}\nDesc: ${event.description?.substring(0, 100).replace(/\s+/g, ' ')
    || ''}...\nCats: ${getEventCategoryNames(event)}\nDate: ${event.startDateTime
  .toISOString()}\nLoc: ${event.location || (event.locationVirtualUrl ? 'Online' : 'TBD')}`).join('\n---\n');

  // Create summaries for clubs
  const clubSummaries = allClubs.map(club => `Type: Club\nID: ${club.id}\nName:
     ${club.name}\nPurpose: ${club.purpose.substring(0, 150).replace(/\s+/g, ' ')
     || ''}...\nCats: ${getClubCategoryNames(club)}\nDesc: ${club.categoryDescription
     || 'N/A'}`).join('\n---\n'); // Added categoryDescription here

  // --- Updated Prompt ---
  const prompt = `You are a recommendation engine for Manoa Compass (UH Manoa app).
Suggest relevant EVENTS and CLUBS based on the user profile and available items.
User Profile:\n${userProfileSummary}\n\nAvailable Items (Events and Clubs)
:\n${eventSummaries}\n---\n${clubSummaries}\n\nInstructions:\n
1. Analyze profile (major, interests, about me) vs items (title/name, desc/purpose, categories).\n
2. Rank top 18 most relevant EVENTS.\n
3. Identify 9 "branch out" EVENTS (related but different).\n
4. Rank top 18 most relevant CLUBS.\n
5. Identify 9 "branch out" CLUBS.\n
6. Use ONLY IDs from 'Available Items'.\n
7. Return ONLY strict JSON (NO MARKDOWN):\n
{\n  "rankedEventIds": ["event_id1", ...],\n  
"branchOutEventIds": ["event_idA", ...],\n  "rankedClubIds": 
["club_id1", ...],\n  "branchOutClubIds": ["club_idA", ...]\n}`;

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
            || !Array.isArray(parsedResponse.branchOutEventIds)
            || !Array.isArray(parsedResponse.rankedClubIds) // Validate new fields
            || !Array.isArray(parsedResponse.branchOutClubIds)
    ) {
      console.error('AI response JSON parsing failed or format incorrect. Returning fallback.');
      return fallbackResponse;
    }

    // Validate IDs against the fetched items
    const validEventIds = new Set(allEvents.map(e => e.id));
    const validClubIds = new Set(allClubs.map(c => c.id)); // Validate club IDs

    parsedResponse.rankedEventIds = parsedResponse.rankedEventIds.filter(id => validEventIds.has(id));
    parsedResponse.branchOutEventIds = parsedResponse.branchOutEventIds.filter(id => validEventIds.has(id));
    parsedResponse.rankedClubIds = parsedResponse.rankedClubIds.filter(id => validClubIds.has(id)); // Filter club IDs
    parsedResponse.branchOutClubIds = parsedResponse.branchOutClubIds.filter(id => validClubIds.has(id));

    console.log('--- Parsed & Validated AI Response ---', parsedResponse);
    return parsedResponse;
  } catch (error: any) {
    console.error('Error calling Gemini API or processing response:', error);
    if (error.message && (error.message.includes('429') || error.message.toLowerCase().includes('rate limit'))) {
      console.warn('Rate limit likely exceeded.');
    }
    console.log('Returning fallback due to API/processing error.');
    return fallbackResponse;
  }
}

// --- Helper Function: Fetch event details --- (No changes needed)
async function fetchEventDetails(ids: string[]): Promise<EventWithDetails[]> {
  if (!ids || ids.length === 0) return [];
  console.log(`Workspaceing details for ${ids.length} event IDs (incl. PENDING):`, ids);
  return prisma.event.findMany({
    where: {
      id: { in: ids },
      status: { in: ['APPROVED', 'PENDING'] },
      startDateTime: { gte: new Date() },
    },
    include: {
      categories: { include: { category: true } },
      organizerClub: { select: { name: true } }, // Renamed from hostClub to organizerClub
    },
    orderBy: { startDateTime: 'asc' }, // Keep ordering consistent if needed elsewhere
  });
}

// --- Helper Function: Fetch club details --- (New)
async function fetchClubDetails(ids: string[]): Promise<ClubWithDetails[]> {
  if (!ids || ids.length === 0) return [];
  console.log(`Workspaceing details for ${ids.length} club IDs (incl. PENDING):`, ids);
  return prisma.club.findMany({
    where: {
      id: { in: ids },
      // Allow both APPROVED and PENDING statuses
      status: { in: ['APPROVED', 'PENDING'] },
    },
    include: {
      categories: { include: { category: true } },
      // submittedBy: { select: { name: true } } // Include if needed
      // favoritedBy: { select: { id: true } } // Include if needed
    },
    // Add orderBy if needed, e.g., by name
    // orderBy: { name: 'asc' }
  });
}

// --- Helper Function: Order, Filter, and Apply Fallback --- (Updated)
// Now takes both potential events and clubs for fallback
function applyOrderingAndFallback<T extends { id: string }>(
  fetchedItems: T[],
  aiOrderedIds: string[],
  allItems: T[], // Pool of potential items (either allEvents or allClubs)
  existingIds: Set<string>, // IDs already used in *any* recommendation list
  minCount: number,
): T[] {
  console.log(`Applying order/fallback. Initial fetched: 
    ${fetchedItems.length}, AI IDs: ${aiOrderedIds.length}, Min required: ${minCount}`);

  const orderMap = new Map(aiOrderedIds.map((id, index) => [id, index]));
  const orderedList = fetchedItems
    .filter(item => orderMap.has(item.id)) // Ensure fetched item was in AI list
    .sort((a, b) => (orderMap.get(a.id) ?? Infinity) - (orderMap.get(b.id) ?? Infinity));

  console.log(`List size after AI ordering & filtering: ${orderedList.length}`);

  // Fallback/Augmentation
  if (orderedList.length < minCount) {
    console.log(`Augmenting list (currently ${orderedList.length}, needs ${minCount})...`);
    const availableFallbacks = allItems.filter(item => !existingIds.has(item.id));
    console.log(`Available distinct fallbacks from pool: ${availableFallbacks.length}`);

    const needed = minCount - orderedList.length;
    const fallbackItems = availableFallbacks.slice(0, needed);

    if (fallbackItems.length > 0) {
      console.log(`Adding ${fallbackItems.length} fallback items.`);
      orderedList.push(...fallbackItems);
      // Add newly added fallback IDs to the existing set to prevent reuse in other lists
      fallbackItems.forEach(item => existingIds.add(item.id));
    }
  }

  console.log(`Final list size after fallback: ${orderedList.length}`);
  return orderedList;
}

console.log('[DEBUG] ai-suggested/route.ts: Before GET function definition');

// --- Helper Function: Process AI Response to Final Output --- (Updated)
async function processAndFormatResponse(
  aiResponse: AiRankingResponse,
  potentialEvents: EventWithDetails[],
  potentialClubs: ClubWithDetails[], // Add clubs
): Promise<{
    topRecommendations: EventWithDetails[],
    branchOutSuggestions: EventWithDetails[],
    topClubRecommendations: ClubWithDetails[], // Add clubs
    branchOutClubSuggestions: ClubWithDetails[] // Add clubs
  }> {
  console.log('[DEBUG] ai-suggested/route.ts: processAndFormatResponse START');
  // Fetch details based on AI IDs
  const topRecsFetched = await fetchEventDetails(aiResponse.rankedEventIds);
  const branchOutRecsFetched = await fetchEventDetails(aiResponse.branchOutEventIds);
  const topClubsFetched = await fetchClubDetails(aiResponse.rankedClubIds);
  const branchOutClubsFetched = await fetchClubDetails(aiResponse.branchOutClubIds);

  // Set minimums
  const minTopEvents = 3;
  const minBranchEvents = 3;
  const minTopClubs = 3;
  const minBranchClubs = 3;

  // Keep track of all IDs used across all lists to prevent duplicates from fallback
  const allUsedIds = new Set<string>();

  // Process Events
  const orderedTopEvents = applyOrderingAndFallback(
    topRecsFetched,
    aiResponse.rankedEventIds,
    potentialEvents,
    allUsedIds,
    minTopEvents,
  );
  orderedTopEvents.forEach(e => allUsedIds.add(e.id)); // Add used IDs

  const orderedBranchOutEvents = applyOrderingAndFallback(
    branchOutRecsFetched,
    aiResponse.branchOutEventIds,
    potentialEvents,
    allUsedIds,
    minBranchEvents,
  );
  orderedBranchOutEvents.forEach(e => allUsedIds.add(e.id)); // Add used IDs

  // Process Clubs
  const orderedTopClubs = applyOrderingAndFallback(
    topClubsFetched,
    aiResponse.rankedClubIds,
    potentialClubs,
    allUsedIds,
    minTopClubs,
  );
  orderedTopClubs.forEach(c => allUsedIds.add(c.id)); // Add used IDs

  const orderedBranchOutClubs = applyOrderingAndFallback(
    branchOutClubsFetched,
    aiResponse.branchOutClubIds,
    potentialClubs,
    allUsedIds,
    minBranchClubs,
  );
  // No need to add branch out club IDs to the set if it's the last step

  console.log(`Final counts: Events(Top=${orderedTopEvents.length}, 
  Branch=${orderedBranchOutEvents.length}), Clubs(Top=${orderedTopClubs.length}, 
  Branch=${orderedBranchOutClubs.length})`);

  // Simplified return for clarity
  return { topRecommendations: orderedTopEvents, branchOutSuggestions: orderedBranchOutEvents, topClubRecommendations: orderedTopClubs, branchOutClubSuggestions: orderedBranchOutClubs };
}

console.log('[DEBUG] ai-suggested/route.ts: After processAndFormatResponse function definition');

export async function GET() {
  console.log('[DEBUG] ai-suggested/route.ts: GET function invoked');
  const session = await getServerSession(nextAuthOptionsConfig) as SessionWithId | null;
  console.log('[DEBUG] ai-suggested/route.ts: Session fetched', session ? `User ID: ${session.user?.id}` : 'No session');

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  // --- Cache Check ---
  const cacheKey = `user-${userId}-recommendations`;
  const cached = recommendationCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    console.log('[DEBUG] ai-suggested/route.ts: Cache HIT for AiRankingResponse. Re-processing with fresh details.');
    // We have cached AiRankingResponse (IDs), now we need to re-fetch and re-format.
    const [potentialEvents, potentialClubs] = await Promise.all([
      prisma.event.findMany({
        where: { status: { in: ['APPROVED', 'PENDING'] }, startDateTime: { gte: new Date() } },
        include: { categories: { include: { category: true } }, organizerClub: { select: { name: true } }, rsvps: true },
        orderBy: { startDateTime: 'asc' },
        take: 75,
      }),
      prisma.club.findMany({
        where: { status: { in: ['APPROVED', 'PENDING'] } },
        include: { categories: { include: { category: true } } },
        orderBy: { name: 'asc' },
        take: 75,
      }),
    ]);
    console.log(`[DEBUG] ai-suggested/route.ts: Fetched ${potentialEvents.length} potential events, ${potentialClubs.length} potential clubs for cached ID processing`);
    const processedCachedResponse = await processAndFormatResponse(cached.data, potentialEvents, potentialClubs); // cached.data is AiRankingResponse
    return NextResponse.json(processedCachedResponse); // Return the newly PROCESSED response
  }
  console.log('[DEBUG] ai-suggested/route.ts: No cache or cache stale');
  // --- End Cache Check ---

  try {
    console.log('[DEBUG] ai-suggested/route.ts: Attempting to fetch user with interests');
    const userWithInterests = await prisma.user.findUnique({
      where: { id: userId },
      include: { interests: { include: { category: true } } },
    });
    console.log('[DEBUG] ai-suggested/route.ts: User with interests fetched:', userWithInterests ? 'Yes' : 'No');

    console.log('[DEBUG] ai-suggested/route.ts: Attempting to fetch all approved events and clubs');
    const [eventsFromPrisma, clubsFromPrisma] = await Promise.all([
      prisma.event.findMany({
        where: { status: { in: ['APPROVED', 'PENDING'] }, startDateTime: { gte: new Date() } },
        include: { categories: { include: { category: true } }, organizerClub: { select: { name: true } }, rsvps: true },
        orderBy: { startDateTime: 'asc' },
        take: 75,
      }),
      prisma.club.findMany({
        where: { status: { in: ['APPROVED', 'PENDING'] } },
        include: { categories: { include: { category: true } } },
        orderBy: { name: 'asc' },
        take: 75, // Order clubs
      }),
    ]);
    const allEvents: EventWithDetails[] = eventsFromPrisma;
    const allClubs: ClubWithDetails[] = clubsFromPrisma;
    console.log(`[DEBUG] ai-suggested/route.ts: Fetched ${allEvents.length} events, ${allClubs.length} clubs`);

    if (!userWithInterests && allEvents.length === 0 && allClubs.length === 0) {
      console.log('[DEBUG] ai-suggested/route.ts: No user interests and no events/clubs, returning empty.');
      return NextResponse.json({
        topRecommendations: [],
        branchOutSuggestions: [],
        topClubRecommendations: [],
        branchOutClubSuggestions: [],
      });
    }

    console.log('[DEBUG] ai-suggested/route.ts: Calling getAiRankings');
    const aiResponse = await getAiRankings(userWithInterests, allEvents, allClubs);
    console.log('[DEBUG] ai-suggested/route.ts: getAiRankings response:', aiResponse);

    // Cache the raw AiRankingResponse (IDs) immediately after getting it from AI
    if (aiResponse && (aiResponse.rankedEventIds?.length > 0 || aiResponse.branchOutEventIds?.length > 0
      || aiResponse.rankedClubIds?.length > 0 || aiResponse.branchOutClubIds?.length > 0)) {
      recommendationCache.set(cacheKey, { data: aiResponse, timestamp: Date.now() });
      console.log('[DEBUG] ai-suggested/route.ts: Raw AI ID Response CACHED for user', userId);
    }

    console.log('[DEBUG] ai-suggested/route.ts: Calling processAndFormatResponse');
    const formattedResponse = await processAndFormatResponse(aiResponse, allEvents, allClubs);
    console.log('[DEBUG] ai-suggested/route.ts: processAndFormatResponse response:', formattedResponse);

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error('[DEBUG] ai-suggested/route.ts: Error in GET handler:', error);
    return NextResponse.json(
      { error: 'Internal server error getting recommendations' },
      { status: 500 },
    );
  }
}

console.log('[DEBUG] ai-suggested/route.ts: Module load END');

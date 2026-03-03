import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../db.js';
import * as schema from '../schema.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BriefWithRelations extends schema.UserBrief {
  collaborators: Array<
    schema.BriefCollaborator & { name: string; email: string; avatarColor: string }
  >;
  hooks: schema.HookSnippet[];
  referenceVideoIds: string[];
  likedVideoIds: string[];
  dislikedVideoIds: string[];
}

// ─── Dev user constant ────────────────────────────────────────────────────────
export const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

// ─── Brief CRUD ───────────────────────────────────────────────────────────────

export async function listBriefs(
  userId: string,
  archived = false,
): Promise<BriefWithRelations[]> {
  const rows = await db
    .select()
    .from(schema.userBriefs)
    .where(
      and(
        eq(schema.userBriefs.ownerId, userId),
        eq(schema.userBriefs.archived, archived),
      ),
    )
    .orderBy(desc(schema.userBriefs.updatedAt));

  return Promise.all(rows.map((b) => hydrateBrief(b, userId)));
}

export async function getBriefById(
  id: string,
  userId: string,
): Promise<BriefWithRelations | null> {
  const brief = await db.query.userBriefs.findFirst({
    where: eq(schema.userBriefs.id, id),
  });
  if (!brief) return null;
  return hydrateBrief(brief, userId);
}

export async function createBrief(
  data: { title: string; campaign?: string; angle?: string },
  userId: string,
): Promise<BriefWithRelations> {
  const [brief] = await db
    .insert(schema.userBriefs)
    .values({
      ownerId: userId,
      title: data.title,
      campaign: data.campaign ?? '',
      angle: data.angle ?? '',
    })
    .returning();

  // Add owner as collaborator
  await db.insert(schema.briefCollaborators).values({
    briefId: brief!.id,
    userId,
    role: 'owner',
    acceptedAt: new Date(),
  });

  return hydrateBrief(brief!, userId);
}

export async function updateBrief(
  id: string,
  data: { title?: string; campaign?: string; angle?: string; content?: string },
): Promise<schema.UserBrief | null> {
  const [updated] = await db
    .update(schema.userBriefs)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.userBriefs.id, id))
    .returning();
  return updated ?? null;
}

export async function archiveBrief(id: string, archived: boolean): Promise<void> {
  await db
    .update(schema.userBriefs)
    .set({ archived, updatedAt: new Date() })
    .where(eq(schema.userBriefs.id, id));
}

export async function deleteBrief(id: string): Promise<void> {
  await db.delete(schema.userBriefs).where(eq(schema.userBriefs.id, id));
}

// ─── References ───────────────────────────────────────────────────────────────

export async function addReference(
  briefId: string,
  videoId: string,
  userId: string,
): Promise<void> {
  await db
    .insert(schema.briefReferences)
    .values({ briefId, videoId, addedBy: userId })
    .onConflictDoNothing();

  await touchBrief(briefId);
}

export async function removeReference(briefId: string, videoId: string): Promise<void> {
  await db
    .delete(schema.briefReferences)
    .where(
      and(
        eq(schema.briefReferences.briefId, briefId),
        eq(schema.briefReferences.videoId, videoId),
      ),
    );
  await touchBrief(briefId);
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export async function addHook(data: {
  briefId: string;
  videoId: string;
  videoTitle: string;
  thumbnailUrl: string;
  startTime?: number;
  endTime?: number;
  notes?: string;
}): Promise<schema.HookSnippet> {
  const [hook] = await db
    .insert(schema.hookSnippets)
    .values({
      briefId: data.briefId,
      videoId: data.videoId,
      videoTitle: data.videoTitle,
      thumbnailUrl: data.thumbnailUrl,
      startTime: String(data.startTime ?? 0),
      endTime: String(data.endTime ?? 3),
      notes: data.notes ?? '',
    })
    .returning();

  await touchBrief(data.briefId);
  return hook!;
}

export async function removeHook(hookId: string, briefId: string): Promise<void> {
  await db
    .delete(schema.hookSnippets)
    .where(
      and(
        eq(schema.hookSnippets.id, hookId),
        eq(schema.hookSnippets.briefId, briefId),
      ),
    );
  await touchBrief(briefId);
}

export async function updateHookNotes(
  hookId: string,
  notes: string,
): Promise<schema.HookSnippet | null> {
  const [updated] = await db
    .update(schema.hookSnippets)
    .set({ notes })
    .where(eq(schema.hookSnippets.id, hookId))
    .returning();
  return updated ?? null;
}

// ─── Reactions ────────────────────────────────────────────────────────────────

export async function upsertReaction(
  briefId: string,
  videoId: string,
  userId: string,
  reaction: 'like' | 'dislike',
): Promise<void> {
  // Delete existing reaction for this video in this brief (like → dislike replaces)
  await db
    .delete(schema.briefReactions)
    .where(
      and(
        eq(schema.briefReactions.briefId, briefId),
        eq(schema.briefReactions.videoId, videoId),
        eq(schema.briefReactions.userId, userId),
      ),
    );

  await db
    .insert(schema.briefReactions)
    .values({ briefId, videoId, userId, reaction });

  await touchBrief(briefId);
}

export async function removeReaction(
  briefId: string,
  videoId: string,
  userId: string,
): Promise<void> {
  await db
    .delete(schema.briefReactions)
    .where(
      and(
        eq(schema.briefReactions.briefId, briefId),
        eq(schema.briefReactions.videoId, videoId),
        eq(schema.briefReactions.userId, userId),
      ),
    );
  await touchBrief(briefId);
}

// ─── Hydration helper ─────────────────────────────────────────────────────────

async function hydrateBrief(
  brief: schema.UserBrief,
  userId: string,
): Promise<BriefWithRelations> {
  const [collaboratorRows, hookRows, referenceRows, reactionRows] = await Promise.all([
    // Collaborators joined with user info
    db
      .select({
        briefId: schema.briefCollaborators.briefId,
        userId: schema.briefCollaborators.userId,
        role: schema.briefCollaborators.role,
        invitedAt: schema.briefCollaborators.invitedAt,
        acceptedAt: schema.briefCollaborators.acceptedAt,
        name: schema.users.name,
        email: schema.users.email,
        avatarColor: sql<string>`'#5090f0'`, // default — no avatarColor on users table yet
      })
      .from(schema.briefCollaborators)
      .innerJoin(schema.users, eq(schema.users.id, schema.briefCollaborators.userId))
      .where(eq(schema.briefCollaborators.briefId, brief.id)),

    // Hooks
    db
      .select()
      .from(schema.hookSnippets)
      .where(eq(schema.hookSnippets.briefId, brief.id))
      .orderBy(desc(schema.hookSnippets.createdAt)),

    // References
    db
      .select({ videoId: schema.briefReferences.videoId })
      .from(schema.briefReferences)
      .where(eq(schema.briefReferences.briefId, brief.id)),

    // Reactions for this user
    db
      .select()
      .from(schema.briefReactions)
      .where(
        and(
          eq(schema.briefReactions.briefId, brief.id),
          eq(schema.briefReactions.userId, userId),
        ),
      ),
  ]);

  const likedVideoIds = reactionRows
    .filter((r) => r.reaction === 'like')
    .map((r) => r.videoId);

  const dislikedVideoIds = reactionRows
    .filter((r) => r.reaction === 'dislike')
    .map((r) => r.videoId);

  return {
    ...brief,
    collaborators: collaboratorRows,
    hooks: hookRows,
    referenceVideoIds: referenceRows.map((r) => r.videoId),
    likedVideoIds,
    dislikedVideoIds,
  };
}

// ─── Utility ──────────────────────────────────────────────────────────────────

async function touchBrief(briefId: string): Promise<void> {
  await db
    .update(schema.userBriefs)
    .set({ updatedAt: new Date() })
    .where(eq(schema.userBriefs.id, briefId));
}

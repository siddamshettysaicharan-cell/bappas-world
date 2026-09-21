import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PlayerProfile, LeaderboardEntry } from '../types';

// Retrieve environment variables via Vite's import.meta.env
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseKey = (
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
)?.trim();

let _supabaseClient: SupabaseClient | null = null;

/**
 * Lazily initialize and return the Supabase client
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (_supabaseClient) {
    return _supabaseClient;
  }

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  try {
    _supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return _supabaseClient;
  } catch (error) {
    console.warn('[Supabase] Failed to initialize Supabase client:', error);
    return null;
  }
}

/**
 * Normalizes college name for cross-player matching:
 * - lowercase
 * - trim whitespace
 * - collapse repeated spaces
 * - normalize apostrophes and punctuation
 */
export function normalizeCollege(college: string): string {
  if (!college) return '';
  return college
    .toLowerCase()
    // Replace smart quotes and apostrophes (e.g., 'St. Mary's' vs 'St Marys')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035']/g, '')
    // Replace punctuation with spaces
    .replace(/[^\w\s]/g, ' ')
    // Collapse repeated whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

const PLAYER_STORAGE_KEY = 'ganesha_player_profile';
const PLAYER_ID_STORAGE_KEY = 'ganesha_player_id';

/**
 * Retrieves the saved local player profile from localStorage if present
 */
export function getLocalPlayerProfile(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem(PLAYER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.id || parsed.name)) {
        return parsed as PlayerProfile;
      }
    }
  } catch (e) {
    console.warn('[Storage] Error reading player profile:', e);
  }
  return null;
}

/**
 * Saves player profile to localStorage
 */
export function saveLocalPlayerProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(profile));
    localStorage.setItem(PLAYER_ID_STORAGE_KEY, String(profile.id));
  } catch (e) {
    console.warn('[Storage] Error saving player profile:', e);
  }
}

/**
 * Register a new player in Supabase 'players' table and save to localStorage
 */
export async function registerPlayer(name: string, college: string): Promise<PlayerProfile> {
  const trimmedName = name.trim();
  const trimmedCollege = college.trim();
  const normCollege = normalizeCollege(trimmedCollege);

  const client = getSupabaseClient();
  const payload = {
    name: trimmedName,
    college: trimmedCollege,
    college_normalized: normCollege,
  };

  if (!client) {
    console.info('[Supabase] Client not configured. Using local player ID.');
    const fallbackProfile: PlayerProfile = {
      id: 'player_' + Date.now(),
      ...payload,
    };
    saveLocalPlayerProfile(fallbackProfile);
    return fallbackProfile;
  }

  try {
    const { data, error } = await client
      .from('players')
      .insert([payload])
      .select()
      .single();

    if (error || !data) {
      console.warn('[Supabase] Insert player warning:', error?.message);
      const fallbackProfile: PlayerProfile = {
        id: 'player_' + Date.now(),
        ...payload,
      };
      saveLocalPlayerProfile(fallbackProfile);
      return fallbackProfile;
    }

    const savedProfile: PlayerProfile = {
      id: data.id,
      name: data.name || trimmedName,
      college: data.college || trimmedCollege,
      college_normalized: data.college_normalized || normCollege,
      created_at: data.created_at,
    };

    saveLocalPlayerProfile(savedProfile);
    return savedProfile;
  } catch (err) {
    console.error('[Supabase] Register player exception:', err);
    const fallbackProfile: PlayerProfile = {
      id: 'player_' + Date.now(),
      ...payload,
    };
    saveLocalPlayerProfile(fallbackProfile);
    return fallbackProfile;
  }
}

/**
 * Saves a score record to the Supabase 'scores' table using Highest-Score-Only logic.
 * For the same PLAYER + GAME:
 * - If no record exists: insert new record.
 * - If record exists and new score > previous score: update stored score.
 * - If record exists and new score <= previous score: keep previous score unchanged.
 * - Never create duplicate records for the same player + game.
 */
export async function saveGameScore(scoreData: {
  playerId: string | number;
  gameId: string;
  score: number;
}): Promise<boolean> {
  console.log(`[3 SAVE START] player=${scoreData.playerId} game=${scoreData.gameId} score=${scoreData.score}`);

  const client = getSupabaseClient();
  if (!client) {
    console.info('[Supabase] Client not active, skipping online score save.');
    return false;
  }

  if (scoreData.score < 0) return false;

  const roundedScore = Math.round(scoreData.score);

  try {
    console.log(`[4 DB CHECK] player_id=${scoreData.playerId} game_id=${scoreData.gameId}`);
    // 1. Check if a score entry already exists for this player_id + game_id
    const { data: existingRows, error: fetchErr } = await client
      .from('scores')
      .select('id, player_id, game_id, score')
      .eq('player_id', scoreData.playerId)
      .eq('game_id', scoreData.gameId);

    if (fetchErr) {
      console.error('[8 DB ERROR] Failed to fetch existing scores:', fetchErr.message, fetchErr);
    }

    console.log('[5 EXISTING RECORD]', existingRows);

    if (!existingRows || existingRows.length === 0) {
      // Case A: No existing record for this player + game -> Insert new record
      console.log('[6 DB ACTION] INSERT');
      const payload = {
        player_id: scoreData.playerId,
        game_id: scoreData.gameId,
        score: roundedScore,
      };

      const { data: insertData, error: insertErr } = await client.from('scores').insert([payload]).select();
      if (insertErr) {
        console.error('[8 DB ERROR] Failed to insert new score:', insertErr.message, insertErr);
        return false;
      }

      console.log('[7 DB RESULT]', insertData || payload);
      return true;
    } else {
      // Case B: Existing score record(s) found
      let maxExistingScore = existingRows[0].score;
      let primaryRow = existingRows[0];

      for (const row of existingRows) {
        if (row.score > maxExistingScore) {
          maxExistingScore = row.score;
          primaryRow = row;
        }
      }

      // Clean up any historical duplicate rows for the same player + game
      if (existingRows.length > 1) {
        const duplicateIds = existingRows
          .filter((r) => r.id !== primaryRow.id)
          .map((r) => r.id);
        if (duplicateIds.length > 0) {
          await client.from('scores').delete().in('id', duplicateIds);
        }
      }

      if (roundedScore > maxExistingScore) {
        // New score is higher -> Update stored score
        console.log(`[6 DB ACTION] UPDATE (new ${roundedScore} > existing ${maxExistingScore})`);
        const { data: updateData, error: updateErr } = await client
          .from('scores')
          .update({ score: roundedScore })
          .eq('id', primaryRow.id)
          .select();

        if (updateErr) {
          console.error('[8 DB ERROR] Failed to update score:', updateErr.message, updateErr);
          return false;
        }

        console.log('[7 DB RESULT]', updateData);
        return true;
      } else {
        // New score is lower or equal -> Keep existing score
        console.log(`[6 DB ACTION] KEEP_EXISTING (new ${roundedScore} <= existing ${maxExistingScore})`);
        console.log('[7 DB RESULT]', primaryRow);
        return true;
      }
    }
  } catch (err) {
    console.error('[8 DB ERROR] Exception in saveGameScore:', err);
    return false;
  }
}

/**
 * Fetches the leaderboard for a specific game_id from Supabase.
 * Guarantees exactly ONE row per player for that game with their HIGHEST score.
 */
export async function fetchGameLeaderboard(gameId: string): Promise<LeaderboardEntry[]> {
  console.log(`[LB QUERY START] fetchGameLeaderboard called`);
  console.log(`[LB QUERY PARAMS] game_id=${gameId}`);

  const client = getSupabaseClient();
  if (!client) {
    console.error(`[LB SUPABASE ERROR] Supabase client is null or inactive`);
    return [];
  }

  try {
    let rawEntries: LeaderboardEntry[] = [];

    // Attempt 1: Fetch scores with joined players table
    console.log(`[LB QUERY START] Attempting joined query for game_id=${gameId}`);
    const { data: joinData, error: joinError } = await client
      .from('scores')
      .select('id, player_id, game_id, score, created_at, players ( id, name, college, college_normalized )')
      .eq('game_id', gameId)
      .order('score', { ascending: false })
      .limit(200);

    console.log(`[LB SUPABASE RESPONSE] Joined query joinData:`, joinData);
    if (joinError) {
      console.warn(`[LB SUPABASE ERROR] Joined query returned error (falling back to standalone):`, joinError.message, joinError);
    }

    if (!joinError && joinData && joinData.length > 0) {
      console.log(`[LB ROW COUNT] Joined query row count: ${joinData.length}`);
      try {
        rawEntries = joinData.map((row) => {
          const p = Array.isArray(row.players) ? row.players[0] : row.players;
          const pName = p?.name || 'Devotee';
          const pCollege = p?.college || 'Campus';
          const pCollegeNorm = p?.college_normalized || normalizeCollege(pCollege);

          return {
            id: row.id,
            playerId: row.player_id,
            playerName: pName,
            college: pCollege,
            collegeNormalized: pCollegeNorm,
            gameId: row.game_id,
            score: row.score,
            createdAt: row.created_at,
          };
        });
      } catch (mapErr) {
        console.error(`[LB PROCESSING ERROR] Error mapping joinData:`, mapErr);
      }
    } else {
      // Attempt 2: Standalone queries if relation embedding isn't mapped
      console.log(`[LB QUERY START] Attempting standalone query for scores with game_id=${gameId}`);
      const { data: rawScores, error: scoresError } = await client
        .from('scores')
        .select('id, player_id, game_id, score, created_at')
        .eq('game_id', gameId)
        .order('score', { ascending: false })
        .limit(200);

      console.log(`[LB SUPABASE RESPONSE] Standalone query rawScores:`, rawScores);
      if (scoresError) {
        console.error(`[LB SUPABASE ERROR] Standalone query error:`, scoresError.message, scoresError);
      }

      if (scoresError || !rawScores || rawScores.length === 0) {
        console.log(`[LB ROW COUNT] Standalone query row count: ${rawScores?.length || 0}`);
        console.log(`[LB RAW DATA] No scores found for game_id=${gameId}`);
        console.log(`[LB FINAL DATA] Returning empty array for game_id=${gameId}`);
        return [];
      }

      console.log(`[LB ROW COUNT] Standalone query row count: ${rawScores.length}`);

      const playerIds = Array.from(
        new Set(rawScores.map((s) => s.player_id).filter((id): id is string | number => id != null))
      );
      console.log(`[LB QUERY PARAMS] Fetching players for playerIds:`, playerIds);

      let playersMap = new Map<string, { name?: string; college?: string; college_normalized?: string }>();

      if (playerIds.length > 0) {
        try {
          const { data: playersList, error: playersErr } = await client
            .from('players')
            .select('id, name, college, college_normalized')
            .in('id', playerIds);

          console.log(`[LB SUPABASE RESPONSE] Players query playersList:`, playersList);
          if (playersErr) {
            console.error(`[LB SUPABASE ERROR] Players query error:`, playersErr.message, playersErr);
          }

          if (playersList) {
            playersMap = new Map(
              playersList.map((p) => [String(p.id), {
                name: p.name,
                college: p.college,
                college_normalized: p.college_normalized,
              }])
            );
          }
        } catch (pQueryErr) {
          console.error(`[LB PROCESSING ERROR] Exception during players lookup:`, pQueryErr);
        }
      }

      try {
        rawEntries = rawScores.map((row) => {
          const p = playersMap.get(String(row.player_id));
          const pName = p?.name || 'Devotee';
          const pCollege = p?.college || 'Campus';
          const pCollegeNorm = p?.college_normalized || normalizeCollege(pCollege);

          return {
            id: row.id,
            playerId: row.player_id,
            playerName: pName,
            college: pCollege,
            collegeNormalized: pCollegeNorm,
            gameId: row.game_id,
            score: row.score,
            createdAt: row.created_at,
          };
        });
      } catch (sMapErr) {
        console.error(`[LB PROCESSING ERROR] Exception mapping rawScores:`, sMapErr);
      }
    }

    console.log(`[LB RAW DATA] rawEntries count: ${rawEntries.length}`, rawEntries);

    // Deduplicate entries so that each player appears ONLY ONCE with their HIGHEST score for this game
    const uniquePlayerMap = new Map<string, LeaderboardEntry>();

    try {
      for (const entry of rawEntries) {
        const key = entry.playerId != null
          ? String(entry.playerId)
          : `${entry.playerName.toLowerCase()}_${entry.collegeNormalized}`;

        const existing = uniquePlayerMap.get(key);
        if (!existing) {
          uniquePlayerMap.set(key, entry);
        } else {
          if (entry.score > existing.score) {
            uniquePlayerMap.set(key, entry);
          }
        }
      }
    } catch (dedupErr) {
      console.error(`[LB PROCESSING ERROR] Exception during deduplication:`, dedupErr);
    }

    // Sort deduplicated players by highest score descending and assign 1-based ranks
    const sortedDeduplicated = Array.from(uniquePlayerMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 100)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    console.log(`[LB FINAL DATA] sortedDeduplicated count: ${sortedDeduplicated.length}`, sortedDeduplicated);
    return sortedDeduplicated;
  } catch (err) {
    console.error(`[LB PROCESSING ERROR] Unhandled exception in fetchGameLeaderboard:`, err);
    return [];
  }
}

/**
 * Health / connection verification
 */
export async function verifySupabaseConnection(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('players').select('id', { count: 'exact', head: true });
    return !error;
  } catch {
    return false;
  }
}

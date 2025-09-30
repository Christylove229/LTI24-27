import { supabase } from '../lib/supabase';

export interface ReactionCounts {
  like: number;
  love: number;
  laugh: number;
  annoyed: number;
  clap: number;
  cry: number;
  angry: number;
}

export const getReactionCounts = async (targetType: 'post' | 'comment', targetId: string): Promise<ReactionCounts> => {
  try {
    const { data, error } = await supabase
      .from('reactions')
      .select('reaction_type')
      .eq('target_type', targetType)
      .eq('target_id', targetId);

    if (error) throw error;

    const counts: ReactionCounts = {
      like: 0,
      love: 0,
      laugh: 0,
      annoyed: 0,
      clap: 0,
      cry: 0,
      angry: 0
    };

    data?.forEach(reaction => {
      const type = reaction.reaction_type as keyof ReactionCounts;
      if (counts[type] !== undefined) {
        counts[type]++;
      }
    });

    return counts;
  } catch (error) {
    console.error('Error fetching reaction counts:', error);
    return {
      like: 0,
      love: 0,
      laugh: 0,
      annoyed: 0,
      clap: 0,
      cry: 0,
      angry: 0
    };
  }
};

export const getUserReaction = async (targetType: 'post' | 'comment', targetId: string, userId: string): Promise<string | null> => {
  try {
    // Utiliser maybeSingle() au lieu de single() pour éviter les erreurs quand il n'y a pas de résultat
    const { data, error } = await supabase
      .from('reactions')
      .select('reaction_type')
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user reaction:', error);
      return null;
    }

    return data?.reaction_type || null;
  } catch (error) {
    console.error('Error in getUserReaction:', error);
    return null;
  }
};

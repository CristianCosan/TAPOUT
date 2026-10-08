// Ported from legacy/tap-out-v12.html (lines 5639-5661). The code is v12's own,
// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation
// calls routed through ./ui.ts. Parity with the original is enforced by tests.

import { S } from './state.ts';
// ============================== v11 §5: emergent temperament tags ==============================
export function applyTagDeltas(deltas?){
  if (!deltas || !S.tags) return;
  for (const k in deltas) S.tags[k] = (S.tags[k]||0) + deltas[k];
}
export function dominantTagAxis(){
  const pairs = [['proud','humble'],['bold','cautious'],['hard','tender'],['practical','spiritual']];
  let best=null, bestVal=0;
  pairs.forEach(([a,b]) => {
    const va=S.tags[a]||0, vb=S.tags[b]||0;
    if (Math.max(va,vb) > bestVal){ bestVal = Math.max(va,vb); best = va>=vb ? a : b; }
  });
  const NAMED = {
    proud:"Proud to the end - you'd rather have gone down doing it your way than lasted longer doing it someone else's.",
    humble:"You never did make it about you, not really - the tally tree remembers plenty of days you barely mentioned.",
    bold:"Bold, the whole way through - you went toward the noise more often than you walked away from it.",
    cautious:"Careful, deliberately, on purpose - you're still here to be careful because of it, not despite it.",
    hard:"Hard when hard was what the day needed. You don't apologize for that, and you shouldn't.",
    tender:"Tender under all of it, even when tender wasn't the easy choice out here.",
    practical:"Practical to the bone - you solved what was in front of you and let the rest wait its turn.",
    spiritual:"You never stopped talking to the lake, even when it never once talked back.",
  };
  return bestVal >= 3 ? NAMED[best] : null;
}


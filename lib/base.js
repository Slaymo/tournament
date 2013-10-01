var $ = require('interlude');
var T = require('./public');

// constants TODO: move in here?
//var T = require('./public');

function Base(ms) {
  this.matches = ms;
}

// stuff that individual implementations can override
// Used by FFA, GroupStage, TieBreaker
// KnockOut + Duel implement slightly different versions
Base.prototype.isDone = function () {
  return this.matches.every($.get('m'));
};

// TODO: upcoming without playerId?
// Default used by Duel, KnockOut, GroupStage, TieBreaker
// FFA adds extra logic as tournament is in limbo until all matches scored
Base.prototype.upcoming = function (playerId) {
  // find first unplayed, pick by round asc [matches are sorted, can pick first]
  for (var i = 0; i < this.matches.length; i += 1) {
    var m = this.matches[i];
    if (m.p.indexOf(playerId) >= 0 && !m.m) {
      return m.id;
    }
  }
};

Base.prototype.unscorable = function (id, score, allowPast) {
  var m = this.findMatch(id);
  if (!m) {
    return "match not found in tournament"; // TODO: idString || %j ?
  }
  if (m.p.some($.eq(T.NA))) {
    return "match not ready - missing players";
  }
  if (!Array.isArray(score) || !score.every(Number.isFinite)) {
    return "scores must be a numeric array";
  }
  if (score.length !== m.p.length) {
    return "scores must have length " + m.p.length;
  }
  if (!allowPast && Array.isArray(m.m)) {
    return "cannot re-score match";
  }
  return null;
};

/*
Base.prototype.scoreRaw = function (id, mapScore) {
  // assumes !SubClass.unscorable
  var m = this.findMatch(id);
  m.m = mapScore;
  return m;
};
*/

// Public API extensions
// matches are stored in a sorted array rather than an ID -> Match map
// This is because ordering is more important than being able to access any match
// at any time. Looping to find the one is also quick because ms is generally short.
Base.prototype.findMatch = function (id) {
  for (var i = 0; i < this.matches.length; i += 1) {
    var m = this.matches[i];
    if (m.id.s === id.s && m.id.r === id.r && m.id.m === id.m) {
      return m;
    }
  }
};

// filter from this.matches for everything matching a partial Id
Base.prototype.findMatches = function (id) {
  return this.matches.filter(function (m) {
    return (id.s == null || m.id.s === id.s)
        && (id.r == null || m.id.r === id.r)
        && (id.m == null || m.id.m === id.m);
  });
};

// These 2 are used in FFA
// section argument optional
// should we include these?:
// -useful in Duel? scoring at different rate..
// -fairly useless in KnockOut
// -fairly useless in TieBreaker
// -useful in FFA! (could use them in upcoming as well)

// partition matches into rounds (section optional)
Base.prototype.rounds = function (section) {
  var rnds = [];
  for (var i = 0; i < this.matches.length; i += 1) {
    var m = this.matches[i];
    if (section != null && m.id.s !== section) {
      continue;
    }
    if (!Array.isArray(rnds[m.id.r - 1])) {
      rnds[m.id.r - 1] = [];
    }
    rnds[m.id.r - 1].push(m);
  }
  return rnds;
};


// not in use yet:


// tells if every match in the same section and same round as `id` have scores set
/*Base.prototype.isRoundDone = function (id) {
  return this.matches.every(function (m) {
    return m.id.s === id.s && m.id.r === id.r && Array.isArray(m.m);
  });
};

Base.prototype.currentRound = function (section) {
  var rnds = this.getRounds(section);
  for (var i = 0; i < rnds.length; i += 1) {
    var r = rnds[i];
    if (!this.isRoundDone(r[0].id)) {
      return r;
    }
  }
};

Base.prototype.nextRound = function (section) {
  var rnds = this.getRounds(section);
  for (var i = 0; i < rnds.length; i += 1) {
    var r = rnds[i];
    if (!this.isRoundDone(r)) {
      return rnds[i + 1]; // may be undefined
    }
  }
};


// get all matches in the same round and section as `id`
Base.prototype.getRound = function (id) {
  // TODO: if we cache rounds, lookup rather than filter
  return this.matches.filter(function (m) {
    return (id.s === m.id.s && id.r === m.id.r);
  });
};

// pass it subset of matches, or a round to get players in a round
Base.prototype.getPlayers = function (matches) {
  var ms = matches || this.matches;
  var ps = [];
  for (var i = 0; i < ms.length; i += 1) {
    var m = ms[i];
    ps = ps.concat(m.p);
  }
  return $.nub(ps);
};*/

module.exports = Base;


function Results(res) {
  this.results = res;
}

Results.prototype.forSeed = function (seed) {
  for (var i = 0; i < this.results.length; i += 1) {
    var r = this.results[i];
    if (r[i].seed === seed) {
      return r;
    }
  }
};
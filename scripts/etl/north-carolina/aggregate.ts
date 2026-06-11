/**
 * North Carolina districts aggregation — typed port of
 * `apps/north-carolina/script/format-display-data.coffee` (`getData`).
 *
 * Joins census-block features with a precinct-level voter tally to produce the
 * flat per-block array in `display-data.json` (district, point, census stats,
 * democrat/republican vote share).
 */

/** Census variable code -> output field name (subset the legacy code emits). */
const CENSUS_KEYS: Record<string, string> = {
  B01001e1: 'pop',
  B02001e2: 'white',
  B02001e3: 'black',
  B02001e5: 'asian',
  B09002e1: 'children',
  B09017e1: '65',
  B17017e2: 'poverty',
  B21001e2: 'veteran',
  B23025e4: 'employed',
  B23025e5: 'unemployed',
  B23025e6: 'armed',
};

interface CensusProperties {
  district?: string;
  GEOID?: string;
  prec_id?: string;
  /** Census variable codes (e.g. "B01001e1") and any other numeric fields. */
  [code: string]: number | string | undefined;
}

export interface CensusFeature {
  geometry: { coordinates?: [number, number] };
  properties: CensusProperties;
}

export interface RawVote {
  precinct_abbrv: string;
  party_cd: 'REP' | 'DEM' | 'UNA' | 'LIB' | string;
  total_voters: number | string;
}

export interface DistrictBlock {
  district?: string;
  point?: [number, number];
  id?: string;
  bachelors: number;
  democrat?: number;
  republican?: number;
  [field: string]: number | string | [number, number] | undefined;
}

interface PrecinctTally {
  REP: number;
  DEM: number;
  UNA: number;
  LIB: number;
  total: number;
}

/** Sum voters per precinct (port of tallyVotesByPrec). Keyed by `precinct_abbrv`. */
export function tallyVotesByPrecinct(rawVotes: RawVote[]): Record<string, PrecinctTally> {
  const votes: Record<string, PrecinctTally> = {};
  for (const vote of rawVotes) {
    const key = vote.precinct_abbrv;
    votes[key] ||= { REP: 0, DEM: 0, UNA: 0, LIB: 0, total: 0 };
    const n = Number(vote.total_voters);
    if (vote.party_cd in votes[key]) {
      (votes[key] as unknown as Record<string, number>)[vote.party_cd] += n;
    }
    votes[key].total += n;
  }
  return votes;
}

/**
 * Build the flat per-block array. Features without geometry coordinates yield
 * `undefined` (faithful to the legacy comprehension); callers can `.filter(Boolean)`.
 *
 * NOTE: the legacy code tallies votes by `precinct_abbrv` but looks them up by
 * the feature's `prec_id`; preserved as-is. A block whose `prec_id` has no tally
 * gets no democrat/republican fields.
 */
export function getDistrictData(
  features: CensusFeature[],
  rawVotes: RawVote[],
): (DistrictBlock | undefined)[] {
  const votes = tallyVotesByPrecinct(rawVotes);

  return features.map((feature) => {
    if (!feature.geometry.coordinates) return undefined;
    const p = feature.properties;
    const data: DistrictBlock = {
      district: p.district,
      point: feature.geometry.coordinates,
      id: p.GEOID,
      bachelors: 0,
    };

    for (const key of Object.keys(CENSUS_KEYS)) {
      data[CENSUS_KEYS[key]] = p[key] as number;
    }
    data.bachelors = Number(p['B15002e15'] ?? 0) + Number(p['B15002e32'] ?? 0);

    const precID = p.prec_id;
    const tally = precID ? votes[precID] : undefined;
    if (tally) {
      data.democrat = (tally.DEM / tally.total) * 100;
      data.republican = (tally.REP / tally.total) * 100;
    }
    return data;
  });
}

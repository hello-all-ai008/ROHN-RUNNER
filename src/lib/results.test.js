import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeRunner,
  isMale,
  isFemale,
  parseTimeToEpoch,
  getRunnerStartTime,
  getRunnerNetTime,
  compareRunnerNetTime,
  isFinisher,
  getOverallLeaders,
  computeRank,
  formatDuration,
  getRunnerRaceStatus,
  checkpointTimeline,
  topNByGroup
} from './results.js';

test('isMale and isFemale gender parsing', () => {
  assert.equal(isMale('M'), true);
  assert.equal(isMale('Male'), true);
  assert.equal(isMale('ชาย'), true);
  assert.equal(isMale('F'), false);

  assert.equal(isFemale('F'), true);
  assert.equal(isFemale('Female'), true);
  assert.equal(isFemale('หญิง'), true);
  assert.equal(isFemale('M'), false);
});

test('parseTimeToEpoch handles epoch numbers, ISO strings, and HH:mm:ss', () => {
  const epoch = 1757462400000;
  assert.equal(parseTimeToEpoch(epoch), epoch);
  assert.equal(parseTimeToEpoch(String(epoch)), epoch);

  const iso = '2025-09-10T06:00:00.000Z';
  assert.equal(parseTimeToEpoch(iso), new Date(iso).getTime());

  assert.equal(parseTimeToEpoch(null), null);
  assert.equal(parseTimeToEpoch(''), null);
});

test('getRunnerStartTime gives priority to gun_start_time and rejects start times after finish', () => {
  const finishEpoch = 1757470000000;
  const startEpoch = 1757460000000;

  // 1. Explicit gun_start_time
  const r1 = { gun_start_time: startEpoch, checked_in_at: startEpoch - 3600000 };
  assert.equal(getRunnerStartTime(r1, finishEpoch), startEpoch);

  // 2. Reject start after finish
  const r2 = { gun_start_time: finishEpoch + 1000 };
  assert.equal(getRunnerStartTime(r2, finishEpoch), null);

  // 3. Fallback to start checkpoint in cps
  const r3 = {
    cps: { 'station_start': startEpoch, 'station_cp1': startEpoch + 1000 }
  };
  assert.equal(getRunnerStartTime(r3, finishEpoch), startEpoch);

  // 4. Checkin time is NOT mistaken for start time
  const r4 = {
    checked_in_at: '2025-09-10T05:00:00.000Z',
    checkin: 1757458000000
  };
  assert.equal(getRunnerStartTime(r4, finishEpoch), null);
});

test('getRunnerNetTime accurately calculates finish - start duration', () => {
  const start = 1757460000000; // 06:00
  const finish = 1757467200000; // 08:00 (2 hours = 7,200,000 ms)

  const runner = {
    gun_start_time: start,
    finish: finish
  };

  const net = getRunnerNetTime(runner);
  assert.equal(net.isNet, true);
  assert.equal(net.finishEpoch, finish);
  assert.equal(net.startEpoch, start);
  assert.equal(net.netTimeMs, 7200000);
  assert.equal(formatDuration(net.netTimeMs), '02:00:00');

  // Missing finish
  const unfinished = { gun_start_time: start, finish: null };
  assert.equal(getRunnerNetTime(unfinished).isNet, false);

  // Finish before start (invalid)
  const invalid = { gun_start_time: finish, finish: start };
  assert.equal(getRunnerNetTime(invalid).isNet, false);
});

test('getRunnerRaceStatus handles admin overrides, finish, and DNF/DNS/IN_RACE states', () => {
  // 1. Admin overrides take precedence
  assert.equal(getRunnerRaceStatus({ race_status: 'DNF', finish: 1757470000000 }), 'DNF');
  assert.equal(getRunnerRaceStatus({ race_status: 'DNS', checked_in_at: '2025-09-10T05:00:00Z' }), 'DNS');

  // 2. Finished
  assert.equal(getRunnerRaceStatus({ finish: 1757470000000 }), 'FINISHED');

  // 3. DNS when neither checked in nor scanned anywhere
  assert.equal(getRunnerRaceStatus({ checked_in_at: null, cps: {} }), 'DNS');

  // 4. IN_RACE when checked in without finish
  assert.equal(getRunnerRaceStatus({ checked_in_at: '2025-09-10T05:30:00Z', cps: {} }), 'IN_RACE');

  // 5. Automatic DNF when finish_cutoff_time is past
  const pastCutoff = new Date(Date.now() - 60000).toISOString();
  assert.equal(getRunnerRaceStatus({ checked_in_at: '2025-09-10T05:30:00Z', finish_cutoff_time: pastCutoff }), 'DNF');
});

test('checkpointTimeline builds ordered stations with Check in, Start, CPs, and Finish', () => {
  const checkedInAt = '2025-09-10T05:00:00.000Z';
  const gunStart = '2025-09-10T06:00:00.000Z';
  const cps = {
    '3b63e9b7-4dbf-432e-8281-e8d7e4d22d8b': 1757463600000 // A1
  };
  const finish = 1757470000000;

  const timeline = checkpointTimeline(cps, finish, checkedInAt, gunStart);
  assert.equal(timeline.length, 4);
  assert.equal(timeline[0].label, 'Check in');
  assert.equal(timeline[1].label, 'Start');
  assert.equal(timeline[2].label, 'A1');
  assert.equal(timeline[3].label, 'Finish');
});

test('getOverallLeaders passes cat_color through from the winning runner, falling back to null when unset', () => {
  const colored = { bib: '2001', distance: '10KM', gender: 'M', gun_start_time: 1000, finish: 5000, cat_color: '#aa1ef6' };
  const uncolored = { bib: '3001', distance: '21KM', gender: 'M', gun_start_time: 1000, finish: 5000 };

  const { overallLeaders } = getOverallLeaders([colored, uncolored]);

  const tenK = overallLeaders.find((l) => l.distance === '10KM');
  const twentyOneK = overallLeaders.find((l) => l.distance === '21KM');

  assert.equal(tenK.cat_color, '#aa1ef6');
  assert.equal(twentyOneK.cat_color, null);
});

test('topNByGroup passes cat_color through from the group\'s runners', () => {
  const r1 = { bib: '4001', distance: '10KM', age_group: '30-39', gender: 'M', gun_start_time: 1000, finish: 5000, cat_color: '#0891b2' };

  const groups = topNByGroup([r1], 5);
  const group = groups.find((g) => g.distance === '10KM' && g.age_group === '30-39' && g.gender === 'M');

  assert.equal(group.cat_color, '#0891b2');
});

test('computeRank ranks finishers by Net Time ascending', () => {
  const r1 = { bib: '1001', distance: '10KM', age_group: '30-39', gender: 'M', gun_start_time: 1000, finish: 5000 }; // 4000ms
  const r2 = { bib: '1002', distance: '10KM', age_group: '30-39', gender: 'M', gun_start_time: 1000, finish: 4000 }; // 3000ms
  const r3 = { bib: '1003', distance: '10KM', age_group: '30-39', gender: 'M', gun_start_time: 1000, finish: 6000 }; // 5000ms

  const all = [r1, r2, r3];
  // r2 is overall winner (3000ms) -> rank 1
  assert.equal(computeRank(r2, all, true), 1);
  // r1 is 2nd overall, so in age group after excluding overall winner r2, r1 is rank 1
  assert.equal(computeRank(r1, all, true), 1);
  // r3 is rank 2 in age group
  assert.equal(computeRank(r3, all, true), 2);
});

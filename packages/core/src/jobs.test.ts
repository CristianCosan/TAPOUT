// rc.8 intended differences: build steps in small jobs (jobBuilds) and Sir's times (sirTimes).

import { beforeEach, describe, expect, it } from 'vitest';
import { jobPlan, setPresenter, startRun, TAPOUT_RULES, type RuleSet, type Run } from './game.ts';

beforeEach(() => setPresenter({ showModal: () => {}, hideModal: () => {}, typewriterInto: () => {} }));

function start(rules: Readonly<RuleSet> = TAPOUT_RULES): Run {
  const kit = ['axe', 'saw', 'ferro', 'pot', 'knife', 'sleeping', 'tarp', 'line', 'snare', 'shovel'];
  const run = startRun({ seed: 'jobs', kit, backstory: { who: 'partner', fear: 'failing' }, name: 'Dan', heightCm: 178, startWeightKg: 88, sex: 'man', rules });
  run.state.loc = 'camp';
  run.state.hour = 8;
  run.state.energy = 100;
  run.state.weather = 'overcast';
  run.state.stock.wood = 20;
  run.state.stock.moss = 10;
  return run;
}
const minutes = (run: Run) => run.state.day * 24 * 60 + run.state.hour * 60;
const took = (run: Run, fn: () => void) => {
  const t = minutes(run);
  fn();
  return Math.round(minutes(run) - t);
};

describe('rc.8 jobBuilds', () => {
  it('a step done job by job costs what the whole step costs, and does the same', () => {
    const whole = start({ ...TAPOUT_RULES, jobBuilds: false });
    const t0 = minutes(whole), e0 = whole.state.energy;
    whole.call('actShelter');
    const jobs = start();
    const t1 = minutes(jobs), e1 = jobs.state.energy;
    for (let i = 0; i < 4; i += 1) jobs.call('actJob', 'shelter.1');
    expect(jobs.state.buildProg).toBe(whole.state.buildProg);
    expect(jobs.state.stock.wood).toBe(whole.state.stock.wood);
    expect(minutes(jobs) - t1).toBeCloseTo(minutes(whole) - t0, 5);
    expect(Math.abs(e1 - jobs.state.energy - (e0 - whole.state.energy))).toBeLessThanOrEqual(2);
    expect(jobs.state.jobs['shelter.1']).toBeUndefined();
  });

  it('each job takes its own time, energy and materials, and you can stop after any', () => {
    const run = start();
    const plan = jobPlan('shelter.1')!;
    expect(plan.of).toBe(4);
    expect(plan.jobs.map((j) => j.needs.wood ?? 0)).toEqual([0, 5, 0, 0]);
    const t = minutes(run);
    run.call('actJob', 'shelter.1');
    expect(minutes(run) - t).toBeCloseTo(plan.jobs[0]!.hours * 60, 5);
    expect(run.state.stock.wood).toBe(20);
    run.call('actJob', 'shelter.1');
    expect(run.state.stock.wood).toBe(15);
    expect(run.state.buildProg).toBe(0);
    expect(jobPlan('shelter.1')!.done).toBe(2);
  });

  it('a job you do not have the materials for is refused', () => {
    const run = start();
    run.state.stock.wood = 2;
    run.call('actJob', 'shelter.1');
    run.call('actJob', 'shelter.1');
    expect(jobPlan('shelter.1')!.done).toBe(1);
    expect(run.state.stock.wood).toBe(2);
  });

  it('a first job on the shelter closes the dugout', () => {
    start();
    expect(jobPlan('dugout.1')!.open).toBe(true);
    const run = start();
    run.call('actJob', 'shelter.1');
    expect(jobPlan('dugout.1')!.open).toBe(false);
  });
});

describe('rc.8 sirTimes', () => {
  it('travel is 10 minutes, 20 once winter has come', () => {
    const run = start();
    expect(took(run, () => run.call('goTo', 'shore'))).toBe(10);
    run.state.winter = true;
    expect(took(run, () => run.call('goTo', 'camp'))).toBe(20);
  });

  it('his times for the everyday jobs', () => {
    const run = start();
    const h = (key: string) => (run.call('hoursFor', key) as number) * 60;
    expect(h('forage')).toBeCloseTo(20);
    expect(h('tinder')).toBeCloseTo(3);
    expect(h('setSnare')).toBeCloseTo(2);
    expect(h('checkSnare')).toBeCloseTo(2);
    expect(h('scout')).toBeCloseTo(15);
    expect(h('follow')).toBeCloseTo(25);
    expect(h('wood')).toBeCloseTo(40);
    expect(h('carveBig')).toBeCloseTo(135);
    expect(h('carveMoose')).toBeCloseTo(300);
  });

  it('the ferro rod takes 1-2 minutes dry, 1-5 in rain, 5-15 after days of it', () => {
    const run = start();
    run.state.stock.firewood = 1000;
    run.state.tinder = 1000;
    const light = () => {
      run.state.fireH = 0;
      run.state.hour = 9;
      return took(run, () => run.call('actFire'));
    };
    for (let i = 0; i < 20; i += 1) {
      const m = light();
      expect(m).toBeGreaterThanOrEqual(1);
      expect(m).toBeLessThanOrEqual(2);
    }
    run.state.weather = 'rain';
    for (let i = 0; i < 20; i += 1) expect(light()).toBeLessThanOrEqual(5);
    run.state.wetDays = 3;
    for (let i = 0; i < 20; i += 1) {
      const m = light();
      expect(m).toBeGreaterThanOrEqual(5);
      expect(m).toBeLessThanOrEqual(15);
    }
  });
});

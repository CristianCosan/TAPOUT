import { describe, expect, it } from 'vitest';
import { JOB_SPLIT } from '@tapout/core';
import { BUILD_TASKS, P1, RIVALS } from './index.ts';

describe('content', () => {
  it('keeps the protagonist on the body v12 was balanced for', () => {
    expect(P1.heightCm).toBe(178);
    expect(P1.startWeightKg).toBe(88);
  });

  it('has nine rivals, none using a v12 name', () => {
    expect(RIVALS).toHaveLength(9);
    for (const rival of RIVALS) expect(rival.name).not.toBe(rival.v12);
  });
});

describe('rc.8 build jobs', () => {
  it('every build task has exactly the jobs the core splits its step into', () => {
    expect(Object.keys(JOB_SPLIT).sort()).toEqual(Object.keys(BUILD_TASKS).sort());
    for (const [key, task] of Object.entries(BUILD_TASKS)) expect(task.jobs.length, key).toBe(JOB_SPLIT[key]!.length);
  });
});

describe('rc.8 build jobs', () => {
  it('every build task has exactly the jobs the core splits its step into', () => {
    expect(Object.keys(JOB_SPLIT).sort()).toEqual(Object.keys(BUILD_TASKS).sort());
    for (const [key, task] of Object.entries(BUILD_TASKS)) expect(task.jobs.length, key).toBe(JOB_SPLIT[key]!.length);
  });
});
